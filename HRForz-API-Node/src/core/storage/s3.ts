import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { logger } from '../logging/logger';

export const SINGLE_FILE_CATEGORIES = new Set([
  'offer_letter',
  'pan_card',
  'aadhaar_card',
  'bank_passbook',
  'relieving_letter',
]);

class S3StorageClient {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const clientConfig: any = {
      region: config.AWS_S3_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
    };

    if (config.AWS_S3_ENDPOINT_URL) {
      clientConfig.endpoint = config.AWS_S3_ENDPOINT_URL;
      clientConfig.forcePathStyle = true;
    }

    this.client = new S3Client(clientConfig);
    this.bucket = config.AWS_S3_BUCKET;
  }

  async upload(fileBuffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );
      return key;
    } catch (err) {
      logger.error({ error: (err as Error).message, key }, 'storage_upload_failed');
      throw err;
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (err) {
      logger.error({ error: (err as Error).message, key }, 'storage_presign_failed');
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (err) {
      logger.error({ error: (err as Error).message, key }, 'storage_delete_failed');
      throw err;
    }
  }

  static buildKey(folder: string, filename: string): string {
    const safeName = `${uuidv4()}_${filename}`;
    return `${folder}/${safeName}`;
  }

  static buildDocumentKey(employeeCode: string, category: string, filename: string): string {
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const safe = filename.replace(/[^\w.\-]/g, '_');
    return `employees/${employeeCode}/documents/${category}/${ts}_${safe}`;
  }
}

export const storage = new S3StorageClient();
export { S3StorageClient };
