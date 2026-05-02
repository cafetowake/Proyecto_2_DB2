import client from './client';

export const createComment   = (data)                 => client.post('/comments', data);
export const getComment      = (id)                   => client.get(`/comments/${id}`);
export const getPostComments = (postId, params)       => client.get(`/comments/post/${postId}`, { params });
export const getReplies      = (commentId, params)    => client.get(`/comments/replies/${commentId}`, { params });
export const updateComment   = (id, props)            => client.patch(`/comments/${id}`, props);
export const deleteComment   = (id)                   => client.delete(`/comments/${id}`);
