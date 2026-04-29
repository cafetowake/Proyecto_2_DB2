// Hashtag controller - handles HTTP requests/responses
import crypto from 'crypto';
import * as hashtagService from '../services/hashtagService.js';

// POST / - Create hashtag
export async function createHashtag(req, res, next) {
  try {
    const hashtagData = {
      id: crypto.randomUUID(),
      hashtag: req.body.hashtag,
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0,
      isTrending: req.body.isTrending !== undefined ? req.body.isTrending : false
    };

    const hashtag = await hashtagService.createHashtag(hashtagData);
    res.status(201).json(hashtag);
  } catch (error) {
    next(error);
  }
}

// GET /:id - Get single hashtag
export async function getHashtagById(req, res, next) {
  try {
    const hashtag = await hashtagService.getHashtagById(req.params.id);
    
    if (!hashtag) {
      return res.status(404).json({ error: 'Hashtag not found' });
    }

    res.json(hashtag);
  } catch (error) {
    next(error);
  }
}

// GET / - Get many hashtags
export async function getHashtags(req, res, next) {
  try {
    const filters = {
      isTrending: req.query.isTrending === 'true' ? true : req.query.isTrending === 'false' ? false : undefined,
      search: req.query.search,
      minUsage: req.query.minUsage ? parseInt(req.query.minUsage) : undefined,
      limit: parseInt(req.query.limit) || 20,
      skip: parseInt(req.query.skip) || 0
    };

    const hashtags = await hashtagService.getHashtags(filters);
    res.json(hashtags);
  } catch (error) {
    next(error);
  }
}

// GET /:id/posts - Get posts using hashtag
export async function getHashtagPosts(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const posts = await hashtagService.getHashtagPosts(req.params.id, limit, skip);
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

// PATCH /:id - Update hashtag
export async function updateHashtag(req, res, next) {
  try {
    const hashtag = await hashtagService.updateHashtag(req.params.id, req.body);
    
    if (!hashtag) {
      return res.status(404).json({ error: 'Hashtag not found' });
    }

    res.json(hashtag);
  } catch (error) {
    next(error);
  }
}

// DELETE /:id - Delete hashtag
export async function deleteHashtag(req, res, next) {
  try {
    const result = await hashtagService.deleteHashtag(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({ error: 'Hashtag not found' });
    }

    res.json({ message: 'Hashtag deleted successfully', ...result });
  } catch (error) {
    next(error);
  }
}
