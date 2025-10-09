# Modal System Documentation

## Overview

The centralized modal system provides a consistent way to display modals throughout the application. It uses a React Context provider and hook pattern for easy integration.

## Features

✨ **Consistent Design**
- Header with optional icon (left) and close button (right)
- Fixed-height scrollable body
- Optional footer for custom buttons

✨ **Flexible Sizing**
- `md`: max-width 448px (max-w-md)
- `lg`: max-width 672px (max-w-2xl)
- `xl`: max-width 1280px (max-w-7xl)

✨ **Accessibility**
- Close on ESC key (configurable)
- Close on overlay click (configurable)
- Focus trap for keyboard navigation
- ARIA labels for screen readers

✨ **Theming**
- Full dark mode support
- Consistent with app color scheme

## Installation

The modal system is already integrated into the app via `App.tsx`:

```tsx
import { ModalProvider } from './hooks/useModal';

function App() {
  return (
    <ModalProvider>
      {/* Your app content */}
    </ModalProvider>
  );
}
```

## Usage

### Basic Usage

```tsx
import { useModal } from '../hooks/useModal';

function MyComponent() {
  const modal = useModal();

  const openModal = () => {
    modal.openModal({
      title: 'Simple Modal',
      content: <div>Your content here</div>,
      size: 'md',
    });
  };

  return <button onClick={openModal}>Open Modal</button>;
}
```

### With Icon and Footer

```tsx
import { useModal } from '../hooks/useModal';
import { Settings, Save } from 'lucide-react';

function MyComponent() {
  const modal = useModal();

  const openSettingsModal = () => {
    modal.openModal({
      title: 'Settings',
      icon: <Settings className="w-6 h-6 text-primary-500" />,
      content: (
        <div className="space-y-4">
          <input type="text" placeholder="Name" className="w-full px-3 py-2 border rounded" />
          <input type="email" placeholder="Email" className="w-full px-3 py-2 border rounded" />
        </div>
      ),
      footer: (
        <div className="flex gap-3 justify-end">
          <button onClick={() => modal.closeModal()} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button 
            onClick={() => {
              // Save logic
              modal.closeModal();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      ),
      size: 'lg',
    });
  };

  return <button onClick={openSettingsModal}>Open Settings</button>;
}
```

### Large Scrollable Modal

```tsx
const modal = useModal();

modal.openModal({
  title: 'Terms and Conditions',
  content: (
    <div className="space-y-4">
      {/* Long content that will scroll */}
      <p>Lorem ipsum...</p>
      {/* More content */}
    </div>
  ),
  size: 'xl',
});
```

### Without Header

```tsx
const modal = useModal();

modal.openModal({
  content: (
    <div className="text-center">
      <h3 className="text-xl font-bold mb-4">Success!</h3>
      <p>Your operation completed successfully.</p>
    </div>
  ),
  footer: (
    <div className="flex justify-center">
      <button onClick={() => modal.closeModal()} className="px-6 py-2 bg-green-500 text-white rounded">
        OK
      </button>
    </div>
  ),
});
```

## API Reference

### `useModal()` Hook

Returns an object with:

- `openModal(options: ModalOptions)` - Opens a modal with the given options
- `closeModal()` - Closes the currently open modal
- `isOpen: boolean` - Whether a modal is currently open

### `ModalOptions` Interface

```typescript
interface ModalOptions {
  title?: string;              // Modal title (omit for no header)
  icon?: ReactNode;            // Icon to display in header (left side)
  content: ReactNode;          // Modal body content (required)
  footer?: ReactNode;          // Footer content (omit for no footer)
  size?: 'md' | 'lg' | 'xl';  // Modal size (default: 'md')
  closeOnEscape?: boolean;     // Close on ESC key (default: true)
  closeOnOverlay?: boolean;    // Close on overlay click (default: true)
}
```

## Component Structure

```
Modal
├── Overlay (backdrop with blur)
├── Container
    ├── Header (optional)
    │   ├── Icon (optional)
    │   ├── Title
    │   └── Close Button
    ├── Body (scrollable, fixed height)
    │   └── Content
    └── Footer (optional)
        └── Custom Footer Content
```

## Best Practices

### 1. Always Provide Meaningful Titles
```tsx
// ✅ Good
modal.openModal({ title: 'Delete Confirmation', ... });

// ❌ Avoid
modal.openModal({ title: 'Modal', ... });
```

### 2. Use Icons for Context
```tsx
import { AlertCircle, Trash2 } from 'lucide-react';

// ✅ Danger/Warning
modal.openModal({
  title: 'Delete Item',
  icon: <AlertCircle className="w-6 h-6 text-red-500" />,
  ...
});
```

### 3. Consistent Footer Buttons
```tsx
// ✅ Standard pattern: Cancel (left), Action (right)
footer: (
  <div className="flex gap-3 justify-end">
    <button onClick={() => modal.closeModal()}>Cancel</button>
    <button onClick={handleSave}>Save</button>
  </div>
)
```

### 4. Handle Long Content
```tsx
// ✅ Body will scroll automatically
content: (
  <div className="space-y-4">
    {longList.map(item => <div key={item.id}>{item.name}</div>)}
  </div>
)
```

### 5. Clean Up on Close
```tsx
const handleDelete = () => {
  // Perform action
  deleteItem();
  // Always close modal after action
  modal.closeModal();
};
```

## Styling Guidelines

### Use Consistent Classes

```tsx
// Input fields
<input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />

// Buttons (primary)
<button className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors" />

// Buttons (secondary)
<button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700" />

// Danger buttons
<button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" />
```

## Demo Page

Visit `/modal-demo` to see all modal variations in action.

## Migration Guide

### Converting Existing Modals

Before (custom modal component):
```tsx
const [isOpen, setIsOpen] = useState(false);

return (
  <>
    <button onClick={() => setIsOpen(true)}>Open</button>
    {isOpen && (
      <CustomModal onClose={() => setIsOpen(false)}>
        Content here
      </CustomModal>
    )}
  </>
);
```

After (using useModal):
```tsx
const modal = useModal();

return (
  <button onClick={() => modal.openModal({
    title: 'Modal Title',
    content: <div>Content here</div>,
  })}>
    Open
  </button>
);
```

## Troubleshooting

### Modal Not Opening
- Ensure `ModalProvider` is wrapped around your app in `App.tsx`
- Check console for warnings about using `useModal` outside provider

### Content Not Scrolling
- The body has a fixed height with `overflow-y-auto`
- Ensure your content doesn't have `overflow: hidden`

### Close Button Not Working
- Verify `onClose` prop or `modal.closeModal()` is called
- Check if `closeOnEscape` or `closeOnOverlay` is set to `false`

## Files Reference

- `src/renderer/components/common/Modal.tsx` - Base modal component
- `src/renderer/hooks/useModal.tsx` - Modal provider and hook
- `src/renderer/pages/ModalDemoPage.tsx` - Demo page with examples
- `src/renderer/hooks/useModal.examples.tsx` - Usage examples
