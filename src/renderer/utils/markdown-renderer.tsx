import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Markdown renderer utility that matches ChatGPT/Gemini style
 * Separates rendering logic from component logic
 */

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;
  // Preprocess common artifacts from provider streams
  const preprocess = (src: string) => {
    let s = src.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // remove HTML comments like <!-- end list -->
    s = s.replace(/<!--([\s\S]*?)-->/g, "");
    // remove common markers that providers sometimes inject
    s = s.replace(/\n\s*\-\-\-+\s*\n/g, "\n");
    // collapse multiple blank lines to one
    s = s.replace(/\n{3,}/g, "\n\n");
    // trim
    return s.trim();
  };

  const cleaned = preprocess(content);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom code block component with syntax highlighting
          code(props: any) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;

            if (isInline) {
              // Inline code
              return (
                <code
                  className="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            // Code block with syntax highlighting
            return (
              <div className="mb-2">
                <SyntaxHighlighter
                  {...rest}
                  PreTag="div"
                  language={match ? match[1] : 'text'}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: '0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    padding: '0.75rem',
                    background: undefined,
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    }
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },
          
          // Style headings
          h1: ({ children }: any) => (
            <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-lg font-semibold mb-2 mt-2">{children}</h3>
          ),
          h4: ({ children }: any) => (
            <h4 className="text-base font-semibold mb-1 mt-2">{children}</h4>
          ),
          
          // Style paragraphs
          p: ({ children }: any) => (
            <p className="mb-3 leading-relaxed">{children}</p>
          ),
          
          // Style lists
          ul: ({ children }: any) => (
            <ul className="list-disc ml-6 mb-3 space-y-1">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal ml-6 mb-3 space-y-1">{children}</ol>
          ),
          li: ({ children }: any) => (
            <li className="leading-relaxed">{children}</li>
          ),
          
          // Style blockquotes
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic my-3 text-gray-300">
              {children}
            </blockquote>
          ),
          
          // Style links
          a: ({ href, children }: any) => (
            <a
              href={href}
              onClick={(e) => {
                e.preventDefault();
                if (href) window.open(href, '_blank');
              }}
              className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              {children}
            </a>
          ),
          
          // Style tables
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border border-gray-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }: any) => (
            <thead className="bg-gray-800">{children}</thead>
          ),
          tbody: ({ children }: any) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }: any) => (
            <tr className="border-b border-gray-700">{children}</tr>
          ),
          th: ({ children }: any) => (
            <th className="px-4 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }: any) => (
            <td className="px-4 py-2">{children}</td>
          ),
          
          // Style horizontal rules
          hr: () => (
            <hr className="my-4 border-gray-700" />
          ),
          
          // Style emphasis
          strong: ({ children }: any) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }: any) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
