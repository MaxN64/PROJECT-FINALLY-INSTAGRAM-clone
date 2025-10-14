const store = new Map();

export function createRateLimiter({ windowMs, max, message }) {
  const window = Math.max(Number(windowMs) || 0, 1000);
  const limit = Math.max(Number(max) || 1, 1);
  const errorMessage = message || "Too many requests";

  return (req, _res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now - entry.start >= window) {
      store.set(key, { start: now, count: 1 });
      return next();
    }

    if (entry.count >= limit) {
      const err = new Error(errorMessage);
      err.status = 429;
      return next(err);
    }

    entry.count += 1;
    return next();
  };
}

export default createRateLimiter;
