import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import fileSystemRoutes from './routes/FileSystemRoutes';
import shareRoutes from './routes/shareRoutes';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drive-clone')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Clerk middleware setup
const clerk = clerkMiddleware({
  // Optional configuration
  jwtKey: process.env.CLERK_JWT_KEY,
  authorizedParties: [process.env.CLERK_AUTHORIZED_PARTY || ''],
});

// Set up authentication for protected routes
app.use('/api/*', clerk, (req, res, next) => {
  // Set auth info
  req.auth = {
    userId: req.auth?.userId || '',
    sessionId: req.auth?.sessionId || ''
  };
  next();
});

// Routes
app.use(fileSystemRoutes);
app.use(shareRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;