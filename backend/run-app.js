console.log("Starting app with error logging...");

try {
  require('./dist/app.js');
} catch (error) {
  console.error("Failed to start app:", error);
  process.exit(1);
}
