import express from 'express';
import dotenv from 'dotenv';
import notFound from './middleware/notFound';
import errorHandler from './middleware/errorHandler';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'API is running' });
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;
