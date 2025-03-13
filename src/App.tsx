import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from 'react';
import { FolderIcon, DocumentIcon, ArrowDownTrayIcon, TrashIcon, PlusIcon, FolderPlusIcon } from '@heroicons/react/24/outline';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: Date;
  key: string;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="p-6 max-w-7xl mx-auto">
        <SignedOut>
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to CloudNest</h2>
            <p className="text-gray-600 mb-8">Secure cloud storage for all your files</p>
            {/* <SignInButton className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors" /> */}
            <SignInButton />
          </div>
        </SignedOut>
        <SignedIn>
          <FileBrowser />
        </SignedIn>
      </main>
    </div>
  );
}

function NavBar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          CloudNest
        </h1>
        <div className="flex items-center gap-4">
          <SignedIn>
            <UploadButton />
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}

function FileBrowser() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const { getToken } = useAuth();

  const fetchFiles = async (folderPath = '') => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/files?folderPath=${folderPath}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setFiles(data.map((item: any) => ({
        ...item,
        key: item.type === 'folder' ? `${currentFolder}/${item.name}/` : `${currentFolder}/${item.name}`
      })));
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  useEffect(() => {
    fetchFiles(currentFolder);
  }, [currentFolder]);

  const navigateToFolder = (folderName: string) => {
    setCurrentFolder(prev => `${prev}/${folderName}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <Breadcrumbs currentFolder={currentFolder} setCurrentFolder={setCurrentFolder} />
        <div className="flex gap-2">
          <CreateFolderButton currentFolder={currentFolder} onCreated={fetchFiles} />
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <PlusIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {files.map((item) => (
          <FileItem
            key={item.key}
            item={item}
            onNavigate={navigateToFolder}
            onDelete={fetchFiles}
          />
        ))}
      </div>
    </div>
  );
}

function FileItem({ item, onNavigate, onDelete }: { item: FileItem, onNavigate: (name: string) => void, onDelete: () => void }) {
  const { getToken } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const token = await getToken();
      await fetch(`http://localhost:3000/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key: item.key })
      });
      onDelete();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div
      className="group relative p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
      onDoubleClick={() => item.type === 'folder' && onNavigate(item.name)}
      onContextMenu={(e) => {
        e.preventDefault();
        setIsMenuOpen(true);
      }}
    >
      <div className="flex flex-col items-center text-center">
        {item.type === 'folder' ? (
          <FolderIcon className="w-12 h-12 text-blue-500 mb-2" />
        ) : (
          <DocumentIcon className="w-12 h-12 text-gray-400 mb-2" />
        )}
        <span className="text-sm text-gray-700 break-all">{item.name}</span>
        {item.size && (
          <span className="text-xs text-gray-500 mt-1">
            {(item.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {isMenuOpen && (
        <div className="absolute right-0 top-0 bg-white shadow-lg rounded-lg p-2 z-10">
          <button
            className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded"
            onClick={handleDelete}
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
            <span>Delete</span>
          </button>
          {item.type === 'file' && (
            <button className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded">
              <ArrowDownTrayIcon className="w-4 h-4 text-blue-500" />
              <span>Download</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Breadcrumbs({ currentFolder, setCurrentFolder }: { currentFolder: string, setCurrentFolder: (path: string) => void }) {
  const folders = currentFolder.split('/').filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <button
        onClick={() => setCurrentFolder('')}
        className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded"
      >
        <FolderIcon className="w-4 h-4" />
        <span>Home</span>
      </button>
      {folders.map((folder, index) => (
        <button
          key={index}
          onClick={() => setCurrentFolder(folders.slice(0, index + 1).join('/'))}
          className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded"
        >
          <span>/</span>
          <span>{folder}</span>
        </button>
      ))}
    </div>
  );
}

function UploadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      const token = await getToken();
      const response = await fetch('http://localhost:3000/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fileName: file.name })
      });

      const { url, key } = await response.json();

      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('PUT', url);
        xhr.send(file);
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    setIsOpen(false);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusIcon className="w-5 h-5" />
        <span>Upload</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Upload File</h3>

            {!isUploading && !uploadError && (
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                className="w-full mb-4"
                disabled={isUploading}
              />
            )}

            {isUploading && (
              <div className="space-y-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  {uploadProgress}% Uploaded
                </div>
              </div>
            )}

            {uploadError && (
              <div className="text-red-600 mb-4">
                Error: {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              {!isUploading && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              )}

              {isUploading && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-red-600 hover:text-red-800"
                >
                  Abort Upload
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function CreateFolderButton({ currentFolder, onCreated }: { currentFolder: string, onCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const { getToken } = useAuth();

  const handleCreate = async () => {
    try {
      const token = await getToken();
      await fetch('http://localhost:3000/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: folderName,
          folderPath: currentFolder
        })
      });
      onCreated();
      setIsOpen(false);
      setFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-2 rounded-lg"
      >
        <FolderPlusIcon className="w-5 h-5" />
        <span>New Folder</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}