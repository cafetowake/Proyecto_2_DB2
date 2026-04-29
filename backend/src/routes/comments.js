// Comment routes - /api/comments
import express from 'express';
import * as commentsController from '../controllers/commentsController.js';

const router = express.Router();

// GET /replies/:id - Get replies to a comment - MUST come before /:id
router.get('/replies/:id', commentsController.getCommentReplies);

// POST / - Create comment
router.post('/', commentsController.createComment);

// GET /:id - Get single comment
router.get('/:id', commentsController.getCommentById);

// GET / - Get comments by post (query: postId)
router.get('/', commentsController.getCommentsByPost);

// PATCH /:id - Update comment
router.patch('/:id', commentsController.updateComment);

// DELETE /:id - Delete comment
router.delete('/:id', commentsController.deleteComment);

export default router;
