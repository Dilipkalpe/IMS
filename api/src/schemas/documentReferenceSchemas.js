import mongoose from 'mongoose';

/** Structured header reference to an upstream numbered sales/purchase document. */
export function numberedDocReferenceSchema(prefixDefault = 'DOC') {
  return new mongoose.Schema(
    {
      docPrefix: { type: String, trim: true, uppercase: true, default: prefixDefault },
      docNo: { type: Number, required: true },
      formattedDocNo: { type: String, trim: true, default: '' }
    },
    { _id: false }
  );
}
