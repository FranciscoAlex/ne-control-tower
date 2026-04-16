import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Renders markdown content with proper formatting for Control Tower display.
 * Supports headings, bold, italic, lists, blockquotes, code, tables, etc.
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <Box
      sx={{
        color: '#334155',
        fontSize: '1rem',
        lineHeight: 1.8,
        /* Paragraphs */
        '& p': { mb: 2.5, textAlign: 'justify' },
        /* Headings */
        '& h1': { mt: 3, mb: 2.5, color: '#0f172a', fontWeight: 900, fontSize: '1.5rem', lineHeight: 1.3 },
        '& h2': { mt: 3, mb: 2, color: '#0f172a', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.3 },
        '& h3': { mt: 2.5, mb: 1.5, color: '#1e293b', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3 },
        '& h4': { mt: 2, mb: 1.5, color: '#1e293b', fontWeight: 700, fontSize: '1rem' },
        '& h5': { mt: 1.5, mb: 1, color: '#334155', fontWeight: 700, fontSize: '0.95rem' },
        '& h6': { mt: 1.5, mb: 1, color: '#334155', fontWeight: 600, fontSize: '0.9rem' },
        /* Text formatting */
        '& strong, & b': { fontWeight: 800 },
        '& em, & i': { fontStyle: 'italic' },
        '& u': { textDecoration: 'underline' },
        /* Lists */
        '& ul': { mb: 2.5, pl: 3.5, listStyleType: 'disc' },
        '& ol': { mb: 2.5, pl: 3.5, listStyleType: 'decimal' },
        '& li': { mb: 1, lineHeight: 1.6 },
        /* Links */
        '& a': { color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', '&:hover': { color: '#1d4ed8' } },
        /* Blockquotes */
        '& blockquote': {
          borderLeft: '4px solid #2563eb',
          pl: 2.5,
          ml: 0,
          my: 2.5,
          fontStyle: 'italic',
          color: '#64748b',
          bgcolor: '#f8fafc',
          py: 1.5,
          pr: 2,
        },
        /* Horizontal rules */
        '& hr': { border: 'none', borderTop: '1px solid #e2e8f0', my: 3 },
        /* Code */
        '& code': {
          bgcolor: '#f1f5f9',
          px: '5px',
          py: '1px',
          borderRadius: '3px',
          fontFamily: "'Courier New', monospace",
          fontSize: '0.9em',
          color: '#dc2626',
        },
        '& pre': {
          bgcolor: '#f1f5f9',
          p: 2,
          borderRadius: '6px',
          overflow: 'auto',
          my: 2.5,
          border: '1px solid #e2e8f0',
          '& code': {
            bgcolor: 'transparent',
            p: 0,
            color: '#334155',
            fontFamily: "'Courier New', monospace",
          },
        },
        /* Tables */
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          my: 2.5,
          border: '1px solid #e2e8f0',
        },
        '& thead': {
          bgcolor: '#f8fafc',
          '& th': {
            p: '10px',
            textAlign: 'left',
            fontWeight: 700,
            borderBottom: '2px solid #e2e8f0',
            fontSize: '0.95rem',
          },
        },
        '& tbody': {
          '& td': {
            p: '8px 10px',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '0.95rem',
          },
          '& tr:last-child td': {
            borderBottom: 'none',
          },
        },
        '& tbody tr:hover': {
          bgcolor: '#f8fafc',
        },
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
  );
}
