import { Request, Response, NextFunction } from 'express';
import { FileSystemNode, IFileSystemNode, ShareLink, IShareLink } from './models';
import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
      node?: IFileSystemNode;
      share?: IShareLink;
    }
  }
}



// Middleware to check if user owns the node
export const requireOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const nodeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(nodeId)) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }
    
    const node = await FileSystemNode.findById(nodeId);
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    if (node.owner !== req.auth.userId) {
      return res.status(403).json({ error: 'You do not have permission to access this resource' });
    }
    
    req.node = node;
    next();
  } catch (error) {
    console.error('Error in requireOwnership middleware:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to validate share token
export const validateShareToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token;
    if (!token) {
      return res.status(400).json({ error: 'Share token is required' });
    }
    
    const share = await ShareLink.findOne({ token }).populate('node');
    
    if (!share) {
      return res.status(404).json({ error: 'Shared resource not found' });
    }
    
    if (share.expiresAt && share.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Share link has expired' });
    }
    
    if (!share.node) {
      return res.status(404).json({ error: 'Referenced file or folder not found' });
    }
    
    // If password is required, validate it
    if (share.password) {
      const providedPassword = req.body.password || req.query.password;
      if (!providedPassword) {
        return res.status(401).json({ 
          error: 'Password required', 
          requiresPassword: true 
        });
      }
      
    //   const isPasswordValid = await bcrypt.compare(providedPassword, share.password);
      const isPasswordValid = providedPassword === share.password;
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }
    
    req.share = share;
    next();
  } catch (error) {
    console.error('Error validating share token:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check if user has permission to edit the shared resource
export const requireEditPermission = (req: Request, res: Response, next: NextFunction) => {
  if (!req.share) {
    return res.status(500).json({ error: 'Share validation required before checking permissions' });
  }
  
  if (!req.share.permissions.canEdit) {
    return res.status(403).json({ error: 'You do not have permission to edit this resource' });
  }
  
  next();
};