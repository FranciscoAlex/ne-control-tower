import { useEffect, useMemo, useState } from 'react';
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
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Upload, FileUp, Image as ImageIcon, FileText, RefreshCw, Copy, Eye, Trash2, ArchiveRestore } from 'lucide-react';
import JSZip from 'jszip';
import PageUrlBanner from './PageUrlBanner';

type AssetItem = {
  name: string;
  url: string;
  path: string;
  extension?: string;
  sizeBytes?: string;
  insertedAt?: string;
};

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;
const IMAGE_MAX_BYTES = 120 * 1024 * 1024;
const FILE_MAX_BYTES = 120 * 1024 * 1024;

const formatBytes = (value?: string) => {
  const bytes = Number(value || 0);
  if (!bytes) return 'N/D';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value?: string) => {
  if (!value) return 'N/D';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/D';
  return d.toLocaleString('pt-PT');
};

const getExtension = (item: AssetItem) =>
  ((item.extension || (item.name.includes('.') ? item.name.slice(item.name.lastIndexOf('.')) : '')) || '').replace('.', '').toLowerCase();

const detectFileType = (file: File): 'image' | 'document' => {
  const lower = file.name.toLowerCase();
  if (/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/.test(lower)) return 'image';
  return 'document';
};

const getBibliotecaTabIndex = (ext: string): number => {
  const e = ext.replace('.', '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(e)) return 1;
  if (['pdf', 'doc', 'docx'].includes(e)) return 2;
  if (['csv', 'txt', 'xls', 'xlsx'].includes(e)) return 3;
  return 0;
};

export default function MediaGalleryEditor() {
  const [tab, setTab] = useState(0);
  const [images, setImages] = useState<AssetItem[]>([]);
  const [files, setFiles] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewItem, setPreviewItem] = useState<AssetItem | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [bibliotecaOpen, setBibliotecaOpen] = useState(false);
  const [bibliotecaTab, setBibliotecaTab] = useState(0);
  const [bibliotecaDrag, setBibliotecaDrag] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreStats, setRestoreStats] = useState<{ ok: number; skipped: number } | null>(null);

  const activeItems = tab === 0 ? images : files;

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeItems.filter((item) => {
      const matchesQuery = !q
        || item.name.toLowerCase().includes(q)
        || item.path.toLowerCase().includes(q);

      const ext = (item.extension || '').replace('.', '').toUpperCase();
      const matchesType = typeFilter === 'ALL' || ext === typeFilter;

      const inserted = item.insertedAt ? new Date(item.insertedAt).toISOString().slice(0, 10) : '';
      const matchesDate = !dateFilter || inserted === dateFilter;

      return matchesQuery && matchesType && matchesDate;
    });
  }, [activeItems, search, typeFilter, dateFilter]);

  const extensionOptions = useMemo(() => {
    const options = new Set<string>(['ALL']);
    activeItems.forEach((item) => {
      const ext = (item.extension || '').replace('.', '').toUpperCase();
      if (ext) options.add(ext);
    });
    return Array.from(options);
  }, [activeItems]);

  const allBibliotecaItems = useMemo(() => [...images, ...files], [images, files]);

  const bibliotecaFilteredItems = useMemo(() => {
    const isExt = (ext: string, list: string[]) => list.includes(ext.replace('.', '').toLowerCase());
    if (bibliotecaTab === 0) return allBibliotecaItems;
    return allBibliotecaItems.filter((item) => {
      const ext = getExtension(item);
      if (bibliotecaTab === 1) return isExt(ext, ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg']);
      if (bibliotecaTab === 2) return isExt(ext, ['pdf', 'doc', 'docx']);
      if (bibliotecaTab === 3) return isExt(ext, ['csv', 'txt', 'xls', 'xlsx']);
      return true;
    });
  }, [allBibliotecaItems, bibliotecaTab]);

  const loadAssets = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const [imgRes, fileRes] = await Promise.all([
        fetch(`${API_BASE}/media-assets/images`),
        fetch(`${API_BASE}/media-assets/files`),
      ]);
      if (!imgRes.ok || !fileRes.ok) throw new Error('Erro ao carregar galeria');

      const imgData = await imgRes.json() as AssetItem[];
      const fileData = await fileRes.json() as AssetItem[];

      const normalizedImages = (Array.isArray(imgData) ? imgData : []).map((item) => ({
        ...item,
        extension: item.extension || (item.name.includes('.') ? item.name.slice(item.name.lastIndexOf('.')) : ''),
      }));

      setImages(normalizedImages);
      setFiles(Array.isArray(fileData) ? fileData : []);
    } catch {
      setMsg({ type: 'error', text: 'Falha ao carregar itens da galeria.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    setTypeFilter('ALL');
    setDateFilter('');
  }, [tab]);

  const uploadFile = async (file: File) => {
    if (!file) return;

    const type = detectFileType(file);
    const lower = file.name.toLowerCase();

    if (type === 'image') {
      if (!/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/.test(lower)) {
        setMsg({ type: 'error', text: 'Formato inválido. Imagens permitidas: PNG, JPG, JPEG, WEBP, GIF, SVG.' });
        return;
      }
      if (file.size > IMAGE_MAX_BYTES) {
        setMsg({ type: 'error', text: 'Imagem demasiado grande. Limite: 120MB.' });
        return;
      }
    } else {
      if (!/\.(pdf|doc|docx|csv|txt|xls|xlsx)$/.test(lower)) {
        setMsg({ type: 'error', text: 'Formato não suportado. Permitidos: PDF, DOC, DOCX, CSV, TXT, XLS, XLSX.' });
        return;
      }
      if (file.size > FILE_MAX_BYTES) {
        setMsg({ type: 'error', text: 'Ficheiro demasiado grande. Limite: 120MB.' });
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = type === 'image'
        ? `${API_BASE}/media-assets/images/upload`
        : `${API_BASE}/media-assets/files/upload`;

      const response = await new Promise<{ ok: boolean }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300 });
        xhr.onerror = () => reject(new Error('network error'));
        xhr.send(formData);
      });
      if (!response.ok) throw new Error('Falha no upload');

      await loadAssets();
      const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1) : '';
      setBibliotecaTab(getBibliotecaTabIndex(ext));
      setMsg({ type: 'success', text: 'Upload concluído com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao fazer upload para a galeria.' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await uploadFile(file as File);
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMsg({ type: 'success', text: 'URL copiado para a área de transferência.' });
    } catch {
      setMsg({ type: 'error', text: 'Não foi possível copiar o URL.' });
    }
  };

  const openPreview = async (item: AssetItem) => {
    setPreviewItem(item);
    setPreviewText('');
    const ext = getExtension(item);
    if (ext === 'csv' || ext === 'txt') {
      try {
        const res = await fetch(item.url);
        const text = await res.text();
        setPreviewText(text.slice(0, 30000));
      } catch {
        setPreviewText('Não foi possível carregar o conteúdo para pré-visualização.');
      }
    }
  };

  const handleBackup = async () => {
    const allItems = [...images, ...files];
    if (allItems.length === 0) {
      setMsg({ type: 'error', text: 'Não há ficheiros para incluir no backup.' });
      return;
    }
    setBackingUp(true);
    setBackupProgress(0);
    setMsg(null);
    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder('imagens')!;
      const filesFolder = zip.folder('ficheiros')!;
      let done = 0;
      for (const item of allItems) {
        const ext = getExtension(item);
        const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
        try {
          const res = await fetch(item.url);
          if (res.ok) {
            const blob = await res.blob();
            const folder = isImg ? imagesFolder : filesFolder;
            folder.file(item.name, blob);
          }
        } catch {
          // skip files that fail to fetch
        }
        done++;
        setBackupProgress(Math.round((done / allItems.length) * 100));
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `backup-galeria-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg({ type: 'success', text: `Backup concluído. ${allItems.length} ficheiro(s) incluídos.` });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao gerar backup.' });
    } finally {
      setBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const zipFile = event.target.files?.[0];
    event.target.value = '';
    if (!zipFile) return;
    if (!zipFile.name.toLowerCase().endsWith('.zip')) {
      setMsg({ type: 'error', text: 'Selecione um ficheiro .zip válido.' });
      return;
    }
    setRestoring(true);
    setRestoreProgress(0);
    setRestoreStats(null);
    setMsg(null);
    try {
      // Fetch the current server asset names so we can skip files that already exist
      const normalizeForCompare = (n: string) =>
        n.replaceAll(/[^a-zA-Z0-9._-]/g, '_').replaceAll(/_{2,}/g, '_');

      const [imgRes, fileRes] = await Promise.all([
        fetch(`${API_BASE}/media-assets/images`),
        fetch(`${API_BASE}/media-assets/files`),
      ]);
      const existingImages: AssetItem[] = imgRes.ok ? await imgRes.json() : [];
      const existingFiles: AssetItem[] = fileRes.ok ? await fileRes.json() : [];
      const existingNames = new Set(
        [...existingImages, ...existingFiles].map((a) => normalizeForCompare(a.name)),
      );

      const zip = await JSZip.loadAsync(zipFile);
      const allowedExts = ['png','jpg','jpeg','webp','gif','bmp','svg','pdf','doc','docx','csv','txt','xls','xlsx'];
      const entries = Object.values(zip.files).filter(
        (f) => !f.dir && !f.name.startsWith('__MACOSX') && !f.name.split('/').pop()?.startsWith('.')
      );
      const validEntries = entries.filter((f) => {
        const name = f.name.split('/').pop() || '';
        const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
        return allowedExts.includes(ext);
      });
      if (validEntries.length === 0) {
        setMsg({ type: 'error', text: 'O ZIP não contém ficheiros suportados.' });
        return;
      }
      let ok = 0;
      let skipped = 0;
      for (let i = 0; i < validEntries.length; i++) {
        const entry = validEntries[i];
        const name = entry.name.split('/').pop() || entry.name;
        const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
        const isImg = ['png','jpg','jpeg','webp','gif','bmp','svg'].includes(ext);

        // Skip files that already exist on the server — preserve the actual/stable copies
        if (existingNames.has(normalizeForCompare(name))) {
          skipped++;
          setRestoreProgress(Math.round(((i + 1) / validEntries.length) * 100));
          continue;
        }

        try {
          const blob = await entry.async('blob');
          const file = new File([blob], name, { type: blob.type });
          const formData = new FormData();
          formData.append('file', file);
          const endpoint = isImg
            ? `${API_BASE}/media-assets/images/upload`
            : `${API_BASE}/media-assets/files/upload`;
          const res = await fetch(endpoint, { method: 'POST', body: formData });
          if (res.ok) { ok++; } else { skipped++; }
        } catch {
          skipped++;
        }
        setRestoreProgress(Math.round(((i + 1) / validEntries.length) * 100));
      }
      setRestoreStats({ ok, skipped });
      setMsg({
        type: ok > 0 ? 'success' : 'error',
        text: `Restauro concluído: ${ok} ficheiro(s) importado(s)${skipped > 0 ? `, ${skipped} ignorado(s)` : ''}.`,
      });
      await loadAssets();
    } catch {
      setMsg({ type: 'error', text: 'Erro ao ler o ficheiro ZIP.' });
    } finally {
      setRestoring(false);
      setRestoreProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!previewItem) return;
    setDeleting(true);
    try {
      const ext = getExtension(previewItem);
      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
      const endpoint = isImg ? `${API_BASE}/media-assets/images` : `${API_BASE}/media-assets/files`;
      const response = await fetch(`${endpoint}?path=${encodeURIComponent(previewItem.path)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete failed');
      setMsg({ type: 'success', text: 'Ficheiro removido da galeria.' });
      setPreviewItem(null);
      await loadAssets();
    } catch {
      setMsg({ type: 'error', text: 'Não foi possível apagar o ficheiro.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Biblioteca partilhada de imagens e documentos para reutilização no CMS.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<Upload size={14} />}
            onClick={() => setBibliotecaOpen(true)}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
          >
            Biblioteca
          </Button>
          <Button
            variant="outlined"
            startIcon={backingUp ? <RefreshCw size={14} /> : <ArchiveRestore size={14} />}
            onClick={handleBackup}
            disabled={backingUp || loading || restoring}
            sx={{ borderRadius: 3, textTransform: 'none' }}
          >
            {backingUp ? `Backup... ${backupProgress}%` : 'Backup'}
          </Button>
          <Button
            component="label"
            variant="outlined"
            startIcon={restoring ? <RefreshCw size={14} /> : <Upload size={14} />}
            disabled={restoring || backingUp || loading}
            sx={{ borderRadius: 3, textTransform: 'none' }}
          >
            {restoring ? `Importar... ${restoreProgress}%` : 'Importar Backup'}
            <input type="file" hidden accept=".zip" onChange={handleRestoreBackup} />
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={14} />}
            onClick={loadAssets}
            sx={{ borderRadius: 3, textTransform: 'none' }}
          >
            Recarregar
          </Button>
        </Stack>
      </Stack>

      <PageUrlBanner urls={[{ label: 'Galeria de Ficheiros', path: '/biblioteca/galeria' }]} />

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 3 }}>
          {msg.text}
        </Alert>
      )}

      {uploading && (
        <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.8, display: 'block' }}>
            A carregar ficheiro... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 999 }} />
        </Paper>
      )}

      {restoring && (
        <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px solid #bfdbfe', bgcolor: '#eff6ff' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8', mb: 0.8, display: 'block' }}>
            A importar backup... {restoreProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={restoreProgress} sx={{ height: 8, borderRadius: 999 }} />
        </Paper>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Tab label={<Stack direction="row" spacing={1} alignItems="center"><ImageIcon size={14} /><span>Imagens</span><Chip label={images.length} size="small" /></Stack>} />
        <Tab label={<Stack direction="row" spacing={1} alignItems="center"><FileText size={14} /><span>Ficheiros</span><Chip label={files.length} size="small" /></Stack>} />
      </Tabs>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome ou caminho"
        />
        <TextField
          select
          size="small"
          label="Tipo"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          {extensionOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt === 'ALL' ? 'Todos' : opt}</MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="Data de inserção"
          InputLabelProps={{ shrink: true }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          sx={{ minWidth: 190 }}
        />
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filteredItems.length === 0 ? (
        <Paper
          onDragEnter={() => setDragActive(true)}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: 3,
            border: dragActive ? '2px dashed #164993' : '2px dashed #cbd5e1',
            bgcolor: dragActive ? '#eff6ff' : '#f8fafc',
            transition: 'all 0.2s ease',
          }}
        >
          <Stack spacing={1.2} alignItems="center">
            <FileUp size={26} color={dragActive ? '#164993' : '#64748b'} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155' }}>
              Arraste e largue aqui ou abra a Biblioteca
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              O tipo de ficheiro é detectado automaticamente pela extensão
            </Typography>
            <Button
              variant="contained"
              startIcon={<Upload size={14} />}
              onClick={() => setBibliotecaOpen(true)}
              sx={{ mt: 1, textTransform: 'none', borderRadius: 2 }}
            >
              Abrir Biblioteca
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 1.25,
          }}
        >
          {filteredItems.map((item) => (
            <Paper key={item.url} sx={{ p: 1.1, borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 1.5,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  mb: 0.9,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tab === 0 ? (
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Stack spacing={1} alignItems="center" justifyContent="center">
                    <FileText size={34} color="#475569" />
                    <Chip
                      label={(item.extension || '').replace('.', '').toUpperCase() || 'FILE'}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#e2e8f0', color: '#334155' }}
                    />
                  </Stack>
                )}
              </Box>

              <Stack spacing={0.3} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>{item.name}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>{item.path}</Typography>
                <Typography variant="caption" sx={{ color: '#475569' }}>
                  {(item.extension || '').replace('.', '').toUpperCase() || 'N/D'} • {formatBytes(item.sizeBytes)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Inserção: {formatDate(item.insertedAt)}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.8} sx={{ mt: 0.9 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Copy size={14} />}
                  onClick={() => copyUrl(item.url)}
                  sx={{ textTransform: 'none', flex: 1 }}
                >
                  Copiar URL
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Eye size={14} />}
                  onClick={() => openPreview(item)}
                  sx={{ textTransform: 'none', flex: 1 }}
                >
                  Ver
                </Button>
              </Stack>
            </Paper>
          ))}
        </Box>
      )}

      {/* ===== Biblioteca Dialog ===== */}
      <Dialog open={bibliotecaOpen} onClose={() => setBibliotecaOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Upload size={18} /> Biblioteca de Ficheiros
        </DialogTitle>
        <DialogContent dividers>
          {/* Upload drop zone */}
          <Paper
            onDragEnter={() => setBibliotecaDrag(true)}
            onDragOver={(e) => { e.preventDefault(); setBibliotecaDrag(true); }}
            onDragLeave={() => setBibliotecaDrag(false)}
            onDrop={async (e) => { e.preventDefault(); setBibliotecaDrag(false); const f = e.dataTransfer.files?.[0]; if (f) await uploadFile(f); }}
            sx={{
              p: 3, mb: 2, textAlign: 'center', borderRadius: 2,
              border: bibliotecaDrag ? '2px dashed #164993' : '2px dashed #cbd5e1',
              bgcolor: bibliotecaDrag ? '#eff6ff' : '#f8fafc',
              transition: 'all 0.2s ease',
            }}
          >
            <Stack spacing={1} alignItems="center">
              <FileUp size={28} color={bibliotecaDrag ? '#164993' : '#64748b'} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155' }}>
                {bibliotecaDrag ? 'Largar para carregar' : 'Arraste e largue para carregar'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Imagens (PNG, JPG, WEBP, GIF, SVG) · Documentos (PDF, DOC, DOCX) · CSV, TXT, XLS, XLSX
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                O sistema detecta automaticamente o tipo pela extensão do ficheiro
              </Typography>
              <Button
                component="label"
                variant="outlined"
                size="small"
                sx={{ mt: 0.5, textTransform: 'none', borderRadius: 2 }}
                disabled={uploading}
              >
                {uploading ? `A carregar... ${uploadProgress}%` : 'Selecionar ficheiro'}
                <input
                  type="file"
                  hidden
                  accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.pdf,.doc,.docx,.csv,.txt,.xls,.xlsx"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}
                />
              </Button>
            </Stack>
            {uploading && (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 999 }} />
              </Box>
            )}
          </Paper>

          {msg && (
            <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>
              {msg.text}
            </Alert>
          )}

          {/* Category tabs */}
          <Tabs value={bibliotecaTab} onChange={(_, v) => setBibliotecaTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e2e8f0' }}>
            <Tab label={<Stack direction="row" spacing={0.8} alignItems="center"><span>Todas</span><Chip label={allBibliotecaItems.length} size="small" /></Stack>} />
            <Tab label={<Stack direction="row" spacing={0.8} alignItems="center"><ImageIcon size={13} /><span>Imagens</span><Chip label={images.length} size="small" /></Stack>} />
            <Tab label={<Stack direction="row" spacing={0.8} alignItems="center"><FileText size={13} /><span>Documentos</span><Chip label={files.filter(f => ['pdf','doc','docx'].includes(getExtension(f))).length} size="small" /></Stack>} />
            <Tab label={<Stack direction="row" spacing={0.8} alignItems="center"><FileText size={13} /><span>CSV / Folhas</span><Chip label={files.filter(f => ['csv','txt','xls','xlsx'].includes(getExtension(f))).length} size="small" /></Stack>} />
          </Tabs>

          {/* Files grid inside biblioteca */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : bibliotecaFilteredItems.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
              Sem ficheiros nesta categoria. Arraste ou selecione um ficheiro acima para carregar.
            </Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 1.2 }}>
              {bibliotecaFilteredItems.map((item) => {
                const ext = getExtension(item);
                const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
                return (
                  <Paper
                    key={item.url}
                    sx={{ p: 1, borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', '&:hover': { borderColor: '#164993', boxShadow: '0 0 0 2px #164993' } }}
                    onClick={() => { openPreview(item); }}
                  >
                    <Box sx={{ width: '100%', aspectRatio: '4/3', borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 0.8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isImg ? (
                        <Box component="img" src={item.url} alt={item.name} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Stack spacing={0.5} alignItems="center">
                          <FileText size={28} color="#475569" />
                          <Chip label={ext.toUpperCase() || 'FILE'} size="small" sx={{ fontWeight: 700, bgcolor: '#e2e8f0', fontSize: '0.65rem', height: 18 }} />
                        </Stack>
                      )}
                    </Box>
                    <Typography variant="caption" noWrap sx={{ display: 'block', fontWeight: 600, fontSize: '0.7rem' }}>{item.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>{formatBytes(item.sizeBytes)}</Typography>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBibliotecaOpen(false)} sx={{ textTransform: 'none' }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(previewItem)} onClose={() => setPreviewItem(null)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 800 }}>{previewItem?.name || 'Pré-visualização'}</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 560 }}>
          {previewItem && (() => {
            const ext = getExtension(previewItem);
            const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
            const isPdf = ext === 'pdf';
            const isText = ext === 'csv' || ext === 'txt';

            if (isImage) {
              return <Box component="img" src={previewItem.url} alt={previewItem.name} sx={{ width: '100%', maxHeight: 640, objectFit: 'contain' }} />;
            }
            if (isPdf) {
              return <Box component="iframe" src={previewItem.url} title={previewItem.name} sx={{ width: '100%', height: 600, border: 'none' }} />;
            }
            if (isText) {
              return (
                <Box sx={{ p: 2, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 2, overflow: 'auto', maxHeight: 600 }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{previewText || 'Sem conteúdo para mostrar.'}</pre>
                </Box>
              );
            }
            return (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Pré-visualização indisponível para este tipo de ficheiro.
                </Typography>
                <Button variant="outlined" href={previewItem.url} target="_blank" rel="noreferrer" sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>
                  Abrir em nova aba
                </Button>
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="contained"
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
            onClick={handleDelete}
            disabled={deleting}
            sx={{ textTransform: 'none', mr: 'auto' }}
          >
            {deleting ? 'A apagar...' : 'Apagar ficheiro'}
          </Button>
          {previewItem && (
            <Button href={previewItem.url} download={previewItem.name || true} sx={{ textTransform: 'none' }}>
              Baixar
            </Button>
          )}
          <Button onClick={() => setPreviewItem(null)} sx={{ textTransform: 'none' }}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
