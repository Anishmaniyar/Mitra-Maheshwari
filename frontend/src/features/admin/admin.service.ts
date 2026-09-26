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
    isHead: boolean;
    status: string;
  }>;
}

export function listRegistrations(): Promise<{
  items: PendingRegistration[];
  total: number;
}> {
  return api<{ items: PendingRegistration[]; total: number; limit: number; offset: number }>(
    "/admin/registrations",
  ).then((data) => ({ items: data.items, total: data.total }));
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
