const logger = {
  info: (msg, ...args) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, ...args)
};

module.exports = logger;
