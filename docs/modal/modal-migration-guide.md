# Quick Reference: Converting Existing Modals

## Pattern 1: Simple State-Based Modal → useModal

### Before
```tsx
function MyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Open</button>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50">
          <div className="bg-white p-6 rounded">
            <h2>Title</h2>
            <p>Content</p>
            <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### After
```tsx
import { useModal } from '../hooks/useModal';

function MyPage() {
  const modal = useModal();
  
  return (
    <button onClick={() => modal.openModal({
      title: 'Title',
      content: <p>Content</p>,
      footer: (
        <button onClick={() => modal.closeModal()}>Close</button>
      )
    })}>
      Open
    </button>
  );
}
```

---

## Pattern 2: Complex Form Modal → useModal with Footer

### Before
```tsx
function MyPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({});
  
  const handleSave = () => {
    // save logic
    setIsOpen(false);
  };
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Edit</button>
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <input onChange={e => setFormData({...formData, name: e.target.value})} />
        <button onClick={handleSave}>Save</button>
        <button onClick={() => setIsOpen(false)}>Cancel</button>
      </CustomModal>
    </>
  );
}
```

### After
```tsx
import { useModal } from '../hooks/useModal';
import { Save } from 'lucide-react';

function MyPage() {
  const modal = useModal();
  const [formData, setFormData] = useState({});
  
  const handleEdit = () => {
    modal.openModal({
      title: 'Edit Item',
      icon: <Save className="w-6 h-6 text-indigo-500" />,
      content: (
        <input 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})} 
        />
      ),
      footer: (
        <div className="flex gap-3 justify-end">
          <button onClick={() => modal.closeModal()}>Cancel</button>
          <button onClick={() => { handleSave(); modal.closeModal(); }}>
            Save
          </button>
        </div>
      ),
      size: 'lg',
    });
  };
  
  return <button onClick={handleEdit}>Edit</button>;
}
```

---

## Pattern 3: Confirmation Dialog → useModal (or useConfirm)

### Before
```tsx
function MyPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDelete = () => {
    if (window.confirm('Delete this item?')) {
      deleteItem();
    }
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

### After (Option A: useConfirm - Recommended for simple confirmations)
```tsx
import { useConfirm } from '../hooks/useConfirm';

function MyPage() {
  const confirm = useConfirm();
  
  const handleDelete = async () => {
    if (await confirm({ message: 'Delete this item?' })) {
      deleteItem();
    }
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

### After (Option B: useModal - For complex confirmations with custom styling)
```tsx
import { useModal } from '../hooks/useModal';
import { AlertCircle, Trash2 } from 'lucide-react';

function MyPage() {
  const modal = useModal();
  
  const handleDelete = () => {
    modal.openModal({
      title: 'Confirm Deletion',
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      content: (
        <div>
          <p>Are you sure you want to delete this item?</p>
          <div className="p-4 bg-red-50 border border-red-200 rounded mt-3">
            <p className="text-sm text-red-800">⚠️ This action cannot be undone.</p>
          </div>
        </div>
      ),
      footer: (
        <div className="flex gap-3 justify-end">
          <button onClick={() => modal.closeModal()}>Cancel</button>
          <button 
            onClick={() => { 
              deleteItem(); 
              modal.closeModal(); 
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      ),
    });
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

---

## When to Use What

### Use `useModal` when:
- ✅ Need custom content layout
- ✅ Need custom header with icon
- ✅ Need complex forms
- ✅ Need custom footer with multiple buttons
- ✅ Want full control over styling
- ✅ Need scrollable long content

### Use `useConfirm` when:
- ✅ Simple yes/no questions
- ✅ Quick confirmations
- ✅ Don't need custom styling

### Use `useAlert` when:
- ✅ Show notifications
- ✅ Success/error messages
- ✅ Info messages with severity
- ✅ Auto-dismissing alerts

---

## Common Patterns

### 1. Form Modal with Validation
```tsx
const modal = useModal();

const openForm = () => {
  const [errors, setErrors] = useState({});
  
  modal.openModal({
    title: 'Create Profile',
    content: (
      <form className="space-y-4">
        <div>
          <label>Name</label>
          <input type="text" />
          {errors.name && <span className="text-red-500">{errors.name}</span>}
        </div>
      </form>
    ),
    footer: (
      <div className="flex gap-3 justify-end">
        <button onClick={() => modal.closeModal()}>Cancel</button>
        <button onClick={handleSubmit}>Create</button>
      </div>
    ),
    size: 'lg',
  });
};
```

### 2. Multi-Step Modal
```tsx
const modal = useModal();
const [step, setStep] = useState(1);

const openWizard = () => {
  modal.openModal({
    title: `Step ${step} of 3`,
    content: <div>{/* Step content */}</div>,
    footer: (
      <div className="flex justify-between w-full">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 1}>
          Back
        </button>
        <button onClick={() => {
          if (step === 3) {
            handleFinish();
            modal.closeModal();
          } else {
            setStep(s => s + 1);
          }
        }}>
          {step === 3 ? 'Finish' : 'Next'}
        </button>
      </div>
    ),
  });
};
```

### 3. Loading Modal
```tsx
const modal = useModal();
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  modal.openModal({
    title: 'Processing',
    content: <div className="text-center py-8">Loading...</div>,
    closeOnEscape: false,
    closeOnOverlay: false,
  });
  
  await performAction();
  
  setLoading(false);
  modal.closeModal();
};
```

---

## Size Guide

- **`md`** (max-w-md / 448px): Forms, alerts, simple dialogs
- **`lg`** (max-w-2xl / 672px): Complex forms, settings
- **`xl`** (max-w-7xl / 1280px): Full editors, dashboards, large content

---

## Tips

1. **Always close after actions**: Remember to call `modal.closeModal()` after save/submit
2. **Use consistent button order**: Cancel (left), Primary Action (right)
3. **Add icons for context**: Use lucide-react icons in headers
4. **Handle long content**: Body scrolls automatically
5. **Use appropriate size**: Don't use `xl` for simple forms
6. **Leverage footer**: Group related actions in the footer
7. **Add loading states**: Disable buttons during async operations
