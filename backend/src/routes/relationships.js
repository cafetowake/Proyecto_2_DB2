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

// POST /interest - Create INTERESTED_IN relationship
router.post('/interest', relationshipsController.addInterest);

// POST /follow-hashtag - Create FOLLOWS_HASHTAG relationship
router.post('/follow-hashtag', relationshipsController.followHashtag);

// DELETE /interest/:userId/:topicId - Remove INTERESTED_IN
router.delete('/interest/:userId/:topicId', relationshipsController.removeInterest);

// GET /followed-hashtags/:userId - Hashtags a user follows
router.get('/followed-hashtags/:userId', relationshipsController.getFollowedHashtags);

// DELETE /follow-hashtag/:userId/:hashtagId - Unfollow hashtag
router.delete('/follow-hashtag/:userId/:hashtagId', relationshipsController.unfollowHashtag);

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

// GET /following/:userId - Get users that userId follows
router.get('/following/:userId', relationshipsController.getFollowing);

// GET /followers/:userId - Get followers of userId
router.get('/followers/:userId', relationshipsController.getFollowers);

// DELETE /member/:userId/:groupId - Leave group
router.delete('/member/:userId/:groupId', relationshipsController.leaveGroup);

export default router;

