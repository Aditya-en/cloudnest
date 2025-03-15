import { useAuth } from "@clerk/clerk-react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";

export default function UploadButton({ theme, currentFolder, onUploadComplete }: {theme: string, currentFolder: string, onUploadComplete: () => void}) { // ADDED currentFolder and onUploadComplete PROPS
    const [isOpen, setIsOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const { getToken } = useAuth();
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  
    const handleUpload = async (file: File) => {
      try {
        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);
  
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            folderPath: currentFolder // USING currentFolder PROP HERE
          })
        });
  
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
  
        const data = await response.json();
        const { url, key: _key  } = data;
  
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
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              onUploadComplete(); // CALL onUploadComplete HERE to refresh file list
            }, 1000);
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
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
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
  