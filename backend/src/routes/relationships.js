// Relationship routes - /api/relationships
import express from 'express';

const router = express.Router();

// POST /follow - Create FOLLOWS relationship


// POST /like - Create LIKES relationship


// POST /save - Create SAVED relationship


// POST /member - Create MEMBER_OF relationship


// PATCH /follow/:from/:to - Update FOLLOWS props


// PATCH /follow/bulk - Update many FOLLOWS props


// PATCH /follow/:from/:to/add - Add prop to FOLLOWS


// DELETE /follow/:from/:to/prop - Remove prop from FOLLOWS


// DELETE /follow/bulk/prop - Remove prop from many FOLLOWS


// DELETE /follow/:from/:to - Unfollow (delete 1 rel)


// DELETE /follow/bulk - Unfollow many (delete many rels)


export default router;
