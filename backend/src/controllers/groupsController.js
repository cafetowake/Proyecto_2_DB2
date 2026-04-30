// Group controller - handles HTTP requests/responses
import crypto from 'crypto';
import * as groupService from '../services/groupService.js';

// POST / - Create group
export async function createGroup(req, res, next) {
  try {
    const groupData = {
      id: crypto.randomUUID(),
      name: req.body.name,
      description: req.body.description || '',
      isPrivate: req.body.isPrivate !== undefined ? req.body.isPrivate : false,
      membersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      topicIds: req.body.topicIds || []
    };

    const group = await groupService.createGroup(groupData);
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
}

// GET /:id - Get single group
export async function getGroupById(req, res, next) {
  try {
    const group = await groupService.getGroupById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    next(error);
  }
}

// GET / - Get many groups
export async function getGroups(req, res, next) {
  try {
    const filters = {
      isPrivate: req.query.isPrivate === 'true' ? true : req.query.isPrivate === 'false' ? false : undefined,
      search: req.query.search,
      topicId: req.query.topicId,
      limit: parseInt(req.query.limit) || 20,
      skip: parseInt(req.query.skip) || 0
    };

    const groups = await groupService.getGroups(filters);
    res.json(groups);
  } catch (error) {
    next(error);
  }
}

// GET /user/:userId - Get groups a user belongs to
export async function getUserGroups(req, res, next) {
  try {
    const groups = await groupService.getUserGroups(req.params.userId);
    res.json(groups);
  } catch (error) {
    next(error);
  }
}

// GET /:id/members - Get group members
export async function getGroupMembers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const members = await groupService.getGroupMembers(req.params.id, limit);
    res.json(members);
  } catch (error) {
    next(error);
  }
}

// GET /:id/posts - Get posts in group
export async function getGroupPosts(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const posts = await groupService.getGroupPosts(req.params.id, limit, skip);
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

// PATCH /:id - Update group
export async function updateGroup(req, res, next) {
  try {
    const group = await groupService.updateGroup(req.params.id, req.body);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    next(error);
  }
}

// DELETE /:id - Delete group
export async function deleteGroup(req, res, next) {
  try {
    const result = await groupService.deleteGroup(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully', ...result });
  } catch (error) {
    next(error);
  }
}
