import "dotenv/config";
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 5000;

console.log("Starting debug app...");
console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");
console.log("PORT:", port);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ug-clinic-api' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
