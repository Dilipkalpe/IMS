/**
 * Seed ~2 years of sample data: ~1 lakh records per section + payroll.
 * Uses chunked generation to limit memory (Node heap raised to 12 GB).
 *
 * Override volume: SEED_RECORDS_PER_SECTION=50000 node scripts/seed-2y.js
 * Override employees: SEED_PAYROLL_EMPLOYEES=500 node scripts/seed-2y.js
 */
process.env.SEED_MONTHS = process.env.SEED_MONTHS || '24';
process.env.SEED_RECORDS_PER_SECTION = process.env.SEED_RECORDS_PER_SECTION || '100000';

await import('../src/seed.js');
