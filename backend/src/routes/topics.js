// Topic routes - /api/topics
import express from 'express';
import * as topicsController from '../controllers/topicsController.js';

const router = express.Router();

// GET /:id/posts - Get posts tagged with topic - MUST come before /:id
router.get('/:id/posts', topicsController.getTopicPosts);

// POST / - Create topic
router.post('/', topicsController.createTopic);

// GET /:id - Get single topic
router.get('/:id', topicsController.getTopicById);

// GET / - Get many topics
router.get('/', topicsController.getTopics);

// PATCH /:id - Update topic
router.patch('/:id', topicsController.updateTopic);

// DELETE /:id - Delete topic
router.delete('/:id', topicsController.deleteTopic);

export default router;
