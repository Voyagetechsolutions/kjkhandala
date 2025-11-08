const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`➡️  ${req.method} ${req.originalUrl}`);

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `⬅️  ${req.method} ${req.originalUrl} ${statusColor}${res.statusCode}${resetColor} ${duration}ms`
    );
  });

  next();
};

module.exports = requestLogger;
