import { DefaultEditor } from 'react-simple-wysiwyg';

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  disabled?: boolean;
}

/**
 * Lightweight WYSIWYG editor that stores/returns plain HTML.
 * Wraps react-simple-wysiwyg with MUI-compatible visual style.
 * Ensures proper formatting for bold, italic, underline, lists, headings, etc.
 */
export default function RichTextEditor({ value, onChange, minHeight = 180, disabled = false }: Props) {
  const handleChange = (e: any) => {
    // Ensure proper HTML structure with paragraph tags
    let html = e.target.value;
    
    // Clean up any empty or unnecessary tags
    html = html.replace(/<p><\/p>/g, '').replace(/<p>&nbsp;<\/p>/g, '');
    
    onChange(html);
  };

  return (
    <div
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 12,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : undefined,
      }}
    >
      <style>{`
        .rsw-ce { 
          min-height: ${minHeight}px; 
          padding: 12px 14px; 
          font-size: 0.95rem; 
          font-family: inherit; 
          outline: none;
          line-height: 1.6;
        }
        .rsw-ce:focus { 
          background: #fafcff; 
        }
        .rsw-toolbar { 
          background: #f8fafc; 
          border-bottom: 1px solid #e2e8f0; 
          padding: 4px 6px; 
          display: flex; 
          flex-wrap: wrap; 
          gap: 2px; 
        }
        .rsw-btn { 
          border: none; 
          background: transparent; 
          border-radius: 6px; 
          padding: 4px 7px; 
          cursor: pointer; 
          font-size: 0.82rem; 
          color: #475569; 
          transition: background 0.15s; 
        }
        .rsw-btn:hover { 
          background: #e2e8f0; 
          color: #1e293b; 
        }
        .rsw-btn[data-active="true"] { 
          background: #dbeafe; 
          color: #1d4ed8; 
        }
        .rsw-separator { 
          width: 1px; 
          background: #e2e8f0; 
          margin: 2px 4px; 
          align-self: stretch; 
        }
        /* Ensure proper formatting for all text elements */
        .rsw-ce p { 
          margin: 0 0 12px 0;
          padding: 0;
        }
        .rsw-ce p:last-child {
          margin-bottom: 0;
        }
        .rsw-ce h1,
        .rsw-ce h2,
        .rsw-ce h3,
        .rsw-ce h4,
        .rsw-ce h5,
        .rsw-ce h6 {
          margin: 16px 0 12px 0;
          font-weight: 700;
          line-height: 1.3;
        }
        .rsw-ce h1 { font-size: 1.875rem; }
        .rsw-ce h2 { font-size: 1.5rem; }
        .rsw-ce h3 { font-size: 1.25rem; }
        .rsw-ce h4 { font-size: 1.1rem; }
        .rsw-ce h5 { font-size: 1rem; }
        .rsw-ce h6 { font-size: 0.9rem; }
        .rsw-ce strong,
        .rsw-ce b {
          font-weight: 700;
        }
        .rsw-ce em,
        .rsw-ce i {
          font-style: italic;
        }
        .rsw-ce u {
          text-decoration: underline;
        }
        .rsw-ce ul, 
        .rsw-ce ol { 
          padding-left: 24px; 
          margin: 0 0 12px 0;
        }
        .rsw-ce li { 
          margin: 4px 0;
          line-height: 1.6;
        }
        .rsw-ce a { 
          color: #2563eb; 
          text-decoration: underline;
          cursor: pointer;
        }
        .rsw-ce a:hover {
          color: #1d4ed8;
        }
        .rsw-ce blockquote {
          border-left: 4px solid #2563eb;
          margin: 12px 0;
          padding-left: 12px;
          font-style: italic;
          color: #64748b;
        }
        .rsw-ce hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 12px 0;
        }
        .rsw-ce code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .rsw-ce pre {
          background: #f1f5f9;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
        }
      `}</style>
      <DefaultEditor
        value={value || ''}
        onChange={handleChange}
      />
    </div>
  );
}
