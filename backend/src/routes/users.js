// User routes - /api/users
import express from 'express';
import * as usersController from '../controllers/usersController.js';

const router = express.Router();

// POST /verified - Create verified user (2 labels) - MUST come before /:id
router.post('/verified', usersController.createVerifiedUser);

// GET /stats/aggregate - Count/avg aggregation - MUST come before /:id
router.get('/stats/aggregate', usersController.getUserStats);

// POST / - Create user (1 label)
router.post('/', usersController.createUser);

// GET /:id - Get single user
router.get('/:id', usersController.getUserById);

// GET / - Get many users (query filters)
router.get('/', usersController.getUsers);

// PATCH /bulk - Update props on many users - MUST come before /:id
router.patch('/bulk', usersController.bulkUpdateUsers);

// PATCH /:id/verify - Add VerifiedUser label - MUST come before /:id plain patch
router.patch('/:id/verify', usersController.verifyUser);

// PATCH /:id - Update user properties
router.patch('/:id', usersController.updateUserProps);

// DELETE /bulk/props - Remove props from many users - MUST come before /:id
router.delete('/bulk/props', usersController.bulkRemoveUserProps);

// DELETE /bulk - Delete multiple users - MUST come before /:id
router.delete('/bulk', usersController.bulkDeleteUsers);

// DELETE /:id/props - Remove properties from user
router.delete('/:id/props', usersController.removeUserProps);

// DELETE /:id - Delete single user
router.delete('/:id', usersController.deleteUser);

export default router;
