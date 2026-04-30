// Group routes - /api/groups
import express from 'express';
import * as groupsController from '../controllers/groupsController.js';

const router = express.Router();

// GET /user/:userId - Get groups for a user - MUST come before /:id
router.get('/user/:userId', groupsController.getUserGroups);

// GET /:id/members - Get group members - MUST come before /:id
router.get('/:id/members', groupsController.getGroupMembers);

// GET /:id/posts - Get posts in group - MUST come before /:id
router.get('/:id/posts', groupsController.getGroupPosts);

// POST / - Create group
router.post('/', groupsController.createGroup);

// GET /:id - Get single group
router.get('/:id', groupsController.getGroupById);

// GET / - Get many groups
router.get('/', groupsController.getGroups);

// PATCH /:id - Update group
router.patch('/:id', groupsController.updateGroup);

// DELETE /:id - Delete group
router.delete('/:id', groupsController.deleteGroup);

export default router;
