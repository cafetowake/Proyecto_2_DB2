// Admin routes - /api/admin
import express from 'express';
import multer from 'multer';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /seed - Trigger full data seeder
router.post('/seed', adminController.seedDatabase);

// POST /csv - Upload CSV and load into Neo4j
router.post('/csv', upload.single('file'), adminController.uploadCSV);

export default router;
