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
 */
export default function RichTextEditor({ value, onChange, minHeight = 180, disabled = false }: Props) {
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
        .rsw-ce { min-height: ${minHeight}px; padding: 12px 14px; font-size: 0.95rem; font-family: inherit; outline: none; }
        .rsw-ce:focus { background: #fafcff; }
        .rsw-toolbar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 4px 6px; display: flex; flex-wrap: wrap; gap: 2px; }
        .rsw-btn { border: none; background: transparent; border-radius: 6px; padding: 4px 7px; cursor: pointer; font-size: 0.82rem; color: #475569; transition: background 0.15s; }
        .rsw-btn:hover { background: #e2e8f0; color: #1e293b; }
        .rsw-btn[data-active="true"] { background: #dbeafe; color: #1d4ed8; }
        .rsw-separator { width: 1px; background: #e2e8f0; margin: 2px 4px; align-self: stretch; }
        .rsw-ce p { margin: 0 0 8px; }
        .rsw-ce ul, .rsw-ce ol { padding-left: 20px; margin: 0 0 8px; }
        .rsw-ce a { color: #2563eb; text-decoration: underline; }
      `}</style>
      <DefaultEditor
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
