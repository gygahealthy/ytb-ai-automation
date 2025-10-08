// React import not required when using the new JSX transform
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PreviewMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Separate markdown renderer for Prompt preview UI.
 * Kept isolated so it doesn't affect chat rendering behavior.
 */
export function PreviewMarkdownRenderer({ content, className = '' }: PreviewMarkdownRendererProps) {
  if (!content) return null;

  const preprocess = (src: string) => {
    let s = src.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    s = s.replace(/<!--([\s\S]*?)-->/g, "");
    // Keep horizontal rules (---) as they are important for structure
    // s = s.replace(/\n\s*\-\-\-+\s*\n/g, "\n");
    s = s.replace(/\n{3,}/g, "\n\n");
    // Mask fenced code blocks and inline code so we don't inject HTML into them
    const fences: string[] = [];
    s = s.replace(/```[\s\S]*?```/g, (m) => {
      const idx = fences.push(m) - 1;
      return `__FENCE_${idx}__`;
    });
    const inlines: string[] = [];
    s = s.replace(/`([^`]*)`/g, (m) => {
      const idx = inlines.push(m) - 1;
      return `__INLINE_${idx}__`;
    });

    // Render bracketed variables like [VAR_NAME] as badge-like chips for clearer preview
    // We inject a small HTML span which will be rendered because rehypeRaw is enabled.
    s = s.replace(/\[([A-Z0-9_]+)\]/g, (_m, p1) => {
      return `<span class="inline-var px-2 py-0.5 rounded-md bg-slate-900 text-emerald-300 text-sm font-mono">[${p1}]</span>`;
    });

    // Restore inline code and fences
    s = s.replace(/__INLINE_(\d+)__/g, (_m, idx) => inlines[Number(idx)] || '');
    s = s.replace(/__FENCE_(\d+)__/g, (_m, idx) => fences[Number(idx)] || '');
    return s.trim();
  };

  const cleaned = preprocess(content);

  return (
    <div className={`markdown-preview prose prose-slate dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code(props: any) {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code className="bg-slate-900 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono" {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <div className="mb-4">
                <SyntaxHighlighter
                  PreTag="div"
                  language={match ? match[1] : 'text'}
                  style={vscDarkPlus}
                  customStyle={{ margin: '0', borderRadius: '0.5rem', fontSize: '0.875rem', padding: '0.75rem' }}
                  codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' } }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },

          h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 mt-6 text-slate-900 dark:text-white">{children}</h1>,
          h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 mt-5 text-slate-900 dark:text-white">{children}</h2>,
          h3: ({ children }: any) => <h3 className="text-lg font-semibold mb-2 mt-4 text-slate-900 dark:text-white">{children}</h3>,
          h4: ({ children }: any) => <h4 className="text-base font-semibold mb-2 mt-3 text-slate-900 dark:text-white">{children}</h4>,

          p: ({ children }: any) => <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{children}</p>,
          ul: ({ children }: any) => <ul className="list-disc ml-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">{children}</ul>,
          ol: ({ children }: any) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">{children}</ol>,
          li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,

          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-slate-400 dark:border-slate-600 pl-4 italic my-4 text-slate-600 dark:text-slate-400">{children}</blockquote>
          ),

          a: ({ href, children }: any) => (
            <a
              href={href}
              onClick={(e) => {
                e.preventDefault();
                if (href) window.open(href, '_blank');
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline cursor-pointer"
            >
              {children}
            </a>
          ),

          table: ({ children }: any) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700">{children}</table>
            </div>
          ),
          thead: ({ children }: any) => <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>,
          tbody: ({ children }: any) => <tbody>{children}</tbody>,
          tr: ({ children }: any) => <tr className="border-b border-slate-200 dark:border-slate-700">{children}</tr>,
          th: ({ children }: any) => <th className="px-4 py-2 text-left font-semibold text-slate-900 dark:text-white">{children}</th>,
          td: ({ children }: any) => <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{children}</td>,

          hr: () => <hr className="my-6 border-t-2 border-slate-300 dark:border-slate-700" />,
          strong: ({ children }: any) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
          em: ({ children }: any) => <em className="italic">{children}</em>,
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

export default PreviewMarkdownRenderer;
