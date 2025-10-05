declare module 'react-markdown' {
  import * as React from 'react';
  const ReactMarkdown: React.FC<any>;
  export default ReactMarkdown;
}

declare module 'remark-gfm' {
  const plugin: any;
  export default plugin;
}
