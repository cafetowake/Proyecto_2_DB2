// Main Express app entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes


// Import middleware


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes


// Error handler


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
