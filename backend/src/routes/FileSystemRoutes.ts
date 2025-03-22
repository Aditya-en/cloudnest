import express, { Request, Response } from 'express';
import { FileSystemNode, NodeType } from '../models';
import {  requireOwnership } from '../middleware';
import {clerkMiddleware} from '@clerk/express'
import { generateS3Key, generateUploadUrl, generateDownloadUrl, deleteFileFromS3, generateUniqueFilename } from '../utils/s3Utils';
import mongoose from 'mongoose';

const router = express.Router();
router.use(clerkMiddleware())

// Get all root files and folders for the authenticated user
router.get('/api/files', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, parentId = null, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const query: any = {
      owner: req.auth?.userId,
      isDeleted: false
    };
    
    // Filter by parent folder
    if (parentId === 'null' || parentId === 'root' || parentId === '') {
      query.parent = null;
    } else if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId as string)) {
        return res.status(400).json({ error: 'Invalid parent ID' });
      }
      query.parent = parentId;
    }
    
    // Add search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Execute query with pagination
    const nodes = await FileSystemNode.find(query)
      .sort({ type: 1, name: 1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await FileSystemNode.countDocuments(query);
    
    res.json({
      nodes,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalItems: total
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get a specific file/folder by ID
router.get('/api/files/:id', requireOwnership, async (req: Request, res: Response) => {
  try {
    const node = req.node;
    res.json(node);
  } catch (error) {
    console.error('Error fetching file/folder:', error);
    res.status(500).json({ error: 'Failed to fetch file/folder' });
  }
});

// Create a new folder
router.post('/api/folders', async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    // Check parent folder existence if provided
    let parentNode = null;
    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ error: 'Invalid parent ID' });
      }
      
      parentNode = await FileSystemNode.findOne({ 
        _id: parentId, 
        owner: req.auth?.userId,
        type: NodeType.FOLDER,
        isDeleted: false
      });
      
      if (!parentNode) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }
    
    // Check if folder with same name already exists in the parent
    const existingFolder = await FileSystemNode.findOne({
      name,
      parent: parentId || null,
      owner: req.auth?.userId,
      type: NodeType.FOLDER,
      isDeleted: false
    });
    
    if (existingFolder) {
      return res.status(409).json({ error: 'Folder with this name already exists' });
    }
    
    // Create the folder
    const folder = await FileSystemNode.create({
      name,
      type: NodeType.FOLDER,
      owner: req.auth?.userId,
      parent: parentId || null
    });
    
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Prepare for file upload
router.post('/api/files/upload-url', async (req: Request, res: Response) => {
  try {
    const { filename, mimeType, size, parentId } = req.body;
    
    if (!filename || !mimeType || !size) {
      return res.status(400).json({ error: 'Filename, mimeType and size are required' });
    }
    
    // Check parent folder if provided
    let parentNode = null;
    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ error: 'Invalid parent ID' });
      }
      
      parentNode = await FileSystemNode.findOne({ 
        _id: parentId, 
        owner: req.auth?.userId,
        type: NodeType.FOLDER,
        isDeleted: false
      });
      
      if (!parentNode) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }
    
    // Check if file with same name already exists
    const existingFile = await FileSystemNode.findOne({
      name: filename,
      parent: parentId || null,
      owner: req.auth?.userId,
      type: NodeType.FILE,
      isDeleted: false
    });
    
    // Generate a unique filename if there's a conflict
    const finalFilename = existingFile ? generateUniqueFilename(filename) : filename;
    
    // Get parent path (for S3 key generation)
    let parentPath = '';
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
    
    // Generate S3 key
    const s3Key = generateS3Key(req.auth?.userId || '', finalFilename, parentPath);
    
    // Create file entry in database
    const file = await FileSystemNode.create({
      name: finalFilename,
      type: NodeType.FILE,
      owner: req.auth?.userId,
      parent: parentId || null,
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
    console.error('Error preparing file upload:', error);
    res.status(500).json({ error: 'Failed to prepare file upload' });
  }
});

// Get download URL for a file
router.get('/api/files/:id/download', requireOwnership, async (req: Request, res: Response) => {
  try {
    const node = req.node;
    
    if (node?.type !== NodeType.FILE) {
      return res.status(400).json({ error: 'Only files can be downloaded' });
    }
    
    const downloadUrl = await generateDownloadUrl(node?.s3Key, node?.name);
    
    res.json({ downloadUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// Rename a file or folder
router.put('/api/files/:id/rename', requireOwnership, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const node = req.node;
    
    if (!name) {
      return res.status(400).json({ error: 'New name is required' });
    }
    
    // Check if file/folder with same name exists in the same location
    const existingSibling = await FileSystemNode.findOne({
      _id: { $ne: node?._id },
      name,
      parent: node?.parent,
      owner: req.auth?.userId,
      type: node?.type,
      isDeleted: false
    });
    
    if (existingSibling) {
      return res.status(409).json({ error: `A ${node?.type} with this name already exists in this location` });
    }
    
    // For files, we need to update the S3 key as well
    if (node?.type === NodeType.FILE) {
      // Get the current path
      let parentPath = '';
      if (node?.parent) {
        const parentNode = await FileSystemNode.findById(node.parent);
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
      }
      
      const newS3Key = generateS3Key(req.auth?.userId || '', name, parentPath);
      
      // We don't actually rename the object in S3, just update the reference in our database
      // This avoids the need to copy and delete objects in S3
      node!.s3Key = newS3Key;
    }
    
    node!.name = name;
    await node?.save();
    
    res.json(node);
  } catch (error) {
    console.error('Error renaming file/folder:', error);
    res.status(500).json({ error: 'Failed to rename file/folder' });
  }
});

// Move a file or folder
router.put('/api/files/:id/move', requireOwnership, async (req: Request, res: Response) => {
  try {
    const { destinationFolderId } = req.body;
    const node = req.node;
    
    // Check if destination is the same as current parent
    if (String(node?.parent) === String(destinationFolderId)) {
      return res.json(node);
    }
    
    // Validate destination folder if not moving to root
    let destinationFolder = null;
    if (destinationFolderId) {
      if (!mongoose.Types.ObjectId.isValid(destinationFolderId)) {
        return res.status(400).json({ error: 'Invalid destination folder ID' });
      }
      
      destinationFolder = await FileSystemNode.findOne({
        _id: destinationFolderId,
        owner: req.auth?.userId,
        type: NodeType.FOLDER,
        isDeleted: false
      });
      
      if (!destinationFolder) {
        return res.status(404).json({ error: 'Destination folder not found' });
      }
      
      // Prevent moving a folder into its own subdirectory
      if (node?.type === NodeType.FOLDER) {
        // Check if destination is a descendant of the node being moved
        let currentNode = destinationFolder;
        while (currentNode.parent) {
          if (String(currentNode.parent) === String(node?._id)) {
            return res.status(400).json({ error: 'Cannot move a folder into its own subdirectory' });
          }
          currentNode = await FileSystemNode.findById(currentNode.parent) as any;
          if (!currentNode) break;
        }
      }
    }
    
    // Check for name conflict in destination
    const existingInDestination = await FileSystemNode.findOne({
      name: node?.name,
      parent: destinationFolderId || null,
      owner: req.auth?.userId,
      type: node?.type,
      isDeleted: false
    });
    
    if (existingInDestination) {
      return res.status(409).json({ error: `A ${node?.type} with this name already exists in the destination folder` });
    }
    
    // Update S3 key for files
    if (node?.type === NodeType.FILE) {
      // Get the new path
      let newParentPath = '';
      if (destinationFolder) {
        const pathParts: string[] = [];
        let currentNode = destinationFolder;
        
        while (currentNode) {
          pathParts.unshift(currentNode.name);
          if (!currentNode.parent) break;
          
          currentNode = await FileSystemNode.findById(currentNode.parent) as any;
          if (!currentNode) break;
        }
        
        newParentPath = pathParts.join('/');
      }
      
      const newS3Key = generateS3Key(req.auth?.userId || '', node?.name, newParentPath);
      
      // Again, we don't actually move the object in S3, just update the reference
      node!.s3Key = newS3Key;
    }
    
    // Update parent
    node!.parent = destinationFolderId || null;
    await node?.save();
    
    res.json(node);
  } catch (error) {
    console.error('Error moving file/folder:', error);
    res.status(500).json({ error: 'Failed to move file/folder' });
  }
});

// Soft delete a file or folder (mark as deleted)
router.delete('/api/files/:id', requireOwnership, async (req: Request, res: Response) => {
  try {
    const node = req.node;
    
    // Mark as deleted
    node!.isDeleted = true;
    await node?.save();
    
    // If it's a folder, recursively mark all children as deleted
    if (node?.type === NodeType.FOLDER) {
      await markChildrenAsDeleted(node?._id, req.auth?.userId || '');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file/folder:', error);
    res.status(500).json({ error: 'Failed to delete file/folder' });
  }
});

// Helper function to recursively mark children as deleted
async function markChildrenAsDeleted(parentId: mongoose.Types.ObjectId, userId: string): Promise<void> {
  const children = await FileSystemNode.find({
    parent: parentId,
    owner: userId,
    isDeleted: false
  });
  
  for (const child of children) {
    child.isDeleted = true;
    await child.save();
    
    if (child.type === NodeType.FOLDER) {
      await markChildrenAsDeleted(child._id, userId);
    }
  }
}

// Restore a deleted file or folder
router.post('/api/files/:id/restore', requireOwnership, async (req: Request, res: Response) => {
  try {
    const node = req.node;
    
    if (!node?.isDeleted) {
      return res.status(400).json({ error: 'File/folder is not deleted' });
    }
    
    // Check if parent is deleted
    if (node.parent) {
      const parentNode = await FileSystemNode.findById(node.parent);
      if (parentNode?.isDeleted) {
        return res.status(400).json({ error: 'Cannot restore a file/folder whose parent is deleted' });
      }
    }
    
    // Restore file/folder
    node.isDeleted = false;
    await node.save();
    
    // If it's a folder, offer to restore children but don't do it automatically
    let hasDeletedChildren = false;
    if (node.type === NodeType.FOLDER) {
      const deletedChildren = await FileSystemNode.countDocuments({
        parent: node._id,
        owner: req.auth?.userId,
        isDeleted: true
      });
      
      hasDeletedChildren = deletedChildren > 0;
    }
    
    res.json({ 
      success: true, 
      node,
      hasDeletedChildren
    });
  } catch (error) {
    console.error('Error restoring file/folder:', error);
    res.status(500).json({ error: 'Failed to restore file/folder' });
  }
});

// Permanently delete a file or folder
router.delete('/api/files/:id/permanent', requireOwnership, async (req: Request, res: Response) => {
  try {
    const node = req.node;
    
    // If it's a file, delete from S3 first
    if (node?.type === NodeType.FILE) {
      await deleteFileFromS3(node?.s3Key);
    } else if (node?.type === NodeType.FOLDER) {
      // For folders, find and delete all contained files from S3
      await deleteAllFilesInFolder(node?._id, req.auth?.userId || '');
    }
    
    // Delete from database
    await FileSystemNode.deleteOne({ _id: node?._id });
    
    // If it's a folder, recursively delete all children
    if (node?.type === NodeType.FOLDER) {
      await FileSystemNode.deleteMany({
        parent: node?._id,
        owner: req.auth?.userId
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting file/folder:', error);
    res.status(500).json({ error: 'Failed to permanently delete file/folder' });
  }
});

// Helper function to recursively delete all files in a folder from S3
async function deleteAllFilesInFolder(folderId: mongoose.Types.ObjectId, userId: string): Promise<void> {
  // Get all files directly in the folder
  const files = await FileSystemNode.find({
    parent: folderId,
    owner: userId,
    type: NodeType.FILE
  });
  
  // Delete each file from S3
  for (const file of files) {
    await deleteFileFromS3(file.s3Key);
  }
  
  // Get all subfolders
  const subfolders = await FileSystemNode.find({
    parent: folderId,
    owner: userId,
    type: NodeType.FOLDER
  });
  
  // Recursively process subfolders
  for (const subfolder of subfolders) {
    await deleteAllFilesInFolder(subfolder._id, userId);
  }
}

export default router;