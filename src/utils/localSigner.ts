const SIGNER_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:7070'
  : 'https://localhost:7443';
export async function isSignerRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${SIGNER_BASE}/signservice/health`, {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface Certificate {
  certName: string;
  serialNo: string;
  issuerName: string;
  validityDate: string;
}

export type ValidationChecks = Record<string, string | boolean>;

export const VALIDATION_CHECK_KEYS = [
  'Date validation',
  'CCA ROOT SKI validation',
  'Issuer validation',
  'Has Private Key',
  'Certificate chain installed?',
  'CA validation',
  'Class validation',
  'Chain validation',
  'Is signing allowed',
  'CRL validation',
] as const;

export interface SignResult {
  signature: string;
  cert: string;
  version?: string;
}

export async function getCertificates(): Promise<Certificate[]> {
  const response = await fetch(`${SIGNER_BASE}/signservice/signdata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      methodName: 'getCertificate',
      ServerDate: new Date().toISOString().split('T')[0]
    })
  });
  if (!response.ok) throw new Error(`Signer returned HTTP ${response.status}`);
  const result = await response.json();
  if (result.flag !== 'true') throw new Error(result.msg || 'Failed to fetch certificates from USB token');
  if (Array.isArray(result.certificates)) return result.certificates;
  if (Array.isArray(result.certList)) return result.certList;
  if (result.certName) return [result];
  return [];
}

export async function validateCertificate(certSerialNo: string): Promise<ValidationChecks> {
  const response = await fetch(`${SIGNER_BASE}/signservice/signdata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      methodName: 'validateCertificate',
      certSerialNo,
      ServerDate: new Date().toISOString().split('T')[0]
    })
  });
  if (!response.ok) throw new Error(`Signer returned HTTP ${response.status}`);
  const result = await response.json();
  return result.validationStatus || result.validation || {};
}

// Signs CGM text content via the local PKI signer Java server.
// When certSerialNo is provided, the signer skips the certificate popup
// and goes straight to the PIN dialog.
export async function signCgmContent(fileContent: string, certSerialNo?: string): Promise<SignResult> {
  const base64Data = btoa(fileContent);
  const body: Record<string, string> = {
    methodName: 'icegateJsonSignNcodeUtil',
    dataToSign: base64Data,
    ServerDate: new Date().toISOString().split('T')[0]
  };
  if (certSerialNo) body.certSerialNo = certSerialNo;

  const response = await fetch(`${SIGNER_BASE}/signservice/signdata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Signer returned HTTP ${response.status}`);
  const result = await response.json();
  if (result.flag !== 'true') throw new Error(result.msg || 'Signing failed — check your USB token and PIN');
  return { signature: result.signature, cert: result.cert, version: result.version };
}

// Appends the signature/certificate/version to the original CGM content and
// downloads it as {originalName}Signed.cgm  (plain text, same format ICEGATE expects)
export function downloadSignedCgm(
  originalContent: string,
  signature: string,
  cert: string,
  cgmFileName: string
): void {
  const signedContent =
    `${originalContent}\n` +
    `<START-SIGNATURE>${signature}</START-SIGNATURE>\n` +
    `<START-CERTIFICATE>${cert}</START-CERTIFICATE>\n` +
    `<SIGNER-VERSION>V-NCODE_01.05.2013</SIGNER-VERSION>`;

  // Custom non-sniffable MIME type. Both text/plain and application/octet-stream
  // are in the browser's MIME-sniffing set — since CGM content is plain ASCII,
  // Chrome sniffs it back to text/plain and Android renames the file to .txt.
  // A made-up application/x-* type is never sniffed and keeps the filename as-is.
  const blob = new Blob([signedContent], { type: 'application/x-ices-manifest' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cgmFileName.replace(/\.cgm$/i, 'Signed.cgm');
  link.click();
  window.URL.revokeObjectURL(url);
}

export const SIGNER_SETUP_MSG =
  'Local PKI Signer is not running. Please start the signer application, then open ' +
  'http://localhost:12591 in your browser once to accept the certificate, and try again.';
