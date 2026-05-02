import client from './client';

export const getHashtags         = (params)  => client.get('/hashtags', { params });
export const getTrendingHashtags = (limit)   => client.get('/hashtags/trending', { params: { limit } });
export const getHashtagById      = (id)      => client.get(`/hashtags/${id}`);
export const getHashtagByText    = (tag)     => client.get(`/hashtags/tag/${tag}`);
export const getHashtagPosts     = (id, p)   => client.get(`/hashtags/${id}/posts`, { params: p });
export const createHashtag       = (data)    => client.post('/hashtags', data);
export const updateHashtag       = (id, p)   => client.patch(`/hashtags/${id}`, p);
export const deleteHashtag       = (id)      => client.delete(`/hashtags/${id}`);
