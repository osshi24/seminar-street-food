export type StoreOwnerStatus = 'pending' | 'active' | 'inactive' | 'rejected';

export interface StoreOwner {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: StoreOwnerStatus;
  registrationReason?: string;
  failedLoginAttempts: number;
  lockoutUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  stores?: Store[];
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  status: 'inactive' | 'active';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  description?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterStoreOwnerDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  storeName: string;
  registrationReason: string;
}

export interface RegisterResponse {
  data: {
    message: string;
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    account: Pick<StoreOwner, 'id' | 'fullName' | 'email' | 'status'>;
  };
}
