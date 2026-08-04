// Authorization helpers shared by Worker route handlers.
// User identity is already reduced to the whitelist id by authenticate().

export const ADMIN_USER_ID = "admin";

export const isAdmin = (userId) => userId === ADMIN_USER_ID;

export const canManageOwned = (userId, ownerId) =>
  Boolean(userId) && (isAdmin(userId) || userId === ownerId);

export const canManageParticipant = (userId, participantIds = []) =>
  Boolean(userId) && (isAdmin(userId) || participantIds.includes(userId));
