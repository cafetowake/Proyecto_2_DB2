// Post routes - /api/posts
import express from 'express';
import * as postsController from '../controllers/postsController.js';

const router = express.Router();

// GET /stats/aggregate - MUST come before /:id
router.get('/stats/aggregate', postsController.getPostStats);

// POST / - Create post
router.post('/', postsController.createPost);

// GET /:id - Get single post
router.get('/:id', postsController.getPostById);

// GET / - Get many posts (filter by group, topic, hashtag, isDraft)
router.get('/', postsController.getPosts);

// PATCH /:id - Update post properties
router.patch('/:id', postsController.updatePost);

// PATCH /bulk - Update many posts
router.patch('/bulk', postsController.bulkUpdatePosts);

// DELETE /:id - Delete post
router.delete('/:id', postsController.deletePost);

// DELETE /bulk - Delete many posts
router.delete('/bulk', postsController.bulkDeletePosts);

export default router;
