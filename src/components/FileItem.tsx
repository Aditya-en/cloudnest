import { ArrowDownTrayIcon, DocumentIcon, FolderIcon, TrashIcon } from "@heroicons/react/24/outline";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
interface FileItem {
    name: string;
    type: 'file' | 'folder';
    size?: number;
    lastModified?: Date;
    key: string;
  }

export default function FileItem({ item, onNavigate, onDelete, theme }: { item: FileItem, onNavigate: (name: string) => void, onDelete: () => void, theme: string }) {
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
  
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/files`, {
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
  
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/download?key=${encodeURIComponent(item.key)}`, {
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
  }
  