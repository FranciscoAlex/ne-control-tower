import { useEffect, useState } from 'react';
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
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ChevronDown, ChevronRight, FileText, Image as ImageIcon, Link2, Plus, Save, Trash2, Upload } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type SectionFile = { label: string; url: string };

type Section = {
  id: string;
  title: string;
  content: string;
  files: SectionFile[];
};

type EstatutosData = {
  lastUpdateLabel: string;
  legalBase: string;
  updatedAt: string;
  sections: Section[];
};

type AssetItem = {
  name: string;
  url: string;
  path: string;
  extension?: string;
  sizeBytes?: string;
};

const DEFAULTS: EstatutosData = {
  lastUpdateLabel: '11 de Julho de 2024',
  legalBase: 'Lei das Sociedades Comerciais',
  updatedAt: '',
  sections: [
    { id: 'natureza', title: 'Natureza e Firma', content: '', files: [] },
    { id: 'objecto', title: 'Objecto Social', content: '', files: [] },
    { id: 'capital', title: 'Capital Social e Acções', content: '', files: [] },
    { id: 'orgaos', title: 'Governança e Órgãos', content: '', files: [] },
    { id: 'sede', title: 'Sede e Duração', content: '', files: [] },
  ],
};

const getExt = (name: string) =>
  name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';

const isImageExt = (ext: string) =>
  ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);

const formatBytes = (value?: string) => {
  const bytes = Number(value || 0);
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Biblioteca picker dialog ─────────────────────────────────────────────────
function BibliotecaPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (file: SectionFile) => void;
}) {
  const [pickerTab, setPickerTab] = useState(0);
  const [images, setImages] = useState<AssetItem[]>([]);
  const [docs, setDocs] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/media-assets/images`).then(r => r.json()),
      fetch(`${API_BASE}/media-assets/files`).then(r => r.json()),
    ])
      .then(([imgs, files]) => {
        setImages(Array.isArray(imgs) ? imgs : []);
        setDocs(Array.isArray(files) ? files : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const allItems: AssetItem[] = pickerTab === 0 ? [...images, ...docs] : pickerTab === 1 ? images : docs;

  const filtered = allItems.filter(item =>
    !search || item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Upload size={18} /> Selecionar da Biblioteca
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          placeholder="Pesquisar ficheiro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Tabs value={pickerTab} onChange={(_, v) => setPickerTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e2e8f0' }}>
          <Tab label={<Stack direction="row" spacing={0.8} alignItems="center"><span>Todos</span><Chip label={images.length + docs.length} size="small" /></Stack>} />
          <Tab label={<Stack direction="row" spacing={0.8} alignItems="center"><ImageIcon size={13} /><span>Imagens</span><Chip label={images.length} size="small" /></Stack>} />
          <Tab label={<Stack direction="row" spacing={0.8} alignItems="center"><FileText size={13} /><span>Documentos</span><Chip label={docs.length} size="small" /></Stack>} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
            Sem ficheiros disponíveis. Carregue ficheiros via Biblioteca da Galeria de Media.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1.2 }}>
            {filtered.map(item => {
              const ext = getExt(item.name);
              const isImg = isImageExt(ext);
              return (
                <Paper
                  key={item.url}
                  onClick={() => { onSelect({ label: item.name, url: item.url }); onClose(); }}
                  sx={{
                    p: 1, borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden',
                    cursor: 'pointer', '&:hover': { borderColor: '#164993', boxShadow: '0 0 0 2px #164993' },
                  }}
                >
                  <Box sx={{ width: '100%', aspectRatio: '4/3', borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 0.8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isImg ? (
                      <Box component="img" src={item.url} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Stack spacing={0.5} alignItems="center">
                        <FileText size={26} color="#475569" />
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
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({
  section,
  index,
  onChange,
  onDelete,
}: {
  section: Section;
  index: number;
  onChange: (idx: number, updated: Section) => void;
  onDelete: (idx: number) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const updateFile = (fi: number, field: keyof SectionFile, value: string) => {
    const updated = section.files.map((f, i) => i === fi ? { ...f, [field]: value } : f);
    onChange(index, { ...section, files: updated });
  };

  const removeFile = (fi: number) => {
    onChange(index, { ...section, files: section.files.filter((_, i) => i !== fi) });
  };

  const addFile = (file: SectionFile) => {
    onChange(index, { ...section, files: [...(section.files || []), file] });
  };

  return (
    <>
      <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
        <Box
          onClick={() => setOpen(v => !v)}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 3, py: 2, cursor: 'pointer',
            bgcolor: open ? '#f8fafc' : 'white',
            '&:hover': { bgcolor: '#f8fafc' },
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton size="small" tabIndex={-1}>
              {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </IconButton>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {section.title || '(sem título)'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                id: {section.id || '—'} &nbsp;·&nbsp; {section.files?.length || 0} ficheiro(s)
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); onDelete(index); }}>
            <Trash2 size={15} />
          </IconButton>
        </Box>

        {open && (
          <Box sx={{ px: 3, pb: 3 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* Section metadata */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="ID (slug)"
                  value={section.id}
                  onChange={e => onChange(index, { ...section, id: e.target.value })}
                  size="small"
                  sx={{ minWidth: 140 }}
                  helperText="Identificador único, sem espaços"
                />
                <TextField
                  label="Título da Secção"
                  value={section.title}
                  onChange={e => onChange(index, { ...section, title: e.target.value })}
                  size="small"
                  fullWidth
                />
              </Stack>
              <TextField
                label="Conteúdo"
                value={section.content}
                onChange={e => onChange(index, { ...section, content: e.target.value })}
                multiline
                minRows={4}
                fullWidth
                size="small"
              />

              <Divider />

              {/* Per-section files */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Ficheiros para download ({section.files?.length || 0})
                </Typography>
                <Tooltip title="Selecionar ficheiro da Biblioteca">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Upload size={13} />}
                    onClick={() => setPickerOpen(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    Biblioteca
                  </Button>
                </Tooltip>
              </Stack>

              {(section.files?.length || 0) === 0 ? (
                <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  Nenhum ficheiro associado. Clique em "Biblioteca" para adicionar.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {section.files.map((file, fi) => (
                    <Paper key={fi} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Link2 size={14} color="#475569" />
                        <TextField
                          size="small"
                          label="Etiqueta"
                          value={file.label}
                          onChange={e => updateFile(fi, 'label', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="URL"
                          value={file.url}
                          onChange={e => updateFile(fi, 'url', e.target.value)}
                          sx={{ flex: 2 }}
                          InputProps={{ readOnly: true }}
                        />
                        <IconButton size="small" color="error" onClick={() => removeFile(fi)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      <BibliotecaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addFile}
      />
    </>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────
export default function EstatutosEditor() {
  const [data, setData] = useState<EstatutosData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/estatutos`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((d: EstatutosData) => setData({
        ...d,
        sections: (d.sections || []).map(s => ({ ...s, files: s.files || [] })),
      }))
      .catch(() => setData(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/estatutos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated: EstatutosData = await res.json();
      setData({ ...updated, sections: (updated.sections || []).map(s => ({ ...s, files: s.files || [] })) });
      showMsg('success', 'Estatutos guardados com sucesso.');
    } catch {
      showMsg('error', 'Erro ao guardar os estatutos.');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (idx: number, updated: Section) =>
    setData(prev => ({ ...prev, sections: prev.sections.map((s, i) => i === idx ? updated : s) }));

  const deleteSection = (idx: number) =>
    setData(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== idx) }));

  const addSection = () =>
    setData(prev => ({
      ...prev,
      sections: [...prev.sections, { id: `secao-${prev.sections.length + 1}`, title: '', content: '', files: [] }],
    }));

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ pb: 6 }}>
      <PageUrlBanner urls={{ path: '/estatuto', label: 'Governança — Estatuto da ENSA' }} />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Edite os capítulos e ficheiros de download por secção em{' '}
            <Box component="code" sx={{ fontSize: 12, bgcolor: '#f1f5f9', px: 0.5, borderRadius: 0.5 }}>/ensa/estatuto</Box>.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', flexShrink: 0 }}
        >
          {saving ? 'A guardar…' : 'Guardar Tudo'}
        </Button>
      </Stack>

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {msg.text}
        </Alert>
      )}

      {/* Metadata */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Metadados</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Última Actualização (label)"
            value={data.lastUpdateLabel}
            onChange={e => setData(p => ({ ...p, lastUpdateLabel: e.target.value }))}
            size="small"
            fullWidth
            helperText='Ex: "11 de Julho de 2024"'
          />
          <TextField
            label="Base Legal"
            value={data.legalBase}
            onChange={e => setData(p => ({ ...p, legalBase: e.target.value }))}
            size="small"
            fullWidth
            helperText='Ex: "Lei das Sociedades Comerciais"'
          />
        </Stack>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Capítulos ({data.sections.length})
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Plus size={14} />}
          onClick={addSection}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Novo Capítulo
        </Button>
      </Stack>

      {data.sections.map((section, idx) => (
        <SectionCard
          key={idx}
          section={section}
          index={idx}
          onChange={updateSection}
          onDelete={deleteSection}
        />
      ))}

      {data.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Última gravação: {data.updatedAt}
        </Typography>
      )}
    </Box>
  );
}
