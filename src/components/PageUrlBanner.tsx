import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { ExternalLink, Eye } from 'lucide-react';

const MAIN_ORIGIN = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:3000';
const BASE_PATH = '';

interface UrlEntry {
  label: string;
  path: string;
}

interface Props {
  urls: UrlEntry | UrlEntry[];
}

/**
 * Shows a compact banner with the live URL(s) in the main investor portal
 * where the changes made in this editor will be visible.
 */
export default function PageUrlBanner({ urls }: Props) {
  const entries = Array.isArray(urls) ? urls : [urls];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        px: 2,
        py: 1,
        mb: 3,
        bgcolor: '#f0f7ff',
        border: '1px solid #bfdbfe',
        borderRadius: 3,
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: '#1d4ed8', flexShrink: 0 }}>
        <Eye size={14} />
      </Stack>

      {entries.map(e => (
        <Tooltip key={e.path} title={`Abrir ${MAIN_ORIGIN}${BASE_PATH}${e.path}`} placement="top">
          <Chip
            component="a"
            href={`${MAIN_ORIGIN}${BASE_PATH}${e.path}`}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLink size={11} />}
            label={
              <span>
                <span style={{ opacity: 0.6 }}>{MAIN_ORIGIN}{BASE_PATH}</span>
                <span style={{ fontWeight: 700 }}>{e.path}</span>
                {e.label && <span style={{ opacity: 0.55 }}> — {e.label}</span>}
              </span>
            }
            size="small"
            clickable
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              bgcolor: 'white',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              '&:hover': { bgcolor: '#eff6ff' },
              height: 24,
              cursor: 'pointer',
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
}
