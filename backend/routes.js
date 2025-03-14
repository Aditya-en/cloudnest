import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from "dotenv"
dotenv.config()
const creds = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}
console.log(creds)
const s3Client = new S3Client({ region: process.env.AWS_REGION,   
  credentials : creds
 });
const router = express.Router();

router.use(requireAuth());

const getUserPath = (userId, folderPath = '') => {
  const normalizedPath = folderPath.replace(/^\/|\/$/g, '');
  return `${userId}/${normalizedPath}`;
};

router.post('/upload-url', async (req, res) => {
  try {
    const { fileName, folderPath } = req.body;
    const userId = req.auth.userId;
    const key = `${getUserPath(userId, folderPath)}/${fileName}`;

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key
    };

    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
    res.json({ url, key });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

router.get('/files', async (req, res) => {
  try {
    const { folderPath } = req.query;
    const userId = req.auth.userId;
    const prefix = getUserPath(userId, folderPath) + '/';
    const params = {
      Bucket: process.env.S3_BUCKET,
      Prefix: prefix,
      Delimiter: '/'
    };
    const command = new ListObjectsV2Command(params);
    const data = await s3Client.send(command);
    const files = (data.Contents || []).map(file => ({
      name: file.Key.replace(prefix, ''),
      key: file.Key,
      type: 'file',
      size: file.Size,
      lastModified: file.LastModified
    }));
    const folders = (data.CommonPrefixes || []).map(folder => ({
      name: folder.Prefix.replace(prefix, '').replace(/\/$/, ''),
      key: folder.Prefix,
      type: 'folder'
    }));
    res.json([...folders, ...files]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/files', async (req, res) => {
  try {
    const { key } = req.body;
    const userId = req.auth.userId;
    if (!key) {
      return res.status(400).json({ error: 'Missing key parameter' });
    }

    if (!key.startsWith(userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key
    });
    await s3Client.send(command);
    res.json({ success: true });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

router.get('/download', async (req, res) => {
  try {
    const { key } = req.query;
    const userId = req.auth.userId;

    if (!key.startsWith(userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
    res.json({ url });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

router.post('/folders', async (req, res) => {
  try {
    const { name, folderPath } = req.body;
    const userId = req.auth.userId;
    const key = `${getUserPath(userId, folderPath)}/${name}/`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentLength: 0
    });
    await s3Client.send(command);
    res.json({ success: true, key });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

router.put('/files/rename', async (req, res) => {
  try {
    const { oldKey, newKey } = req.body;
    const userId = req.auth.userId;

    if (!oldKey.startsWith(userId) || !newKey.startsWith(userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Copy the object
    const copyCommand = new CopyObjectCommand({
      Bucket: process.env.S3_BUCKET,
      CopySource: `/${process.env.S3_BUCKET}/${oldKey}`,
      Key: newKey
    });
    await s3Client.send(copyCommand);

    // Delete the original object
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: oldKey
    });
    await s3Client.send(deleteCommand);

    res.json({ success: true });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

export default router;
