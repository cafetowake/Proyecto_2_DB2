import client from './client';

export const createUser          = (data)             => client.post('/users', data);
export const createVerifiedUser  = (data)             => client.post('/users/verified', data);
export const getUserById         = (id)               => client.get(`/users/${id}`);
export const getUsers            = (params)           => client.get('/users', { params });
export const getUserStats        = ()                 => client.get('/users/stats/aggregate');
export const updateUser          = (id, props)        => client.patch(`/users/${id}`, props);
export const verifyUser          = (id, badge)        => client.patch(`/users/${id}/verify`, { badge });
export const bulkUpdateUsers     = (filter, props)    => client.patch('/users/bulk', { filter, props });
export const removeUserProps     = (id, propKeys)     => client.delete(`/users/${id}/props`, { data: { propKeys } });
export const bulkRemoveUserProps = (filter, propKeys) => client.delete('/users/bulk/props', { data: { filter, propKeys } });
export const deleteUser          = (id)               => client.delete(`/users/${id}`);
export const bulkDeleteUsers     = (ids)              => client.delete('/users/bulk', { data: { ids } });
