import { useModal } from '../hooks/useModal';
import { Settings, Save, Trash2, AlertCircle, Info } from 'lucide-react';

export default function ModalDemoPage() {
  const modal = useModal();

  const openSimpleModal = () => {
    modal.openModal({
      title: 'Simple Modal',
      content: (
        <div className="space-y-4">
          <p>This is a simple modal with just content and a title.</p>
          <p>Press ESC or click outside to close.</p>
        </div>
      ),
      size: 'md',
    });
  };

  const openModalWithIcon = () => {
    modal.openModal({
      title: 'Settings Modal',
      icon: <Settings className="w-6 h-6 text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter your email"
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => modal.closeModal()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('Settings saved!');
              modal.closeModal();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      ),
      size: 'md',
    });
  };

  const openLargeModal = () => {
    modal.openModal({
      title: 'Large Modal with Scrollable Content',
      icon: <Info className="w-6 h-6 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This modal demonstrates a fixed-height body with scrollable content.
          </p>
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Section {i + 1}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is content section {i + 1}. The body has a fixed height and scrolls
                automatically when content overflows.
              </p>
            </div>
          ))}
        </div>
      ),
      size: 'xl',
    });
  };

  const openDangerModal = () => {
    modal.openModal({
      title: 'Confirm Deletion',
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ Warning: This will permanently delete the selected items.
            </p>
          </div>
        </div>
      ),
      footer: (
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => modal.closeModal()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('Item deleted!');
              modal.closeModal();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      ),
      size: 'md',
    });
  };

  const openNoHeaderModal = () => {
    modal.openModal({
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Save className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Success!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your changes have been saved successfully.
          </p>
        </div>
      ),
      footer: (
        <div className="flex justify-center">
          <button
            onClick={() => modal.closeModal()}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            OK
          </button>
        </div>
      ),
      size: 'md',
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          Modal System Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Demonstrating the centralized modal system with various configurations
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={openSimpleModal}
            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
          >
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Simple Modal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Basic modal with title and content only (md size)
            </p>
          </button>

          <button
            onClick={openModalWithIcon}
            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
          >
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              With Icon & Footer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modal with header icon and custom footer buttons (md size)
            </p>
          </button>

          <button
            onClick={openLargeModal}
            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Large Modal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Extra large modal with scrollable content (xl size)
            </p>
          </button>

          <button
            onClick={openDangerModal}
            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-red-500 dark:hover:border-red-500 transition-colors group"
          >
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">
              Danger Modal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confirmation modal with warning styling (md size)
            </p>
          </button>

          <button
            onClick={openNoHeaderModal}
            className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-green-500 dark:hover:border-green-500 transition-colors group"
          >
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
              No Header
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modal without header, just content and footer (md size)
            </p>
          </button>
        </div>

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-200">
            Modal Features:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>✨ Consistent header with optional icon (left) and close button (right)</li>
            <li>✨ Fixed-height body with automatic scrolling for overflow content</li>
            <li>✨ Optional footer for custom buttons and actions</li>
            <li>✨ Three sizes: md (max-w-md), lg (max-w-2xl), xl (max-w-7xl)</li>
            <li>✨ Close on ESC key (configurable)</li>
            <li>✨ Close on overlay click (configurable)</li>
            <li>✨ Focus trap for keyboard navigation</li>
            <li>✨ Dark mode support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
