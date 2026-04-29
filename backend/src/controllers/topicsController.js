// Topic controller - handles HTTP requests/responses
import crypto from 'crypto';
import * as topicService from '../services/topicService.js';

// POST / - Create topic
export async function createTopic(req, res, next) {
  try {
    const topicData = {
      id: crypto.randomUUID(),
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category,
      popularityScore: req.body.popularityScore || 0.0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const topic = await topicService.createTopic(topicData);
    res.status(201).json(topic);
  } catch (error) {
    next(error);
  }
}

// GET /:id - Get single topic
export async function getTopicById(req, res, next) {
  try {
    const topic = await topicService.getTopicById(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    next(error);
  }
}

// GET / - Get many topics
export async function getTopics(req, res, next) {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      minPopularity: req.query.minPopularity ? parseFloat(req.query.minPopularity) : undefined,
      limit: parseInt(req.query.limit) || 20,
      skip: parseInt(req.query.skip) || 0
    };

    const topics = await topicService.getTopics(filters);
    res.json(topics);
  } catch (error) {
    next(error);
  }
}

// GET /:id/posts - Get posts tagged with topic
export async function getTopicPosts(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const posts = await topicService.getTopicPosts(req.params.id, limit, skip);
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

// PATCH /:id - Update topic
export async function updateTopic(req, res, next) {
  try {
    const topic = await topicService.updateTopic(req.params.id, req.body);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    next(error);
  }
}

// DELETE /:id - Delete topic
export async function deleteTopic(req, res, next) {
  try {
    const result = await topicService.deleteTopic(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({ message: 'Topic deleted successfully', ...result });
  } catch (error) {
    next(error);
  }
}
