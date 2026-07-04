const MANIFEST_MIME = 'application/x-ices-manifest';

export type DeliverResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Delivers a generated ICES file (CGM/IGM/EGM) to the user.
 *
 * On mobile browsers that support sharing files via the Web Share API
 * (Android Chrome and most mobile browsers), this opens the native
 * "Share via..." sheet directly — e.g. straight to WhatsApp — so the file
 * never touches the public Downloads folder. That matters because Android's
 * background media scanner independently re-inspects any file dropped into
 * Downloads and can relabel its MIME type based on its own content sniffing;
 * since these manifest files are mostly plain ASCII, the scanner sometimes
 * (inconsistently, and sometimes with a delay) reclassifies them as text and
 * downstream apps rename them to ".txt" — something no Content-Type header
 * or Blob type can prevent, since it happens after the fact, outside the
 * browser. Desktop (and any browser without file-sharing support) falls back
 * to a normal silent download via a Blob + <a download> link, unchanged.
 */
export async function deliverFile(
  fileName: string,
  content: string | Blob,
  mimeType: string = MANIFEST_MIME
): Promise<DeliverResult> {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const file = new File([blob], fileName, { type: blob.type || mimeType });

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  const canShareFiles = !!nav.share && !!nav.canShare && nav.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await nav.share!({ files: [file] });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled'; // user dismissed the share sheet
      // Any other share failure — fall through to a normal download
    }
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
  return 'downloaded';
}
