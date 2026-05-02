import client from './client';

// --- FOLLOWS ---
export const followUser = (followerId, followedId, extra = {}) =>
  client.post('/relationships/follow', { followerId, followedId, isCloseFriend: false, notificationsEnabled: true, ...extra });
export const unfollowUser       = (from, to)         => client.delete(`/relationships/follow/${from}/${to}`);
export const getFollowing       = (userId, params)   => client.get(`/relationships/following/${userId}`, { params });
export const getFollowers       = (userId, params)   => client.get(`/relationships/followers/${userId}`, { params });
export const updateFollow       = (from, to, props)  => client.patch(`/relationships/follow/${from}/${to}`, props);
export const bulkUpdateFollows  = (filter, props)    => client.patch('/relationships/follow/bulk', { filter, props });
export const addFollowProp      = (from, to, propKey, propValue) =>
  client.patch(`/relationships/follow/${from}/${to}/add`, { propKey, propValue });
export const bulkAddFollowProps = (filter, props)    => client.patch('/relationships/follow/bulk/add', { filter, props });
export const removeFollowProp   = (from, to, propKey) =>
  client.delete(`/relationships/follow/${from}/${to}/prop`, { data: { propKey } });
export const bulkRemoveFollowProp = (propKey, filter) =>
  client.delete('/relationships/follow/bulk/prop', { data: { propKey, filter } });
export const bulkUnfollow = (followerId, followedIds) =>
  client.delete('/relationships/follow/bulk', { data: { followerId, followedIds } });

// --- LIKES ---
export const likePost   = (userId, postId, reactionType = 'like') =>
  client.post('/relationships/like', { userId, postId, reactionType, weight: 1.0 });
export const unlikePost = (userId, postId) => client.delete(`/relationships/like/${userId}/${postId}`);

// --- SAVED ---
export const savePost   = (userId, postId, collectionName = 'default') =>
  client.post('/relationships/save', { userId, postId, collectionName, isPrivate: false });
export const unsavePost = (userId, postId) => client.delete(`/relationships/save/${userId}/${postId}`);

// --- MEMBER_OF ---
export const joinGroup  = (userId, groupId) =>
  client.post('/relationships/member', { userId, groupId, role: 'member', permissions: ['read', 'comment', 'post'] });
export const leaveGroup = (userId, groupId) => client.delete(`/relationships/member/${userId}/${groupId}`);
// --- INTERESTED_IN ---
export const addInterest    = (userId, topicId, level = 3, isPrimary = false) =>
  client.post('/relationships/interest', { userId, topicId, level, isPrimary });
export const removeInterest = (userId, topicId) => client.delete(`/relationships/interest/${userId}/${topicId}`);
// --- FOLLOWS_HASHTAG ---
export const followHashtag   = (userId, hashtagId, notificationsEnabled = false, interestLevel = 3) =>
  client.post('/relationships/follow-hashtag', { userId, hashtagId, notificationsEnabled, interestLevel });
export const unfollowHashtag = (userId, hashtagId) => client.delete(`/relationships/follow-hashtag/${userId}/${hashtagId}`);
export const getFollowedHashtags = (userId) => client.get(`/relationships/followed-hashtags/${userId}`);
