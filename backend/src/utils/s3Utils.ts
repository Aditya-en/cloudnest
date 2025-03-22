import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'my-drive-clone';

// Generate S3 key based on user ID and path
export const generateS3Key = (userId: string, filename: string, parentPath: string = ''): string => {
  const sanitizedFilename = filename.replace(/[^\w\-. ]/g, '');
  const folderPath = parentPath ? `${parentPath}/` : '';
  return `${userId}/${folderPath}${sanitizedFilename}`;
};

// Generate random filename to prevent conflicts
export const generateUniqueFilename = (originalFilename: string): string => {
  const ext = path.extname(originalFilename);
  const nameWithoutExt = path.basename(originalFilename, ext);
  const hash = crypto.randomBytes(4).toString('hex');
  return `${nameWithoutExt}-${hash}${ext}`;
};

// Generate presigned URL for file upload
export const generateUploadUrl = async (s3Key: string, contentType: string, expiresIn: number = 3600): Promise<string> => {
  const putObjectParams = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType
  };

  const command = new PutObjectCommand(putObjectParams);
  return getSignedUrl(s3Client, command, { expiresIn });
};

// Generate presigned URL for file download
export const generateDownloadUrl = async (s3Key: string, filename: string, expiresIn: number = 3600): Promise<string> => {
  const getObjectParams = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`
  };

  const command = new GetObjectCommand(getObjectParams);
  return getSignedUrl(s3Client, command, { expiresIn });
};

// Delete file from S3
export const deleteFileFromS3 = async (s3Key: string): Promise<void> => {
  const deleteObjectParams = {
    Bucket: BUCKET_NAME,
    Key: s3Key
  };

  const command = new DeleteObjectCommand(deleteObjectParams);
  await s3Client.send(command);
};