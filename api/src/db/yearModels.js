import mongoose from 'mongoose';
import { getContextYearDbName } from '../middleware/yearDbContext.js';
import { getActiveYearDbName, getMongoUri, parseDbNameFromUri } from '../config/db.js';

const modelCache = new Map();

export function resolveYearDbName(req) {
  const fromReq = String(req?.financialYearDb ?? '').trim();
  if (fromReq) return fromReq;
  return getContextYearDbName();
}

export function getYearConnection(dbName) {
  const name = String(dbName || '').trim();
  if (!name) {
    throw new Error('Year database name is required');
  }
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not connected');
  }
  return mongoose.connection.useDb(name, { useCache: true });
}

/** Model bound to a financial-year database (safe for concurrent requests). */
export function getYearModel(Model, dbName) {
  const conn = getYearConnection(dbName);
  const cacheKey = `${conn.name}:${Model.modelName}`;
  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey);
  }
  const scoped =
    conn.models[Model.modelName] ?? conn.model(Model.modelName, Model.schema);
  modelCache.set(cacheKey, scoped);
  return scoped;
}

export function getYearModelFromRequest(Model, req) {
  return getYearModel(Model, resolveYearDbName(req));
}

/** Year-scoped model for the current async request context. */
export function getContextYearModel(Model) {
  return getYearModel(Model, getContextYearDbName());
}
