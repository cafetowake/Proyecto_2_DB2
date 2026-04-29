// Relationship controller - handles HTTP requests/responses
import * as relationshipService from '../services/relationshipService.js';

// POST /follow - Create FOLLOWS relationship
export async function followUser(req, res, next) {
  try {
    const { followerId, followedId } = req.body;
    const props = {
      isCloseFriend: req.body.isCloseFriend || false,
      interactionScore: req.body.interactionScore || 0.0
    };

    const relationship = await relationshipService.followUser(followerId, followedId, props);
    res.status(201).json(relationship);
  } catch (error) {
    next(error);
  }
}

// POST /like - Create LIKES relationship
export async function likePost(req, res, next) {
  try {
    const { userId, postId } = req.body;
    const props = {
      reactionType: req.body.reactionType || 'like',
      weight: req.body.weight || 1.0
    };

    const relationship = await relationshipService.likePost(userId, postId, props);
    res.status(201).json(relationship);
  } catch (error) {
    next(error);
  }
}

// POST /save - Create SAVED relationship
export async function savePost(req, res, next) {
  try {
    const { userId, postId } = req.body;
    const props = {
      collectionName: req.body.collectionName || 'default',
      isPrivate: req.body.isPrivate !== undefined ? req.body.isPrivate : true
    };

    const relationship = await relationshipService.savePost(userId, postId, props);
    res.status(201).json(relationship);
  } catch (error) {
    next(error);
  }
}

// POST /member - Create MEMBER_OF relationship
export async function joinGroup(req, res, next) {
  try {
    const { userId, groupId } = req.body;
    const props = {
      role: req.body.role || 'member',
      permissions: req.body.permissions || ['read', 'post']
    };

    const relationship = await relationshipService.joinGroup(userId, groupId, props);
    res.status(201).json(relationship);
  } catch (error) {
    next(error);
  }
}

// PATCH /follow/:from/:to - Update FOLLOWS props
export async function updateFollowRelation(req, res, next) {
  try {
    const { from, to } = req.params;
    const relationship = await relationshipService.updateFollowRelation(from, to, req.body);
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    res.json(relationship);
  } catch (error) {
    next(error);
  }
}

// PATCH /follow/bulk - Update many FOLLOWS
export async function bulkUpdateFollows(req, res, next) {
  try {
    const { filter, props } = req.body;
    const result = await relationshipService.bulkUpdateFollows(filter || {}, props || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// PATCH /follow/:from/:to/add - Add prop to FOLLOWS
export async function addFollowProp(req, res, next) {
  try {
    const { from, to } = req.params;
    const { propKey, propValue } = req.body;
    
    const relationship = await relationshipService.addRelationProp(from, to, propKey, propValue);
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    res.json(relationship);
  } catch (error) {
    next(error);
  }
}

// DELETE /follow/:from/:to/prop - Remove prop from FOLLOWS
export async function removeFollowProp(req, res, next) {
  try {
    const { from, to } = req.params;
    const { propKey } = req.body;
    
    const relationship = await relationshipService.removeRelationProp(from, to, propKey);
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    res.json(relationship);
  } catch (error) {
    next(error);
  }
}

// DELETE /follow/bulk/prop - Remove prop from many FOLLOWS
export async function bulkRemoveFollowProp(req, res, next) {
  try {
    const { propKey, filter } = req.body;
    const result = await relationshipService.bulkRemoveRelationProp(propKey, filter || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// DELETE /follow/:from/:to - Unfollow (delete relationship)
export async function unfollowUser(req, res, next) {
  try {
    const { from, to } = req.params;
    const result = await relationshipService.unfollow(from, to);
    
    if (result.deleted === 0) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    res.json({ message: 'Unfollowed successfully', ...result });
  } catch (error) {
    next(error);
  }
}

// DELETE /follow/bulk - Unfollow many
export async function bulkUnfollow(req, res, next) {
  try {
    const { followerId, followedIds } = req.body;
    const result = await relationshipService.unfollowMany(followerId, followedIds || []);
    res.json({ message: `Unfollowed ${result.deleted} users`, ...result });
  } catch (error) {
    next(error);
  }
}
