# Modal System Architecture

## Component Hierarchy

```
App.tsx
└── ModalProvider (Context Provider)
    └── AlertProvider
        └── ConfirmProvider
            └── BrowserRouter
                └── Your App Components
                    └── useModal() hook available here

Modal Component Tree (when open):
└── Overlay (backdrop)
└── Container
    ├── Header (optional)
    │   ├── Icon (optional, left)
    │   ├── Title (left)
    │   └── Close Button (right)
    ├── Body (scrollable, flex-1)
    │   └── Content (ReactNode)
    └── Footer (optional)
        └── Custom Footer Content (ReactNode)
```

## Data Flow

```
Component
    ↓ calls
useModal()
    ↓ provides
{ openModal(), closeModal(), isOpen }
    ↓ updates
ModalContext
    ↓ controls
Modal Component
    ↓ renders
User's Content
```

## State Management

```
ModalProvider
├── isOpen: boolean
├── modalOptions: {
│   ├── title?: string
│   ├── icon?: ReactNode
│   ├── content: ReactNode (required)
│   ├── footer?: ReactNode
│   ├── size?: 'md' | 'lg' | 'xl'
│   ├── closeOnEscape?: boolean
│   └── closeOnOverlay?: boolean
│   }
└── Methods:
    ├── openModal(options)
    └── closeModal()
```

## File Structure

```
src/renderer/
├── components/
│   └── common/
│       ├── Modal.tsx ..................... Base modal UI component
│       ├── AppAlert.tsx .................. Alert modal (existing)
│       └── ConfirmModal.tsx .............. Confirm modal (existing)
├── hooks/
│   ├── useModal.tsx ...................... Provider + hook
│   ├── useModal.examples.tsx ............ Usage examples
│   ├── useAlert.tsx ...................... Alert hook (existing)
│   └── useConfirm.tsx .................... Confirm hook (existing)
├── pages/
│   └── ModalDemoPage.tsx ................. Interactive demo
└── App.tsx ............................... Root with providers

docs/
├── modal-system.md ....................... Full documentation
├── modal-system-summary.md ............... Quick summary
├── modal-migration-guide.md .............. Conversion patterns
└── modal-checklist.md .................... Implementation checklist
```

## Usage Patterns

### Pattern 1: Simple Modal
```
Component → useModal() → openModal({ content }) → Modal renders
```

### Pattern 2: Modal with Footer
```
Component → useModal() → openModal({ content, footer }) → Modal with buttons
```

### Pattern 3: Close Modal
```
Button → closeModal() → Modal unmounts → cleanup
```

## Integration Points

### Existing Systems
```
Modal System (new)
├── Complements: useAlert() - for notifications
├── Complements: useConfirm() - for confirmations
└── Replaces: Custom modal components (optional migration)
```

### Provider Stack
```
App
└── ModalProvider (outermost - can be used by Alert/Confirm)
    └── AlertProvider
        └── ConfirmProvider
            └── BrowserRouter
                └── Routes
```

## Size Specifications

| Size | Max Width | Tailwind Class | Best For |
|------|-----------|----------------|----------|
| `md` | 448px | `max-w-md` | Simple forms, alerts, dialogs |
| `lg` | 672px | `max-w-2xl` | Complex forms, settings |
| `xl` | 1280px | `max-w-7xl` | Editors, dashboards, large content |

## Styling System

```css
Modal Container:
├── Fixed positioning (fixed inset-0 z-50)
├── Backdrop (bg-black/50 backdrop-blur-sm)
└── Content (bg-white dark:bg-slate-900)
    ├── Border (border-slate-200 dark:border-slate-700)
    ├── Rounded (rounded-2xl)
    ├── Shadow (shadow-2xl)
    └── Max height (max-h-[90vh])

Header:
├── Background gradient (from-indigo-50 to-purple-50)
├── Border bottom (border-slate-200 dark:border-slate-700)
└── Padding (px-6 py-4)

Body:
├── Flex-1 (takes remaining space)
├── Overflow-y-auto (scrolls when needed)
├── Padding (p-6)
└── Min-h-0 (allows flex shrinking)

Footer:
├── Border top (border-slate-200 dark:border-slate-700)
├── Background (bg-slate-50 dark:bg-slate-800/50)
└── Padding (px-6 py-4)
```

## Event Handling

```
User Actions:
├── ESC key → closeModal() [if closeOnEscape=true]
├── Overlay click → closeModal() [if closeOnOverlay=true]
├── Close button → closeModal()
└── Custom footer button → custom handler + closeModal()

Keyboard Navigation:
├── Tab → Move to next focusable element
├── Shift+Tab → Move to previous focusable element
└── Focus Trap → Keeps focus within modal
```

## TypeScript Types

```typescript
type ModalSize = 'md' | 'lg' | 'xl';

interface ModalOptions {
  title?: string;
  icon?: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnOverlay?: boolean;
}

interface ModalContextValue {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
  isOpen: boolean;
}
```

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Supports backdrop-filter (blur)
- ✅ Flexbox layout
- ✅ CSS Grid (not used)
- ✅ Dark mode (prefers-color-scheme)

## Performance Considerations

- Modal content is lazy-rendered (only when open)
- State cleanup on close (300ms delay for animation)
- Focus trap uses event delegation
- No unnecessary re-renders (context optimization)

## Accessibility (a11y)

```
Features:
├── Keyboard Navigation (Tab, Shift+Tab, ESC)
├── Focus Trap (focus stays within modal)
├── ARIA Labels (aria-label on close button)
├── Screen Reader Support (semantic HTML)
└── Focus Management (auto-focus first element)
```

## Demo Routes

- `/modal-demo` - Interactive demonstrations of all modal types
  - Simple modal (md)
  - With icon & footer (md)
  - Large scrollable (xl)
  - Danger/warning (md)
  - No header (md)

---

**Last Updated**: 2025-10-09  
**Version**: 1.0.0  
**Status**: Production Ready ✅
