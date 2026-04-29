// User controller - handles HTTP requests/responses
import crypto from 'crypto';
import * as userService from '../services/userService.js';

// POST / - Create user (1 label)
export async function createUser(req, res, next) {
  try {
    const userData = {
      id: crypto.randomUUID(),
      username: req.body.username,
      email: req.body.email,
      biography: req.body.biography || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      interests: req.body.interests || [],
      birthdate: req.body.birthdate,
      joinedAt: new Date().toISOString().split('T')[0]
    };

    const user = await userService.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

// POST /verified - Create verified user (2 labels)
export async function createVerifiedUser(req, res, next) {
  try {
    const userData = {
      id: crypto.randomUUID(),
      username: req.body.username,
      email: req.body.email,
      biography: req.body.biography || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      interests: req.body.interests || [],
      birthdate: req.body.birthdate,
      joinedAt: new Date().toISOString().split('T')[0],
      verifiedAt: new Date().toISOString().split('T')[0],
      badge: req.body.badge || 'creator'
    };

    const user = await userService.createVerifiedUser(userData);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

// GET /:id - Get single user
export async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

// GET / - Get many users with filters
export async function getUsers(req, res, next) {
  try {
    const filters = {
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      badge: req.query.badge,
      verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
      interests: req.query.interests ? req.query.interests.split(',') : undefined,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 20,
      skip: parseInt(req.query.skip) || 0
    };

    const users = await userService.getUsers(filters);
    res.json(users);
  } catch (error) {
    next(error);
  }
}

// GET /stats/aggregate - Aggregation queries
export async function getUserStats(req, res, next) {
  try {
    const stats = await userService.getUserStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

// PATCH /:id/props - Add/update properties
export async function updateUserProps(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

// PATCH /bulk/props - Update props on many users
export async function bulkUpdateUsers(req, res, next) {
  try {
    const filter = req.body.filter || {};
    const props = req.body.props || {};
    
    const result = await userService.bulkUpdateUsers(filter, props);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// DELETE /:id/props - Remove properties from user
export async function removeUserProps(req, res, next) {
  try {
    const propKeys = req.body.propKeys || [];
    
    const user = await userService.removeUserProps(req.params.id, propKeys);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

// DELETE /bulk/props - Remove props from many users
export async function bulkRemoveUserProps(req, res, next) {
  try {
    const propKeys = req.body.propKeys || [];
    const filter = req.body.filter || {};
    
    const result = await userService.bulkRemoveUserProps(propKeys, filter);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// DELETE /:id - Delete single user
export async function deleteUser(req, res, next) {
  try {
    const result = await userService.deleteUser(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', ...result });
  } catch (error) {
    next(error);
  }
}

// DELETE /bulk - Delete multiple users
export async function bulkDeleteUsers(req, res, next) {
  try {
    const ids = req.body.ids || [];
    
    const result = await userService.deleteUsers(ids);
    res.json({ message: `Deleted ${result.deleted} users`, ...result });
  } catch (error) {
    next(error);
  }
}
