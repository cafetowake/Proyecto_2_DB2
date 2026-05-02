import client from './client';

export const createPost      = (data)          => client.post('/posts', data);
export const getPostById     = (id)            => client.get(`/posts/${id}`);
export const getPosts        = (params)        => client.get('/posts', { params });
export const getDraftPosts   = (userId, p)     => client.get('/posts', { params: { authorId: userId, isDraft: true, ...p } });
export const getPostStats    = ()              => client.get('/posts/stats/aggregate');
export const getFeed            = (userId, p)     => client.get(`/posts/feed/${userId}`, { params: p });
export const getFollowingFeed   = (userId, p)     => client.get(`/posts/following/${userId}`, { params: p });
export const getLikedPosts   = (userId, p)     => client.get(`/posts/liked/${userId}`, { params: p });
export const getSavedPosts   = (userId, p)     => client.get(`/posts/saved/${userId}`, { params: p });
export const updatePost      = (id, props)     => client.patch(`/posts/${id}`, props);
export const bulkUpdatePosts = (filter, props) => client.patch('/posts/bulk', { filter, props });
export const deletePost      = (id)            => client.delete(`/posts/${id}`);
export const bulkDeletePosts = (ids)           => client.delete('/posts/bulk', { data: { ids } });
