# Markdown Rendering Implementation - Like ChatGPT & Gemini

## 📋 Overview
Triển khai hệ thống render markdown chuẩn như ChatGPT và Gemini, tách biệt logic rendering khỏi component UI.

## 🎯 Giải pháp

### 1. Backend - Format Helper (Simplified)
**File**: `src/services/chat-automation/helpers/format.helper.ts`

```typescript
export function formatAsMarkdown(content: string): string {
  // Chỉ chuẩn hóa line endings và trim
  // KHÔNG escape HTML hay modify markdown syntax
  // Để frontend markdown renderer xử lý
  if (!content) return "";
  let out = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return out.trim();
}
```

**Lý do**: Backend chỉ cần trả về clean markdown, frontend sẽ xử lý rendering.

### 2. Frontend - Markdown Renderer Utility
**File**: `src/renderer/utils/markdown-renderer.tsx`

Sử dụng các thư viện chuẩn:
- **react-markdown**: Parser và renderer chính (15k+ stars, used by 439k projects)
- **remark-gfm**: GitHub Flavored Markdown (tables, strikethrough, tasklists, etc.)
- **rehype-raw**: Hỗ trợ HTML trong markdown
- **react-syntax-highlighter**: Syntax highlighting cho code blocks (như ChatGPT/Gemini)

#### Tính năng hỗ trợ:

✅ **Code Blocks với Syntax Highlighting**
```python
def hello():
    print("Hello World")
```

✅ **Inline Code**: `code here`

✅ **Lists**:
- Unordered lists
1. Ordered lists
- [x] Task lists (GFM)

✅ **Headings**: H1 - H6 với styling

✅ **Bold & Italic**: **bold** *italic*

✅ **Links**: Clickable với window.open

✅ **Tables** (GFM):
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

✅ **Blockquotes**: 
> Quoted text

✅ **Horizontal Rules**: ---

### 3. Component Integration
**File**: `src/renderer/components/automation/ChatUI.tsx`

```tsx
import { MarkdownRenderer } from "../../utils/markdown-renderer";

// Trong message rendering
{m.from === "bot" ? (
  <MarkdownRenderer content={m.text} />
) : (
  m.text
)}
```

**Tách biệt logic**:
- ✅ Rendering logic ở `markdown-renderer.tsx`
- ✅ Component logic ở `ChatUI.tsx`
- ✅ Dễ maintain, test, và reuse

## 📦 Dependencies Installed

```json
{
  "react-markdown": "^8.0.7",      // Core renderer
  "remark-gfm": "^3.0.1",          // GitHub Flavored Markdown
  "rehype-raw": "^7.0.0",          // HTML support
  "react-syntax-highlighter": "^15.5.0",  // Code highlighting
  "@types/react-syntax-highlighter": "^15.5.11"
}
```

## 🎨 Styling

Sử dụng Tailwind CSS để styling giống ChatGPT/Gemini:

- **Code blocks**: Dark theme với syntax highlighting (vscDarkPlus theme)
- **Inline code**: Gray background với monospace font
- **Lists**: Proper spacing và indentation
- **Tables**: Bordered với header styling
- **Links**: Blue color với hover effects
- **Headings**: Bold với proper sizing (2xl, xl, lg, base)
- **Blockquotes**: Left border với italic text

## 🔄 Data Flow

```
Gemini/ChatGPT Response
      ↓
CDP Adapter (chatgpt.cdp.ts / gemini.cdp.ts)
      ↓
[Clean Markdown String]
      ↓
IPC to Renderer
      ↓
ChatUI Component
      ↓
MarkdownRenderer Utility
      ↓
react-markdown + plugins
      ↓
Styled HTML Elements
```

## ✨ Advantages

1. **Chuẩn như ChatGPT/Gemini**: Sử dụng thư viện được ChatGPT/Gemini sử dụng
2. **Syntax Highlighting**: Code blocks có màu sắc như IDE
3. **GFM Support**: Tables, task lists, strikethrough, etc.
4. **Separation of Concerns**: Logic tách biệt khỏi component
5. **Type Safe**: TypeScript với proper types
6. **Maintainable**: Dễ update, test, và reuse
7. **Performant**: React-markdown builds virtual DOM, chỉ update những gì thay đổi

## 🧪 Testing

Test với các markdown features:

```markdown
# Heading 1
## Heading 2

**Bold text** and *italic text*

- List item 1
- List item 2

1. Numbered item
2. Another item

`inline code`

\```python
def hello():
    print("Hello World")
\```

[Link](https://example.com)

> Blockquote

| Col 1 | Col 2 |
|-------|-------|
| A     | B     |
```

## 📝 Notes

- Backend không cần format phức tạp, chỉ return clean markdown
- Frontend handle tất cả rendering logic
- Sử dụng libraries battle-tested, không reinvent the wheel
- Styling có thể customize trong `markdown-renderer.tsx`

## 🚀 Next Steps (Optional)

1. Add custom syntax highlighting themes
2. Support for math equations (KaTeX/MathJax)
3. Support for diagrams (Mermaid)
4. Add copy button for code blocks
5. Support for footnotes
