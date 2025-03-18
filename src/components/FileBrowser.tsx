import { useEffect, useState } from "react";
import Breadcrumbs from "./Breadcrumbs";
import CreateFolderButton from "./CreateFolderButton";
import FileItem from "./FileItem";
import UploadButton from "./UploadButton";
import { useAuth } from "@clerk/clerk-react";

export default function FileBrowser({ theme }: {theme: string}) {
    type er = null | String;
    const [files, setFiles] = useState<typeof FileItem[]>([]);
    const [currentFolder, setCurrentFolder] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null as er);
    const { getToken } = useAuth();
  
    const fetchFiles = async (folderPath = '') => {
      try {
        setIsLoading(true);
        setError(null);
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/files?folderPath=${encodeURIComponent(folderPath)}`, {
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
            {files.map((item:any) => (
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