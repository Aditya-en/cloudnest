import express from 'express';
import router from './routes.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(router);

app.get("/", (req, res) => {
  res.json({ message: 'server is running' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
