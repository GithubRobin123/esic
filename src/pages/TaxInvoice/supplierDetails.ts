/**
 * Display copy of the fixed billing-entity details.
 *
 * The authoritative values live server-side in
 * esics/src/utils/invoiceConstants.ts and are what actually get printed into
 * the generated PDF/Excel. These are here only so the on-screen preview looks
 * like the final document. Change both together.
 */

export const SUPPLIER = {
  name: 'EDI Manifest Solutions',
  addressLines: ['PLOT NO-3512', 'MAHARANA PRATAP COLONY', 'Palwal 121102'],
  mobile: '8882741223',
  gstin: '06CVRPD3667A1ZN',
  email: 'bills@ediss.in',
};

export const BANK = {
  accountName: 'EDI MANIFEST SOLUTIONS',
  accountNo: '50200083752941',
  ifsc: 'HDFC0000459',
  branch: 'PALWAL - HARYANA',
};

export const DEFAULT_SAC_CODE = '998439';
