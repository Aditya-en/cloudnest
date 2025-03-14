import { useAuth } from "@clerk/clerk-react";
import { FolderPlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function CreateFolderButton({ currentFolder, onCreated, theme }: { currentFolder: string, onCreated: () => void, theme: string }) {
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
        const response = await fetch(`http://localhost:3000/folders`, {
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
  
  