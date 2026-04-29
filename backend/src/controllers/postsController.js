// Post controller - handles HTTP requests/responses
import crypto from 'crypto';
import * as postService from '../services/postService.js';

// POST / - Create post
export async function createPost(req, res, next) {
  try {
    const postData = {
      id: crypto.randomUUID(),
      title: req.body.title,
      description: req.body.description,
      imageURL: req.body.imageURL || '',
      likesCount: 0,
      isDraft: req.body.isDraft !== undefined ? req.body.isDraft : false,
      createdAt: new Date().toISOString().split('T')[0],
      authorId: req.body.authorId,
      groupId: req.body.groupId,
      topicIds: req.body.topicIds || [],
      hashtagIds: req.body.hashtagIds || []
    };

    const post = await postService.createPost(postData);
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
}

// GET /:id - Get single post
export async function getPostById(req, res, next) {
  try {
    const post = await postService.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
}

// GET / - Get many posts
export async function getPosts(req, res, next) {
  try {
    const filters = {
      groupId: req.query.groupId,
      topicId: req.query.topicId,
      hashtagId: req.query.hashtagId,
      authorId: req.query.authorId,
      isDraft: req.query.isDraft === 'true' ? true : req.query.isDraft === 'false' ? false : undefined,
      visibility: req.query.visibility,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 20,
      skip: parseInt(req.query.skip) || 0
    };

    const posts = await postService.getPosts(filters);
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

// GET /stats/aggregate - Aggregation
export async function getPostStats(req, res, next) {
  try {
    const stats = await postService.getPostStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

// PATCH /:id - Update post
export async function updatePost(req, res, next) {
  try {
    const post = await postService.updatePost(req.params.id, req.body);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
}

// PATCH /bulk - Update many posts
export async function bulkUpdatePosts(req, res, next) {
  try {
    const { filter, props } = req.body;
    const result = await postService.bulkUpdatePosts(filter || {}, props || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// DELETE /:id - Delete post
export async function deletePost(req, res, next) {
  try {
    const result = await postService.deletePost(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully', ...result });
  } catch (error) {
    next(error);
  }
}

// DELETE /bulk - Delete many posts
export async function bulkDeletePosts(req, res, next) {
  try {
    const { ids } = req.body;
    const result = await postService.deletePosts(ids || []);
    res.json({ message: `Deleted ${result.deleted} posts`, ...result });
  } catch (error) {
    next(error);
  }
}
