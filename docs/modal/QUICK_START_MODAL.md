# Quick Start Guide - Using the Modal System

## 🚀 How to Use the Modal System (3 Simple Steps)

### Step 1: Import the Hook
```tsx
import { useModal } from '../hooks/useModal';
```

### Step 2: Get the Modal Instance
```tsx
function MyComponent() {
  const modal = useModal();
  // ...
}
```

### Step 3: Open a Modal
```tsx
modal.openModal({
  title: 'My Modal',
  content: <div>Content here</div>,
  size: 'md',
});
```

---

## 📖 Common Patterns

### Pattern 1: Simple Information Modal
```tsx
import { useModal } from '../hooks/useModal';
import { Info } from 'lucide-react';

function MyComponent() {
  const modal = useModal();

  const showInfo = () => {
    modal.openModal({
      title: 'Information',
      icon: <Info className="w-6 h-6 text-blue-500" />,
      content: (
        <div>
          <p>This is some important information.</p>
        </div>
      ),
      size: 'md',
    });
  };

  return <button onClick={showInfo}>Show Info</button>;
}
```

### Pattern 2: Form Modal with Save/Cancel
```tsx
import { useModal } from '../hooks/useModal';
import { Edit, Save } from 'lucide-react';
import { useState } from 'react';

function MyComponent() {
  const modal = useModal();

  const showEditForm = () => {
    modal.openModal({
      title: 'Edit Item',
      icon: <Edit className="w-6 h-6 text-indigo-500" />,
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
              console.log('Saving...');
              modal.closeModal();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      ),
      size: 'lg',
    });
  };

  return <button onClick={showEditForm}>Edit</button>;
}
```

### Pattern 3: Danger/Delete Confirmation
```tsx
import { useModal } from '../hooks/useModal';
import { AlertTriangle, Trash2 } from 'lucide-react';

function MyComponent() {
  const modal = useModal();

  const confirmDelete = () => {
    modal.openModal({
      title: 'Confirm Deletion',
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      content: (
        <div>
          <p className="mb-3">Are you sure you want to delete this item?</p>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ This action cannot be undone.
            </p>
          </div>
        </div>
      ),
      footer: (
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => modal.closeModal()}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Delete logic
              console.log('Deleting...');
              modal.closeModal();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      ),
      size: 'md',
    });
  };

  return <button onClick={confirmDelete}>Delete</button>;
}
```

### Pattern 4: Large Scrollable Content
```tsx
import { useModal } from '../hooks/useModal';
import { FileText } from 'lucide-react';

function MyComponent() {
  const modal = useModal();

  const showTerms = () => {
    modal.openModal({
      title: 'Terms and Conditions',
      icon: <FileText className="w-6 h-6 text-slate-500" />,
      content: (
        <div className="space-y-4">
          <p>Long content that will scroll...</p>
          {/* Add lots of content here */}
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i}>Section {i + 1}: Lorem ipsum dolor sit amet...</p>
          ))}
        </div>
      ),
      footer: (
        <button
          onClick={() => modal.closeModal()}
          className="w-full px-4 py-2 bg-indigo-500 text-white rounded"
        >
          I Agree
        </button>
      ),
      size: 'xl',
    });
  };

  return <button onClick={showTerms}>View Terms</button>;
}
```

---

## 🎨 Size Guide

| Size | Width | Use Case | Example |
|------|-------|----------|---------|
| `md` | 448px | Simple forms, alerts | Settings (now!), confirmations |
| `lg` | 672px | Complex forms | Multi-field forms, settings with sections |
| `xl` | 1280px | Large content, editors | Terms, dashboards, rich editors |

---

## 💡 Pro Tips

### 1. Extract Complex Content
```tsx
// ✅ Good: Separate component
function SettingsForm() {
  return <div>...</div>;
}

modal.openModal({
  content: <SettingsForm />,
});

// ❌ Avoid: Inline complex JSX
modal.openModal({
  content: (
    <div>
      {/* 100+ lines of JSX */}
    </div>
  ),
});
```

### 2. Use Icons for Context
```tsx
import { Settings, Trash2, AlertCircle, Info, CheckCircle } from 'lucide-react';

// Info modal
icon: <Info className="w-6 h-6 text-blue-500" />

// Success modal
icon: <CheckCircle className="w-6 h-6 text-green-500" />

// Warning/Danger modal
icon: <AlertCircle className="w-6 h-6 text-red-500" />

// Settings modal
icon: <Settings className="w-6 h-6 text-indigo-500" />
```

### 3. Consistent Footer Button Order
```tsx
// ✅ Standard: Cancel (left), Primary Action (right)
<div className="flex gap-3 justify-end">
  <button onClick={cancel}>Cancel</button>
  <button onClick={save}>Save</button>
</div>
```

### 4. Handle Async Operations
```tsx
const handleSave = async () => {
  try {
    setLoading(true);
    await saveData();
    modal.closeModal();
    // Show success alert
  } catch (error) {
    // Show error alert
  } finally {
    setLoading(false);
  }
};
```

---

## 🔧 API Reference

### `modal.openModal(options)`

```typescript
interface ModalOptions {
  title?: string;              // Modal title (optional)
  icon?: ReactNode;            // Icon next to title (optional)
  content: ReactNode;          // Modal body content (required)
  footer?: ReactNode;          // Footer content (optional)
  size?: 'md' | 'lg' | 'xl';  // Modal size (default: 'md')
  closeOnEscape?: boolean;     // Close on ESC (default: true)
  closeOnOverlay?: boolean;    // Close on overlay click (default: true)
}
```

### `modal.closeModal()`
Closes the currently open modal.

### `modal.isOpen`
Boolean indicating if a modal is currently open.

---

## 🎯 Real World Example: Settings Modal

**File: `App.tsx`**
```tsx
import { useModal } from './hooks/useModal';
import { Settings } from 'lucide-react';
import SettingsForm from './components/SettingsForm';

function AppContent() {
  const modal = useModal();

  const handleSettingsClick = () => {
    modal.openModal({
      title: 'Settings',
      icon: <Settings className="w-6 h-6 text-indigo-500" />,
      content: <SettingsForm />,
      footer: (
        <button
          onClick={() => modal.closeModal()}
          className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
        >
          Done
        </button>
      ),
      size: 'lg',
    });
  };

  return (
    <Sidebar onSettingsClick={handleSettingsClick} />
  );
}
```

**File: `SettingsForm.tsx`**
```tsx
import { useSettingsStore } from '../store/settings.store';

export default function SettingsForm() {
  const { theme, setTheme } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Theme selection */}
      <div>
        <label>Theme</label>
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
      </div>
      {/* More settings... */}
    </div>
  );
}
```

---

## 🧪 Testing Your Modal

```tsx
// 1. Test opening
const openButton = screen.getByText('Open Modal');
fireEvent.click(openButton);

// 2. Test content is visible
expect(screen.getByText('My Modal')).toBeInTheDocument();

// 3. Test closing with button
const closeButton = screen.getByLabelText('Close');
fireEvent.click(closeButton);

// 4. Test closing with ESC
fireEvent.keyDown(window, { key: 'Escape' });

// 5. Test closing with overlay
const overlay = screen.getByRole('button', { hidden: true });
fireEvent.click(overlay);
```

---

## 📚 More Examples

Visit `/modal-demo` in your app to see:
- Simple modal
- Modal with icon & footer
- Large scrollable modal
- Danger/warning modal
- Modal without header

---

## 🆘 Troubleshooting

### Modal doesn't open
- ✅ Check that `ModalProvider` is in `App.tsx`
- ✅ Check that you're calling `modal.openModal()` correctly
- ✅ Check console for errors

### Content not scrolling
- ✅ Modal body has fixed height with `overflow-y-auto`
- ✅ Ensure your content doesn't have `overflow: hidden`

### ESC key not working
- ✅ Check `closeOnEscape` is not set to `false`
- ✅ Make sure no other component is capturing the ESC key

---

**Quick Links:**
- Full Docs: `docs/modal-system.md`
- Demo: Visit `/modal-demo`
- Examples: `src/renderer/hooks/useModal.examples.tsx`
