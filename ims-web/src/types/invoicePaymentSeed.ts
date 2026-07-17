/** WPF: IMS.Models.InvoicePaymentSeed */
export interface InvoicePaymentSeed {
  sourceDocType: string;
  sourceDocId?: string;
  formattedDocNo: string;
  partyName: string;
  partyAccountCode?: string;
  amountDue: number;
  cashBank: 'CASH' | 'BANK';
  voucherKind: 'receipt' | 'payment';
}
