/**
 * @param {number[]} samples ms
 */
export function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((s, v) => s + v, 0);
  const pick = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
  return {
    n: sorted.length,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    avg: sorted.length ? sum / sorted.length : 0,
    p50: pick(0.5),
    p95: pick(0.95)
  };
}

export async function login(base, loginId, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password })
  });
  if (!res.ok) throw new Error(`Login failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.token;
}

/**
 * @param {string} url
 * @param {RequestInit & { token?: string }} [options]
 */
export async function timedFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const t0 = performance.now();
  const res = await fetch(url, { ...options, headers });
  const elapsedMs = performance.now() - t0;
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  const payloadBytes = new TextEncoder().encode(text).length;
  return { res, elapsedMs, json, payloadBytes, ok: res.ok, status: res.status };
}

export async function benchEndpoint(name, url, options = {}) {
  const { iterations = 5, targetMs, token, method = 'GET', body } = options;
  const samples = [];
  const payloads = [];
  let lastError = null;
  let lastStatus = 0;

  for (let i = 0; i < iterations; i++) {
    const result = await timedFetch(url, {
      method,
      token,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    samples.push(result.elapsedMs);
    payloads.push(result.payloadBytes);
    lastStatus = result.status;
    if (!result.ok) {
      lastError = result.json?.error || `HTTP ${result.status}`;
    }
  }

  const timing = summarize(samples);
  const payload = {
    avgBytes: payloads.reduce((s, v) => s + v, 0) / (payloads.length || 1),
    maxBytes: Math.max(...payloads, 0)
  };

  return {
    name,
    url,
    timing,
    payload,
    targetMs: targetMs ?? null,
    pass: targetMs != null ? timing.p95 <= targetMs : null,
    ok: !lastError,
    status: lastStatus,
    error: lastError
  };
}
