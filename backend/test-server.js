// Test server startup to catch errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

try {
  require('./src/server.js');
} catch (error) {
  console.error('Server startup error:');
  console.error(error);
  process.exit(1);
}
