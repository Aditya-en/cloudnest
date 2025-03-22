import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Enum types
export enum NodeType {
  FILE = 'file',
  FOLDER = 'folder'
}

export enum AccessLevel {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private'
}

// Interfaces
export interface IFileSystemNode extends Document {
  name: string;
  type: NodeType;
  owner: string; // Clerk user ID
  parent: mongoose.Types.ObjectId | null;
  path: string; // Virtual path for easier navigation
  s3Key: string;
  size: number;
  mimeType?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShareLink extends Document {
  node: mongoose.Types.ObjectId;
  token: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canShare: boolean;
  };
  accessLevel: AccessLevel;
  expiresAt?: Date;
  createdBy: string; // Clerk user ID
  password?: string; // Hashed password for private links
  createdAt: Date;
  updatedAt: Date;
}

// Schemas
const FileSystemNodeSchema = new Schema<IFileSystemNode>({
  name: { 
    type: String, 
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return v.length > 0 && !v.includes('/');
      },
      message: 'Name cannot be empty or contain "/"'
    }
  },
  type: { 
    type: String, 
    enum: Object.values(NodeType),
    required: true 
  },
  owner: { 
    type: String, 
    required: true,
    index: true
  },
  parent: { 
    type: Schema.Types.ObjectId, 
    ref: 'FileSystemNode',
    default: null
  },
  s3Key: { 
    type: String,
    required: function(this: IFileSystemNode) {
      return this.type === NodeType.FILE;
    },
    unique: true
  },
  size: { 
    type: Number,
    required: function(this: IFileSystemNode) {
      return this.type === NodeType.FILE;
    }
  },
  mimeType: { 
    type: String,
    required: function(this: IFileSystemNode) {
      return this.type === NodeType.FILE;
    }
  },
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
});

// Add path virtual property
FileSystemNodeSchema.virtual('path').get(async function(this: IFileSystemNode) {
  let currentNode = this;
  const pathParts: string[] = [currentNode.name];
  
  while (currentNode.parent) {
    const parentNode = await mongoose.model('FileSystemNode').findById(currentNode.parent);
    if (!parentNode) break;
    
    pathParts.unshift(parentNode.name);
    currentNode = parentNode as IFileSystemNode;
  }
  
  return pathParts.join('/');
});

// Indexes for faster queries
FileSystemNodeSchema.index({ owner: 1, parent: 1, isDeleted: 1 });
FileSystemNodeSchema.pre('save', function(next) {
    if (this.type === NodeType.FOLDER && this.size === undefined) {
      this.size = 0;
    }
    next();
  });
// ShareLink Schema
const ShareLinkSchema = new Schema<IShareLink>({
  node: { 
    type: Schema.Types.ObjectId, 
    ref: 'FileSystemNode', 
    required: true,
    index: true
  },
  token: { 
    type: String, 
    unique: true, 
    default: () => uuidv4() 
  },
  permissions: {
    canView: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: false },
    canShare: { type: Boolean, default: false }
  },
  accessLevel: { 
    type: String, 
    enum: Object.values(AccessLevel),
    default: AccessLevel.UNLISTED
  },
  expiresAt: Date,
  createdBy: { 
    type: String, 
    required: true 
  },
  password: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
});

ShareLinkSchema.index({ token: 1 });
ShareLinkSchema.index({ createdBy: 1 });
ShareLinkSchema.index({ expiresAt: 1 });

// Create models
export const FileSystemNode = mongoose.model<IFileSystemNode>('FileSystemNode', FileSystemNodeSchema);
export const ShareLink = mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);