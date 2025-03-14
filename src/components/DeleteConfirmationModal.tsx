interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    theme: string;
  }

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName, theme }: DeleteConfirmationModalProps) {
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
  