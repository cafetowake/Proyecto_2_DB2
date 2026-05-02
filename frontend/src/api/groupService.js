import client from './client';

export const createGroup     = (data)    => client.post('/groups', data);
export const getGroupById    = (id)      => client.get(`/groups/${id}`);
export const getGroups       = (params)  => client.get('/groups', { params });
export const getUserGroups   = (userId)  => client.get(`/groups/user/${userId}`);
export const getGroupMembers = (id, p)   => client.get(`/groups/${id}/members`, { params: p });
export const getGroupPosts   = (id, p)   => client.get(`/groups/${id}/posts`, { params: p });
export const updateGroup     = (id, p)   => client.patch(`/groups/${id}`, p);
export const deleteGroup     = (id)      => client.delete(`/groups/${id}`);
