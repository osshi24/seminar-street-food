import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly internalEndpoint: string;
  private readonly publicEndpoint: string;
  private readonly useSSL: boolean;

  constructor(private readonly configService: ConfigService) {
    const endpoint = configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = configService.get<number>('MINIO_PORT', 9000);
    this.useSSL = configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    this.bucket = configService.get<string>('MINIO_BUCKET_MEDIA', 'seminar-media');

    const protocol = this.useSSL ? 'https' : 'http';
    this.internalEndpoint = `${protocol}://${endpoint}:${port}`;

    // Public endpoint — what the browser uses to reach MinIO.
    // Falls back to the internal endpoint if not set separately.
    this.publicEndpoint = configService.get<string>('MINIO_PUBLIC_ENDPOINT', this.internalEndpoint);

    this.client = new S3Client({
      endpoint: this.internalEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      const appBaseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
      await this.client.send(new PutBucketCorsCommand({
        Bucket: this.bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: [appBaseUrl, 'http://localhost:3000', 'http://localhost:3001'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      }));
      this.logger.log('MinIO CORS configured');
    } catch (err) {
      this.logger.warn(`Failed to configure MinIO CORS: ${(err as Error).message}`);
    }
  }

  async generatePresignedPutUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn });

    // Replace internal endpoint with public endpoint so the browser can reach MinIO.
    if (this.publicEndpoint !== this.internalEndpoint) {
      return url.replace(this.internalEndpoint, this.publicEndpoint);
    }
    return url;
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getPublicUrl(key: string): string {
    return `${this.publicEndpoint}/${this.bucket}/${key}`;
  }
}
