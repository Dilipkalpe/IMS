/**
 * @param {import('express').Request['query']} query
 * @param {{ defaultLimit?: number, maxLimit?: number }} [options]
 */
export function parsePagination(query, options = {}) {
  const { defaultLimit = 100, maxLimit = 10000 } = options;
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
