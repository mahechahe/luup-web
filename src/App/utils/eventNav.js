import { isClientUser } from './roles';

/** Base path for a single event's pages, aware of the client's separate route namespace. */
export const eventBasePath = (eventId, roleId) =>
  isClientUser(roleId) ? `/cliente/eventos/${eventId}` : `/eventos/${eventId}`;
