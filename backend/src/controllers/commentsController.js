// Comment controller - handles HTTP requests/responses
import crypto from 'crypto';
import * as commentService from '../services/commentService.js';

// POST / - Create comment
export async function createComment(req, res, next) {
  try {
    const commentData = {
      id: crypto.randomUUID(),
      content: req.body.content,
      likesCount: 0,
      repliesCount: 0,
      isEdited: false,
      createdAt: new Date().toISOString().split('T')[0],
      authorId: req.body.authorId,
      postId: req.body.postId,
      parentCommentId: req.body.parentCommentId || null
    };

    const comment = await commentService.createComment(commentData);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
}

// GET /:id - Get single comment
export async function getCommentById(req, res, next) {
  try {
    const comment = await commentService.getCommentById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json(comment);
  } catch (error) {
    next(error);
  }
}

// GET / - Get comments by post
export async function getCommentsByPost(req, res, next) {
  try {
    const postId = req.query.postId;
    const filters = {
      mainOnly: req.query.mainOnly === 'true',
      limit: parseInt(req.query.limit) || 20,
      skip: parseInt(req.query.skip) || 0
    };

    const comments = await commentService.getCommentsByPost(postId, filters);
    res.json(comments);
  } catch (error) {
    next(error);
  }
}

// GET /replies/:id - Get replies to comment
export async function getCommentReplies(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const replies = await commentService.getCommentReplies(req.params.id, limit);
    res.json(replies);
  } catch (error) {
    next(error);
  }
}

// PATCH /:id - Update comment
export async function updateComment(req, res, next) {
  try {
    const comment = await commentService.updateComment(req.params.id, req.body);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json(comment);
  } catch (error) {
    next(error);
  }
}

// DELETE /:id - Delete comment
export async function deleteComment(req, res, next) {
  try {
    const result = await commentService.deleteComment(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully', ...result });
  } catch (error) {
    next(error);
  }
}
