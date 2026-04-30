// Post routes - /api/posts
import express from 'express';
import * as postsController from '../controllers/postsController.js';

const router = express.Router();

// GET /stats/aggregate - MUST come before /:id
router.get('/stats/aggregate', postsController.getPostStats);

// GET /feed/:userId - Feed from followed users
router.get('/feed/:userId', postsController.getFeed);

// GET /following/:userId - Combined feed (followed users + joined groups)
router.get('/following/:userId', postsController.getFollowingFeed);

// GET /liked/:userId - Posts liked by user
router.get('/liked/:userId', postsController.getLikedPosts);

// GET /saved/:userId - Posts saved by user
router.get('/saved/:userId', postsController.getSavedPosts);

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
