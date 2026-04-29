// Hashtag routes - /api/hashtags
import express from 'express';
import * as hashtagsController from '../controllers/hashtagsController.js';

const router = express.Router();

// GET /:id/posts - Get posts using hashtag - MUST come before /:id
router.get('/:id/posts', hashtagsController.getHashtagPosts);

// POST / - Create hashtag
router.post('/', hashtagsController.createHashtag);

// GET /:id - Get single hashtag
router.get('/:id', hashtagsController.getHashtagById);

// GET / - Get many hashtags (trending, etc.)
router.get('/', hashtagsController.getHashtags);

// PATCH /:id - Update hashtag
router.patch('/:id', hashtagsController.updateHashtag);

// DELETE /:id - Delete hashtag
router.delete('/:id', hashtagsController.deleteHashtag);

export default router;
