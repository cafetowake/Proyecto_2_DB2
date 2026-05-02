import client from './client';

export const getTopics       = (params)  => client.get('/topics', { params });
export const getTopicById    = (id)      => client.get(`/topics/${id}`);
export const getTopicPosts   = (id, p)   => client.get(`/topics/${id}/posts`, { params: p });
export const createTopic     = (data)    => client.post('/topics', data);
export const updateTopic     = (id, p)   => client.patch(`/topics/${id}`, p);
export const deleteTopic     = (id)      => client.delete(`/topics/${id}`);
