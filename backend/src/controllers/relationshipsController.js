// Relationship controller - handles HTTP requests/responses
// Calls relationshipService functions

// POST /follow - Create FOLLOWS relationship
export async function followUser(req, res, next) {
  // TODO: Implement
}

// POST /like - Create LIKES relationship
export async function likePost(req, res, next) {
  // TODO: Implement
}

// POST /save - Create SAVED relationship
export async function savePost(req, res, next) {
  // TODO: Implement
}

// POST /member - Create MEMBER_OF relationship
export async function joinGroup(req, res, next) {
  // TODO: Implement
}

// PATCH /follow/:from/:to - Update FOLLOWS props
export async function updateFollowRelation(req, res, next) {
  // TODO: Implement
}

// PATCH /follow/bulk - Update many FOLLOWS
export async function bulkUpdateFollows(req, res, next) {
  // TODO: Implement
}

// PATCH /follow/:from/:to/add - Add prop to FOLLOWS
export async function addFollowProp(req, res, next) {
  // TODO: Implement
}

// DELETE /follow/:from/:to/prop - Remove prop from FOLLOWS
export async function removeFollowProp(req, res, next) {
  // TODO: Implement
}

// DELETE /follow/bulk/prop - Remove prop from many FOLLOWS
export async function bulkRemoveFollowProp(req, res, next) {
  // TODO: Implement
}

// DELETE /follow/:from/:to - Unfollow (delete relationship)
export async function unfollowUser(req, res, next) {
  // TODO: Implement
}

// DELETE /follow/bulk - Unfollow many
export async function bulkUnfollow(req, res, next) {
  // TODO: Implement
}
