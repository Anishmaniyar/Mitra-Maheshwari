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

export function listRegistrations(params: {
  limit: number;
  offset: number;
}): Promise<RegistrationPage> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  }).toString();
  return api<RegistrationPage>(`/admin/registrations?${query}`);
}

export function getRegistration(id: string): Promise<RegistrationDetail> {
  return api<RegistrationDetail>(`/admin/registrations/${id}`);
}

export function approveRegistration(id: string): Promise<RegistrationDetail> {
  return api<RegistrationDetail>(`/admin/registrations/${id}/approve`, {
    method: "POST",
  });
}

export function rejectRegistration(id: string): Promise<RegistrationDetail> {
  return api<RegistrationDetail>(`/admin/registrations/${id}/reject`, {
    method: "POST",
  });
}
