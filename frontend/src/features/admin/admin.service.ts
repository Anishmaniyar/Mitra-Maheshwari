import { api } from "../../services/api";

export interface PendingRegistration {
  familyId: string;
  familyCode: string;
  familyStatus: string;
  createdAt: string;
  headMemberId: string | null;
  headName: string | null;
  headMobile: string | null;
}

export interface RegistrationPage {
  items: PendingRegistration[];
  total: number;
  limit: number;
  offset: number;
}

export interface RegistrationDetail {
  family: {
    id: string;
    familyCode: string;
    status: string;
    approvedAt: string | null;
    createdAt: string;
  };
  members: Array<{
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    mobile: string | null;
    bloodGroup: string | null;
    age: number | null;
    occupation: string | null;
    area: string | null;
    panName: string | null;
    panNumber: string | null;
    isHead: boolean;
    status: string;
  }>;
}

/* Admin calls rely exclusively on the HttpOnly admin-session cookie. They skip
   the member Bearer token and the member refresh retry: a member session must
   never influence admin access. */
const ADMIN_REQUEST = { auth: false, retryWithRefresh: false } as const;

/** Exchanges the link's fragment secret for an admin-session cookie. */
export function exchangeAdminLink(secret: string): Promise<{ authenticated: true }> {
  return api<{ authenticated: true }>("/admin/session", {
    ...ADMIN_REQUEST,
    method: "POST",
    body: { secret },
  });
}

/** Confirms an existing admin-session cookie (e.g. after a page reload). */
export function getAdminSession(): Promise<{ authenticated: true }> {
  return api<{ authenticated: true }>("/admin/session", ADMIN_REQUEST);
}

export function logoutAdminSession(): Promise<null> {
  return api<null>("/admin/session/logout", {
    ...ADMIN_REQUEST,
    method: "POST",
  });
}

export function listRegistrations(params: {
  limit: number;
  offset: number;
}): Promise<RegistrationPage> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  }).toString();
  return api<RegistrationPage>(`/admin/registrations?${query}`, ADMIN_REQUEST);
}

export function getRegistration(id: string): Promise<RegistrationDetail> {
  return api<RegistrationDetail>(`/admin/registrations/${id}`, ADMIN_REQUEST);
}

export function approveRegistration(id: string): Promise<RegistrationDetail> {
  return api<RegistrationDetail>(`/admin/registrations/${id}/approve`, {
    ...ADMIN_REQUEST,
    method: "POST",
    headers: { "X-Admin-CSRF": "1" },
  });
}

export function rejectRegistration(id: string): Promise<RegistrationDetail> {
  return api<RegistrationDetail>(`/admin/registrations/${id}/reject`, {
    ...ADMIN_REQUEST,
    method: "POST",
    headers: { "X-Admin-CSRF": "1" },
  });
}
