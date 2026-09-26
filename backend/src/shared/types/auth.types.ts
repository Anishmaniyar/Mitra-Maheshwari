export type Role = 'ADMIN' | 'MEMBER';

export interface AccessTokenClaims {
  sub: string;
  role: Role;
  familyId: string;
  isFamilyHead: boolean;
  jti: string;
}

export interface AuthUser {
  memberId: string;
  role: Role;
  familyId: string;
  isFamilyHead: boolean;
  jti: string;
}
