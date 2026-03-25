export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    admin: Pick<AdminAccount, 'id' | 'fullName' | 'email'>;
  };
}
