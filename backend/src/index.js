// Main Express app entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Neo4j config to initialize connection
import './config/neo4j.js';

// Import routes
import usersRoutes from './routes/users.js';
import postsRoutes from './routes/posts.js';
import commentsRoutes from './routes/comments.js';
import groupsRoutes from './routes/groups.js';
import topicsRoutes from './routes/topics.js';
import hashtagsRoutes from './routes/hashtags.js';
import relationshipsRoutes from './routes/relationships.js';
import adminRoutes from './routes/admin.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.AURA_INSTANCENAME || 'neo4j'
  });
});

// API Routes
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/hashtags', hashtagsRoutes);
app.use('/api/relationships', relationshipsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /health',
      '/api/users',
      '/api/posts',
      '/api/comments',
      '/api/groups',
      '/api/topics',
      '/api/hashtags',
      '/api/relationships',
      '/api/admin'
    ]
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.AURA_INSTANCENAME || 'neo4j'}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`${'='.repeat(50)}\n`);
});
