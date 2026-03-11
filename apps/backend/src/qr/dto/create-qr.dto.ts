export class CreateQrResponseDto {
  id: number;
  storeId: string;
  token: string;
  isActive: boolean;
  createdAt: Date;
  qrImageUrl: string;
  scanUrl: string;
}
