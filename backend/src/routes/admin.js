// Admin routes - /api/admin
import express from 'express';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// POST /seed - Trigger full data seeder
router.post('/seed', adminController.seedDatabase);

// POST /csv - Upload CSV and load into Neo4j
router.post('/csv', adminController.uploadCSV);

export default router;
