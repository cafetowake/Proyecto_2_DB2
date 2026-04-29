// Relationship routes - /api/relationships
import express from 'express';
import * as relationshipsController from '../controllers/relationshipsController.js';

const router = express.Router();

// POST /follow - Create FOLLOWS relationship
router.post('/follow', relationshipsController.followUser);

// POST /like - Create LIKES relationship
router.post('/like', relationshipsController.likePost);

// POST /save - Create SAVED relationship
router.post('/save', relationshipsController.savePost);

// POST /member - Create MEMBER_OF relationship
router.post('/member', relationshipsController.joinGroup);

// PATCH /follow/bulk - Update many FOLLOWS props - MUST come before /:from/:to
router.patch('/follow/bulk', relationshipsController.bulkUpdateFollows);

// PATCH /follow/:from/:to/add - Add prop to FOLLOWS
router.patch('/follow/:from/:to/add', relationshipsController.addFollowProp);

// PATCH /follow/:from/:to - Update FOLLOWS props
router.patch('/follow/:from/:to', relationshipsController.updateFollowRelation);

// DELETE /follow/bulk/prop - Remove prop from many FOLLOWS
router.delete('/follow/bulk/prop', relationshipsController.bulkRemoveFollowProp);

// DELETE /follow/bulk - Unfollow many
router.delete('/follow/bulk', relationshipsController.bulkUnfollow);

// DELETE /follow/:from/:to/prop - Remove prop from FOLLOWS
router.delete('/follow/:from/:to/prop', relationshipsController.removeFollowProp);

// DELETE /follow/:from/:to - Unfollow (delete relationship)
router.delete('/follow/:from/:to', relationshipsController.unfollowUser);

export default router;

