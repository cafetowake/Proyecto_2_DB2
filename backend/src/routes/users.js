// User routes - /api/users
import express from 'express';

const router = express.Router();

// POST / - Create user (1 label)


// POST /verified - Create verified user (2 labels)


// GET /:id - Get single user


// GET / - Get many users (query filters)


// GET /stats/aggregate - Count/avg aggregation


// PATCH /:id/props - Add/update properties


// PATCH /bulk/props - Update props on many users


// DELETE /:id/props - Remove properties from user


// DELETE /bulk/props - Remove props from many users


// DELETE /:id - Delete single user


// DELETE /bulk - Delete multiple users


export default router;
