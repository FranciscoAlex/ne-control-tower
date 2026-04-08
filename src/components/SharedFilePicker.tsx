/**
 * SharedFilePicker
 * ─────────────────────────────────────────────────────────────────────────────
 * Single reusable biblioteca/file-picker dialog used everywhere in the CT.
 *
 * Features:
 * - Tabs: Todos / Imagens / Documentos
 * - Search
 * - Upload button (top-right of the title bar) — uploads images or docs
 *   automatically based on file extension
 * - onSelect returns { name, url, path, extension?, sizeBytes? }
 */
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { FileText, Image as ImageIcon, RefreshCw, Upload, X } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];
const FILE_EXTS = ['pdf', 'doc', 'docx', 'csv', 'txt', 'xls', 'xlsx'];

export type PickedFile = {
  name: string;
  url: string;
  path: string;
  extension?: string;
  sizeBytes?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called when the user selects a file from the library */
  onSelect: (file: PickedFile) => void;
  title?: string;
};

const getExt = (name: string) =>
  name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';

const isImg = (ext: string) => IMAGE_EXTS.includes(ext);

const fmtBytes = (v?: string) => {
  const b = Number(v || 0);
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

export default function SharedFilePicker({ open, onClose, onSelect, title = 'Biblioteca' }: Props) {
  const [tab, setTab] = useState(0);
  const [images, setImages] = useState<PickedFile[]>([]);
  const [docs, setDocs] = useState<PickedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [imgRes, fileRes] = await Promise.all([
        fetch(`${API_BASE}/media-assets/images`),
        fetch(`${API_BASE}/media-assets/files`),
      ]);
      setImages(imgRes.ok ? await imgRes.json() : []);
      setDocs(fileRes.ok ? await fileRes.json() : []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSearch('');
      setUploadMsg(null);
      loadAll();
    }
  }, [open]);

  const processFile = async (file: File) => {

    const ext = getExt(file.name);
    const isImage = isImg(ext);
    const isDoc = FILE_EXTS.includes(ext);

    if (!isImage && !isDoc) {
      setUploadMsg({ type: 'error', text: `Formato não suportado (.${ext}). Use: ${[...IMAGE_EXTS, ...FILE_EXTS].join(', ')}` });
      return;
    }

    const maxBytes = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadMsg({ type: 'error', text: `Ficheiro demasiado grande. Limite: ${isImage ? '5 MB' : '10 MB'}.` });
      return;
    }

    setUploading(true);
    setUploadMsg(null);

    try {
      const form = new FormData();
      form.append('file', file);
      const endpoint = isImage
        ? `${API_BASE}/media-assets/images/upload`
        : `${API_BASE}/media-assets/files/upload`;

      const r = await fetch(endpoint, { method: 'POST', body: form });
      if (!r.ok) throw new Error();
      setUploadMsg({ type: 'success', text: `"${file.name}" carregado com sucesso.` });
      await loadAll();
      setTab(isImage ? 1 : 2);
    } catch {
      setUploadMsg({ type: 'error', text: 'Erro ao fazer upload. Tente novamente.' });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const allItems = tab === 0 ? [...images, ...docs] : tab === 1 ? images : docs;
  const filtered = allItems.filter(item =>
    !search || item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FileText size={18} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
              {title}
            </Typography>
          </Stack>

          {/* ── Close button top-right ── */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Recarregar biblioteca">
              <IconButton size="small" onClick={loadAll} disabled={loading}>
                <RefreshCw size={15} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fechar">
              <IconButton size="small" onClick={onClose}>
                <X size={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {uploadMsg && (
          <Alert severity={uploadMsg.type} onClose={() => setUploadMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>
            {uploadMsg.text}
          </Alert>
        )}

        <TextField
          fullWidth size="small" placeholder="Pesquisar ficheiro..."
          value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }}
        />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e2e8f0' }}>
          <Tab label={
            <Stack direction="row" spacing={0.8} alignItems="center">
              <span>Todos</span>
              <Chip label={images.length + docs.length} size="small" />
            </Stack>
          } />
          <Tab label={
            <Stack direction="row" spacing={0.8} alignItems="center">
              <ImageIcon size={13} /><span>Imagens</span>
              <Chip label={images.length} size="small" />
            </Stack>
          } />
          <Tab label={
            <Stack direction="row" spacing={0.8} alignItems="center">
              <FileText size={13} /><span>Documentos</span>
              <Chip label={docs.length} size="small" />
            </Stack>
          } />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          /* ── Drop-zone empty state ── */
          <Box
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => uploadRef.current?.click()}
            sx={{
              border: `2px dashed ${dragOver ? '#164993' : '#cbd5e1'}`,
              borderRadius: 3,
              py: 7,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              cursor: 'pointer',
              bgcolor: dragOver ? '#eff6ff' : '#f8fafc',
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: '#164993', bgcolor: '#eff6ff' },
            }}
          >
            {uploading ? (
              <CircularProgress size={32} />
            ) : (
              <Upload size={36} color={dragOver ? '#164993' : '#94a3b8'} />
            )}
            <Typography variant="body2" sx={{ fontWeight: 700, color: dragOver ? '#164993' : '#475569' }}>
              {uploading ? 'A carregar…' : 'Arraste um ficheiro ou clique para carregar'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Imagens (PNG, JPG, WebP…) ou documentos (PDF, DOCX, XLSX…)
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1.2 }}>
            {filtered.map(item => {
              const ext = getExt(item.name);
              const isImage = isImg(ext);
              return (
                <Paper
                  key={item.url}
                  onClick={() => { onSelect(item); onClose(); }}
                  sx={{
                    p: 1, borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#164993', boxShadow: '0 0 0 2px #164993' },
                  }}
                >
                  <Box sx={{
                    width: '100%', aspectRatio: '4/3', borderRadius: 1.5,
                    bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 0.8,
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isImage ? (
                      <Box component="img" src={item.url} alt={item.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Stack spacing={0.5} alignItems="center">
                        <FileText size={26} color="#475569" />
                        <Chip label={ext.toUpperCase() || 'FILE'} size="small"
                          sx={{ fontWeight: 700, bgcolor: '#e2e8f0', fontSize: '0.65rem', height: 18 }} />
                      </Stack>
                    )}
                  </Box>
                  <Typography variant="caption" noWrap
                    sx={{ display: 'block', fontWeight: 600, fontSize: '0.7rem' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                    {fmtBytes(item.sizeBytes)}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-start', px: 3, py: 1.5 }}>
        {uploading && <CircularProgress size={16} sx={{ mr: 1 }} />}
        <Tooltip title="Carregar novo ficheiro (imagem ou documento)">
          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={<Upload size={14} />}
            disabled={uploading}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {uploading ? 'A carregar…' : 'Upload'}
            <input
              ref={uploadRef}
              type="file"
              hidden
              accept={[...IMAGE_EXTS, ...FILE_EXTS].map(e => `.${e}`).join(',')}
              onChange={handleUpload}
            />
          </Button>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
}
