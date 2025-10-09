// Example usage of the useModal hook
// Import in your component:
// import { useModal } from '../hooks/useModal';
// import { Settings, Save } from 'lucide-react';

/*
Example 1: Simple modal
const modal = useModal();
modal.openModal({
  title: 'Simple Modal',
  content: <div>This is a simple modal content</div>,
  size: 'md',
});

Example 2: Modal with icon and footer
const modal = useModal();
modal.openModal({
  title: 'Settings',
  icon: <Settings className="w-6 h-6 text-primary-500" />,
  content: (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <input type="text" className="w-full px-3 py-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input type="email" className="w-full px-3 py-2 border rounded" />
      </div>
    </div>
  ),
  footer: (
    <div className="flex gap-3 justify-end">
      <button 
        onClick={() => modal.closeModal()}
        className="px-4 py-2 border rounded hover:bg-gray-50"
      >
        Cancel
      </button>
      <button 
        onClick={() => {
          // Save logic here
          modal.closeModal();
        }}
        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
      >
        <Save className="w-4 h-4" />
        Save Changes
      </button>
    </div>
  ),
  size: 'lg',
});

Example 3: Large modal with custom behavior
const modal = useModal();
modal.openModal({
  title: 'Large Content',
  content: (
    <div>
      <p>This modal has a fixed height body that scrolls.</p>
      {Array.from({ length: 50 }, (_, i) => (
        <p key={i}>Line {i + 1}</p>
      ))}
    </div>
  ),
  size: 'xl',
  closeOnEscape: true,
  closeOnOverlay: true,
});

Example 4: No header modal
const modal = useModal();
modal.openModal({
  content: <div>Modal without header</div>,
  footer: (
    <button onClick={() => modal.closeModal()}>Close</button>
  ),
  size: 'md',
});
*/

export {};
