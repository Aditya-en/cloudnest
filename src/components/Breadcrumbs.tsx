import { FolderIcon } from "@heroicons/react/24/outline";

export default function Breadcrumbs({ currentFolder, setCurrentFolder, theme }: { currentFolder: string, setCurrentFolder: (path: string) => void, theme: string }) {
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
  