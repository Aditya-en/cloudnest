import express, { Request, Response } from 'express';
import { FileSystemNode, ShareLink, NodeType, AccessLevel, IShareLink } from '../models';
import {  requireOwnership, validateShareToken, requireEditPermission } from '../middleware';
import { generateDownloadUrl, generateUploadUrl, generateUniqueFilename, generateS3Key } from '../utils/s3Utils';
import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';

const router = express.Router();

// Create a share link
router.post('/api/shares', async (req: Request, res: Response) => {
  try {
    const { nodeId, permissions, accessLevel, expiresAt, password } = req.body;
    
    if (!nodeId || !mongoose.Types.ObjectId.isValid(nodeId)) {
      return res.status(400).json({ error: 'Valid node ID is required' });
    }
    
    // Check if the node exists and belongs to the user
    const node = await FileSystemNode.findOne({
      _id: nodeId,
      owner: req.auth?.userId,
      isDeleted: false
    });
    
    if (!node) {
      return res.status(404).json({ error: 'File or folder not found' });
    }
    
    // Prepare share data
    const shareData: Partial<IShareLink> = {
      node: node._id,
      createdBy: req.auth?.userId || '',
      permissions: {
        canView: permissions?.canView ?? true,
        canEdit: permissions?.canEdit ?? false,
        canShare: permissions?.canShare ?? false
      },
      accessLevel: accessLevel || AccessLevel.UNLISTED
    };
    
    // Handle expiration if provided
    if (expiresAt) {
      shareData.expiresAt = new Date(expiresAt);
    }
    
    // Hash password if provided
    if (password) {
    //   shareData.password = await bcrypt.hash(password, 10);
      shareData.password = password;
    }
    
    // Create the share
    const share = await ShareLink.create(shareData);
    
    // Generate a shareable URL
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${share.token}`;
    
    res.status(201).json({
      share,
      shareUrl
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// List user's share links
router.get('/api/shares', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Find all shares created by the user
    const shares = await ShareLink.find({ createdBy: req.auth?.userId })
      .populate('node')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await ShareLink.countDocuments({ createdBy: req.auth?.userId });
    
    res.json({
      shares,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalItems: total
    });
  } catch (error) {
    console.error('Error fetching share links:', error);
    res.status(500).json({ error: 'Failed to fetch share links' });
  }
});

// Get a specific share link
router.get('/api/shares/:id', async (req: Request, res: Response) => {
  try {
    const shareId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(shareId)) {
      return res.status(400).json({ error: 'Invalid share ID' });
    }
    
    const share = await ShareLink.findOne({
      _id: shareId,
      createdBy: req.auth?.userId
    }).populate('node');
    
    if (!share) {
      return res.status(404).json({ error: 'Share link not found' });
    }
    
    res.json(share);
  } catch (error) {
    console.error('Error fetching share link:', error);
    res.status(500).json({ error: 'Failed to fetch share link' });
  }
});

// Update a share link
router.put('/api/shares/:id', async (req: Request, res: Response) => {
  try {
    const shareId = req.params.id;
    const { permissions, accessLevel, expiresAt, password } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(shareId)) {
      return res.status(400).json({ error: 'Invalid share ID' });
    }
    
    const share = await ShareLink.findOne({
      _id: shareId,
      createdBy: req.auth?.userId
    });
    
    if (!share) {
      return res.status(404).json({ error: 'Share link not found' });
    }
    
    // Update fields if provided
    if (permissions) {
      share.permissions = {
        canView: permissions.canView ?? share.permissions.canView,
        canEdit: permissions.canEdit ?? share.permissions.canEdit,
        canShare: permissions.canShare ?? share.permissions.canShare
      };
    }
    
    if (accessLevel) {
      share.accessLevel = accessLevel;
    }
    
    if (expiresAt) {
      share.expiresAt = new Date(expiresAt);
    } else if (expiresAt === null) {
      // Remove expiration if explicitly set to null
      share.expiresAt = undefined;
    }
    
    if (password !== undefined) {
      if (password === null) {
        // Remove password if explicitly set to null
        share.password = undefined;
      } else if (password) {
        // Update password if provided
        // share.password = await bcrypt.hash(password, 10);
        share.password = password
      }
    }
    
    await share.save();
    
    res.json(share);
  } catch (error) {
    console.error('Error updating share link:', error);
    res.status(500).json({ error: 'Failed to update share link' });
  }
});

// Delete a share link
router.delete('/api/shares/:id', async (req: Request, res: Response) => {
  try {
    const shareId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(shareId)) {
      return res.status(400).json({ error: 'Invalid share ID' });
    }
    
    const share = await ShareLink.findOne({
      _id: shareId,
      createdBy: req.auth?.userId
    });
    
    if (!share) {
      return res.status(404).json({ error: 'Share link not found' });
    }
    
    await share.deleteOne();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting share link:', error);
    res.status(500).json({ error: 'Failed to delete share link' });
  }
});

// --- PUBLIC SHARED ROUTES (NO AUTH REQUIRED) ---

// Get shared resource metadata
router.get('/shared/:token', validateShareToken, async (req: Request, res: Response) => {
  try {
    const share = req.share as IShareLink;
    const node = await FileSystemNode.findById(share.node);
    
    if (!node) {
      return res.status(404).json({ error: 'Shared resource not found' });
    }
    
    // Return metadata for the file/folder
    const metadata = {
      id: node._id,
      name: node.name,
      type: node.type,
      size: node.size,
      mimeType: node.mimeType,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      permissions: share.permissions,
      accessLevel: share.accessLevel,
      hasPassword: !!share.password
    };
    
    res.json(metadata);
  } catch (error) {
    console.error('Error fetching shared resource:', error);
    res.status(500).json({ error: 'Failed to fetch shared resource' });
  }
});

// List files in a shared folder
router.get('/shared/:token/files', validateShareToken, async (req: Request, res: Response) => {
  try {
    const share = req.share as IShareLink;
    const node = await FileSystemNode.findById(share.node);
    
    if (!node) {
      return res.status(404).json({ error: 'Shared resource not found' });
    }
    
    // If this is a file, not a folder
    if (node.type !== NodeType.FOLDER) {
      return res.status(400).json({ error: 'Shared resource is not a folder' });
    }
    
    // Get pagination parameters
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Fetch children
    const children = await FileSystemNode.find({
      parent: node._id,
      isDeleted: false
    })
      .sort({ type: 1, name: 1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await FileSystemNode.countDocuments({
      parent: node._id,
      isDeleted: false
    });
    
    res.json({
      parentName: node.name,
      parentId: node._id,
      items: children,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalItems: total
    });
  } catch (error) {
    console.error('Error listing shared folder contents:', error);
    res.status(500).json({ error: 'Failed to list shared folder contents' });
  }
});

// Download a shared file
router.get('/shared/:token/download', validateShareToken, async (req: Request, res: Response) => {
  try {
    const share = req.share as IShareLink;
    
    // Verify view permission
    if (!share.permissions.canView) {
      return res.status(403).json({ error: 'You do not have permission to view this file' });
    }
    
    const node = await FileSystemNode.findById(share.node);
    
    if (!node) {
      return res.status(404).json({ error: 'Shared file not found' });
    }
    
    if (node.type !== NodeType.FILE) {
      return res.status(400).json({ error: 'Shared resource is not a file' });
    }
    
    const downloadUrl = await generateDownloadUrl(node.s3Key, node.name);
    
    res.json({ downloadUrl });
  } catch (error) {
    console.error('Error downloading shared file:', error);
    res.status(500).json({ error: 'Failed to download shared file' });
  }
});

// Get upload URL for shared folder
router.post('/shared/:token/upload-url', validateShareToken, requireEditPermission, async (req: Request, res: Response) => {
  try {
    const share = req.share as IShareLink;
    const { filename, mimeType, size } = req.body;
    
    if (!filename || !mimeType || !size) {
      return res.status(400).json({ error: 'Filename, mimeType, and size are required' });
    }
    
    const node = await FileSystemNode.findById(share.node);
    
    if (!node) {
      return res.status(404).json({ error: 'Shared resource not found' });
    }
    
    let parentNodeId: mongoose.Types.ObjectId;
    
    // If shared resource is a file, upload to its parent folder
    // If it's a folder, upload to that folder
    if (node.type === NodeType.FILE) {
      if (!node.parent) {
        return res.status(400).json({ error: 'Cannot upload to this location' });
      }
      parentNodeId = node.parent as mongoose.Types.ObjectId;
    } else {
      parentNodeId = node._id;
    }
    
    // Check for name conflict
    const existingFile = await FileSystemNode.findOne({
      name: filename,
      parent: parentNodeId,
      isDeleted: false
    });
    
    // Generate a unique filename if there's a conflict
    const finalFilename = existingFile ? generateUniqueFilename(filename) : filename;
    
    // Get parent path for S3 key
    let parentPath = '';
    const parentNode = await FileSystemNode.findById(parentNodeId);
    if (parentNode) {
      const pathParts: string[] = [];
      let currentNode = parentNode;
      
      while (currentNode) {
        pathParts.unshift(currentNode.name);
        if (!currentNode.parent) break;
        
        currentNode = await FileSystemNode.findById(currentNode.parent) as any;
        if (!currentNode) break;
      }
      
      parentPath = pathParts.join('/');
    }
    
    // Generate S3 key using the owner's user ID (not the viewer)
    const s3Key = generateS3Key(node.owner, finalFilename, parentPath);
    
    // Create file entry in database
    const file = await FileSystemNode.create({
      name: finalFilename,
      type: NodeType.FILE,
      owner: node.owner, // Important: the owner is the original owner, not the person uploading
      parent: parentNodeId,
      s3Key,
      size,
      mimeType
    });
    
    // Generate presigned URL for upload
    const uploadUrl = await generateUploadUrl(s3Key, mimeType);
    
    res.status(201).json({
      file,
      uploadUrl
    });
  } catch (error) {
    console.error('Error preparing shared upload:', error);
    res.status(500).json({ error: 'Failed to prepare shared upload' });
  }
});

// Create folder in shared location
router.post('/shared/:token/folders', validateShareToken, requireEditPermission, async (req: Request, res: Response) => {
  try {
    const share = req.share as IShareLink;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    const node = await FileSystemNode.findById(share.node);
    
    if (!node) {
      return res.status(404).json({ error: 'Shared resource not found' });
    }
    
    let parentNodeId: mongoose.Types.ObjectId;
    
    // If shared resource is a file, create folder in its parent
    // If it's a folder, create folder in that folder
    if (node.type === NodeType.FILE) {
      if (!node.parent) {
        return res.status(400).json({ error: 'Cannot create folder in this location' });
      }
      parentNodeId = node.parent as mongoose.Types.ObjectId;
    } else {
      parentNodeId = node._id;
    }
    
    // Check for name conflict
    const existingFolder = await FileSystemNode.findOne({
      name,
      parent: parentNodeId,
      type: NodeType.FOLDER,
      isDeleted: false
    });
    
    if (existingFolder) {
      return res.status(409).json({ error: 'Folder with this name already exists' });
    }
    
    // Create folder
    const folder = await FileSystemNode.create({
      name,
      type: NodeType.FOLDER,
      owner: node.owner, // Important: the owner is the original owner
      parent: parentNodeId
    });
    
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder in shared location:', error);
    res.status(500).json({ error: 'Failed to create folder in shared location' });
  }
});

export default router;