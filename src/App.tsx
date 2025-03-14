import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from 'react';
import { FolderIcon, DocumentIcon, ArrowDownTrayIcon, TrashIcon, 
         PlusIcon, FolderPlusIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

// Define API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: Date;
  key: string;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    // Check for stored preference or system preference
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h1>This is not work4wering</h1>
      <NavBar toggleTheme={toggleTheme} theme={theme} />
      <main className="p-6 max-w-7xl mx-auto">
        <SignedOut>
          <div className="text-center py-20">
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Welcome to CloudNest
            </h2>
            <p className={`mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Secure cloud storage for all your files
            </p>
            <SignInButton mode="modal" />
          </div>
        </SignedOut>
        <SignedIn>
          <FileBrowser theme={theme} />
        </SignedIn>
      </main>
    </div>
  );
}

function NavBar({ toggleTheme, theme }: {toggleTheme : ()=> void ,theme:string}) {
  return (
    <nav className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          CloudNest
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
          <SignedIn>
            <UploadButton theme={theme} />
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}

function FileBrowser({ theme }: {theme: string}) {
  type er = null | String;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null as er);
  const { getToken } = useAuth();

  const fetchFiles = async (folderPath = '') => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/files?folderPath=${encodeURIComponent(folderPath)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentFolder);
  }, [currentFolder]);

  const navigateToFolder = (folderName: string) => {
    const newPath = currentFolder ? `${currentFolder}/${folderName}` : folderName;
    setCurrentFolder(newPath);
  };

  const cardClasses = theme === 'dark' 
    ? 'bg-gray-800 border-gray-700 text-gray-200' 
    : 'bg-white border-gray-200 text-gray-900';

  return (
    <div className={`rounded-xl shadow-sm border ${cardClasses}`}>
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
        <Breadcrumbs currentFolder={currentFolder} setCurrentFolder={setCurrentFolder} theme={theme} />
        <div className="flex gap-2">
          <CreateFolderButton currentFolder={currentFolder} onCreated={() => fetchFiles(currentFolder)} theme={theme} />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4">Loading files...</p>
        </div>
      ) : error ? (
        <div className={`p-12 text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
          <p>Error loading files: {error}</p>
          <button 
            onClick={() => fetchFiles(currentFolder)} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="p-12 text-center">
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
            No files found in this directory
            </p>
          <button 
            onClick={() => fetchFiles(currentFolder)} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Files
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
          {files.map((item) => (
            <FileItem
              key={item.key}
              item={item}
              onNavigate={navigateToFolder}
              onDelete={() => fetchFiles(currentFolder)}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileItem({ item, onNavigate, onDelete, theme }: { item: FileItem, onNavigate: (name: string) => void, onDelete: () => void, theme: string }) {
  const { getToken } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event : MouseEvent) => {
      if (menuRef.current && !(event.target as Node).contains(menuRef.current)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key: item.key })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      onDelete();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error deleting file:', error);
      if (error instanceof Error) {
        alert(`Error deleting file: ${error.message}`);
      }
    }
  };

  const handleDownload = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/download?key=${encodeURIComponent(item.key)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const { url } = await response.json();
      window.open(url, '_blank');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error instanceof Error){
        alert(`Error downloading file: ${error.message}`);
      }
    }
  };

  const cardClasses = theme === 'dark' 
    ? 'border-gray-700 hover:bg-gray-700'
    : 'border-gray-200 hover:bg-gray-50';

  return (
    <div
      className={`group relative p-4 border rounded-lg cursor-pointer ${cardClasses}`}
      onDoubleClick={() => item.type === 'folder' && onNavigate(item.name)}
      onClick={() => setIsMenuOpen(!isMenuOpen)}
    >
      <div className="flex flex-col items-center text-center">
        {item.type === 'folder' ? (
          <FolderIcon className="w-12 h-12 text-blue-500 mb-2" />
        ) : (
          <DocumentIcon className="w-12 h-12 text-gray-400 mb-2" />
        )}
        <span className={`text-sm break-all ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
          {item.name}
        </span>
        {item.size && (
          <span className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {(item.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {isMenuOpen && (
        <div 
          ref={menuRef}
          className={`absolute right-0 top-0 shadow-lg rounded-lg p-2 z-10 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
        >
          {item.type === 'file' && (
            <button 
              className={`flex items-center gap-2 w-full p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-blue-500" />
              <span>Download</span>
            </button>
          )}
          <button
            className={`flex items-center gap-2 w-full p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Breadcrumbs({ currentFolder, setCurrentFolder, theme }: { currentFolder: string, setCurrentFolder: (path: string) => void, theme: string }) {
  const folders = currentFolder.split('/').filter(Boolean);
  
  const buttonClasses = theme === 'dark' 
    ? 'hover:bg-gray-700 text-gray-300'
    : 'hover:bg-gray-100 text-gray-600';

  return (
    <div className="flex items-center gap-2 text-sm overflow-x-auto">
      <button
        onClick={() => setCurrentFolder('')}
        className={`flex items-center gap-1 p-1 rounded ${buttonClasses}`}
      >
        <FolderIcon className="w-4 h-4" />
        <span>Home</span>
      </button>
      {folders.map((folder, index) => (
        <button
          key={index}
          onClick={() => setCurrentFolder(folders.slice(0, index + 1).join('/'))}
          className={`flex items-center gap-1 p-1 rounded ${buttonClasses}`}
        >
          <span>/</span>
          <span>{folder}</span>
        </button>
      ))}
    </div>
  );
}

function UploadButton({ theme }: {theme: string}) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentFolder, setCurrentFolder] = useState('');

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          fileName: file.name,
          folderPath: currentFolder
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      const { url, key } = data;

      if (!url) {
        throw new Error('No upload URL received from server');
      }

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
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('XHR error occurred');
          reject(new Error('Network error occurred during upload'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });
    } catch (error) {
      console.error('Upload error:', error);
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

  const handleFileSelect = (e : any) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file)
        .then(() => {
          setTimeout(() => {
            setIsOpen(false);
            setUploadProgress(0);
            // Clear the file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }, 1000); // Give user time to see 100% complete
        })
        .catch((error) => {
          console.error('Upload handling error:', error);
        });
    }
  };

  const modalClasses = theme === 'dark' 
    ? 'bg-gray-800 border border-gray-700 text-white'
    : 'bg-white text-gray-900';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl w-96 ${modalClasses}`}>
            <h3 className="text-lg font-semibold mb-4">Upload File</h3>

            {!isUploading && !uploadError && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full mb-4"
                  disabled={isUploading}
                />
                <div className="mb-4">
                  <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Current folder:
                  </label>
                  <input
                    type="text"
                    value={currentFolder}
                    onChange={(e) => setCurrentFolder(e.target.value)}
                    placeholder="Leave empty for root folder"
                    className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </>
            )}

            {isUploading && (
              <div className="space-y-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-center text-sm">
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
                  className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}
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

function CreateFolderButton({ currentFolder, onCreated, theme }: { currentFolder: string, onCreated: () => void, theme: string }) {
  type er = null | String;
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null as er);
  const { getToken } = useAuth();

  const handleCreate = async () => {
    if (!folderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/folders`, {
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
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      onCreated();
      setIsOpen(false);
      setFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }

    } finally {
      setIsCreating(false);
    }
  };

  const modalClasses = theme === 'dark' 
    ? 'bg-gray-800 border border-gray-700 text-white'
    : 'bg-white text-gray-900';

  const buttonClasses = theme === 'dark'
    ? 'text-gray-300 hover:text-gray-100'
    : 'text-gray-600 hover:text-gray-900';
    
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${buttonClasses} p-2 rounded-lg`}
      >
        <FolderPlusIcon className="w-5 h-5" />
        <span>New Folder</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl w-96 ${modalClasses}`}>
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className={`w-full p-2 border rounded mb-4 ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            
            {error && (
              <div className="text-red-600 mb-4">
                Error: {error}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className={`px-4 py-2 rounded ${
                  theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                  isCreating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// Add this component to display a warning before deleting a folder
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  theme: string;
}
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName, theme }: DeleteConfirmationModalProps) {
  if (!isOpen) return null;
  
  const modalClasses = theme === 'dark' 
    ? 'bg-gray-800 border border-gray-700 text-white'
    : 'bg-white text-gray-900';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-xl w-96 ${modalClasses}`}>
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="mb-6">
          Are you sure you want to delete "{itemName}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${
              theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export { FileBrowser, FileItem, Breadcrumbs, UploadButton, CreateFolderButton, DeleteConfirmationModal };