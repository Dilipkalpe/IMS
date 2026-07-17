import mongoose from 'mongoose';
import { getContextYearModel } from '../db/yearModels.js';

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 }
});

export const Counter = mongoose.model('Counter', counterSchema);

function counterModel() {
  return getContextYearModel(Counter);
}

export async function getNextSequence(key, initial = 1) {
  const CounterDoc = counterModel();
  const counter = await CounterDoc.findOneAndUpdate(
    { key },
    [
      {
        $set: {
          value: {
            $add: [{ $ifNull: ['$value', initial - 1] }, 1],
          },
        },
      },
    ],
    { upsert: true, new: true },
  );
  return counter.value;
}

/** Next value that would be issued, without incrementing the counter. */
export async function peekNextSequence(key, initial = 1) {
  const CounterDoc = counterModel();
  const counter = await CounterDoc.findOne({ key });
  return counter ? counter.value + 1 : initial;
}

/** After assigning a document number manually, keep the counter at or above that value. */
export async function ensureCounterAtLeast(key, docNo, initial = 1) {
  const CounterDoc = counterModel();
  const value = Math.max(Number(docNo) || 0, initial);
  const counter = await CounterDoc.findOne({ key });
  if (!counter) {
    await CounterDoc.create({ key, value });
    return;
  }
  if (counter.value < value) {
    counter.value = value;
    await counter.save();
  }
}
