import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from 'react';

import { FolderIcon, DocumentIcon, ArrowDownTrayIcon, TrashIcon} from '@heroicons/react/24/outline';
import NavBar from "./components/NavBar";
import Breadcrumbs from "./components/Breadcrumbs";
import CreateFolderButton from "./components/CreateFolderButton";
import UploadButton from "./components/UploadButton";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";

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
      const response = await fetch(`http://localhost:3000/files?folderPath=${encodeURIComponent(folderPath)}`, {
      // const response = await fetch(`http://localhost:3000/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      // console.log(response)
      const data = await response.json();
      console.log(data)
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
    console.log("current folder is ", currentFolder)
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
          <UploadButton
            theme={theme}
            currentFolder={currentFolder} // Pass currentFolder as prop
            onUploadComplete={() => fetchFiles(currentFolder)} // Add callback to refresh files
          />

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !(menuRef.current as any).contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    console.log("Delete button clicked for key:", item.key);
    console.log("Item type:", item.type); 
    try {
      const token = await getToken();
      console.log("Fetched token for delete:", token);

      const response = await fetch(`http://localhost:3000/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key: item.key })
      });

      if (!response.ok) {
        console.error("Delete request failed with status:", response.status);
        throw new Error(`Server responded with status: ${response.status}`);
      }

      console.log("File deleted successfully on server");

      onDelete();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error deleting file:', error);
      if (error instanceof Error) {
        alert(`Error deleting file: ${error.message}`);
      }
    }
  }

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event propagation
    console.log("Delete button clicked");
    setIsMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event propagation
    console.log("Download button clicked for key:", item.key);
    try {
      const token = await getToken();
      console.log("Fetched token for download:", token);

      const response = await fetch(`http://localhost:3000/download?key=${encodeURIComponent(item.key)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error("Download request failed with status:", response.status);

        throw new Error(`Server responded with status: ${response.status}`);
      }

      const { url } = await response.json();
      console.log("Download URL received:", url);

      window.open(url, '_blank');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error instanceof Error){
        alert(`Error downloading file: ${error.message}`);
      }
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };


  const cardClasses = theme === 'dark' 
    ? 'border-gray-700 hover:bg-gray-700'
    : 'border-gray-200 hover:bg-gray-50';

  return (
    <div
      className={`group relative p-4 border rounded-lg cursor-pointer ${cardClasses}`}
      onDoubleClick={() => item.type === 'folder' && onNavigate(item.name)}

    >
      <div className="flex flex-col items-center text-center" onClick={toggleMenu}>
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
          onClick={(e) => e.stopPropagation()}

        >
          {item.type === 'file' && (
            <button 
              className={`flex items-center gap-2 w-full p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={handleDownload}

            >
              <ArrowDownTrayIcon className="w-4 h-4 text-blue-500" />
              <span>Download</span>
            </button>
          )}
          <button
            className={`flex items-center gap-2 w-full p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={handleDelete}

          >
            <TrashIcon className="w-4 h-4 text-red-500" />
            <span>Delete</span>
          </button>
        </div>
      )}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemName={item.name}
        theme={theme}
      />  
    </div>
  );

