/**
 * Inserts large arrays in MongoDB batches to avoid document size limits and reduce memory spikes.
 * @template T
 * @param {import('mongoose').Model<T>} model
 * @param {T[]} docs
 * @param {{ batchSize?: number, label?: string }} [options]
 */
export async function insertManyInBatches(model, docs, options = {}) {
  const batchSize = options.batchSize ?? 2000;
  const label = options.label ?? model.collection.name;
  const total = docs.length;

  if (total === 0) {
    console.log(`  ${label}: 0 records (skipped)`);
    return;
  }

  const started = Date.now();
  for (let i = 0; i < total; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    await model.insertMany(chunk, { ordered: false });
    const done = Math.min(i + batchSize, total);
    if (total > batchSize) {
      process.stdout.write(`\r  ${label}: ${done.toLocaleString()} / ${total.toLocaleString()}`);
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  if (total > batchSize) {
    process.stdout.write('\n');
  }
  console.log(`  ${label}: ${total.toLocaleString()} records (${elapsed}s)`);
}
