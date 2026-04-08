import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Image,
  Link,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import RichTextEditor from './RichTextEditor';
import SharedFilePicker from './SharedFilePicker';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type Communication = {
  id?: number;
  title: string;
  communicationType: string;
  category: string;
  summary: string;
  contentHtml: string;
  publishedAt: string;       // ISO: "2025-04-15T00:00:00"
  slugId: string;
  author: string;
  documentUrl: string;
  imageUrl: string;
  displaySections: string;   // comma-separated: "HOME,COMUNICADOS,RELATORIOS"
};

// Section options
export const DISPLAY_SECTIONS = [
  { key: 'HOME',        label: 'Página Inicial (Notícias)' },
  { key: 'COMUNICADOS', label: 'Comunicados (/ensa/comunicados)' },
  { key: 'RELATORIOS',  label: 'Relatórios (/ensa/relatorios)' },
];

const COMM_TYPES = ['PressRelease', 'NotaImprensa', 'Comunicado', 'Notícia', 'Aviso', 'Outro'];
const CATEGORIES = ['Finanças', 'Resultados', 'Corporativo', 'Operacional', 'Estratégia', 'Governança', 'Outro'];

const TYPE_COLORS: Record<string, string> = {
  PressRelease: '#164993',
  NotaImprensa: '#0891b2',
  Comunicado:   '#7c3aed',
  Notícia:      '#059669',
  Aviso:        '#b45309',
  Outro:        '#475569',
};

// Format ISO date to "YYYY-MM-DD" for date input
function toDateInput(iso: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// Format date input to ISO string for backend
function toISODateTime(dateInput: string) {
  if (!dateInput) return new Date().toISOString().slice(0, 19);
  return `${dateInput}T00:00:00`;
}

function sectionsToSet(csv: string): Set<string> {
  return new Set(csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : []);
}

function setToSections(s: Set<string>): string {
  return Array.from(s).join(',');
}

function emptyCommunication(defaultSections = 'HOME,COMUNICADOS'): Communication {
  return {
    title: '',
    communicationType: 'PressRelease',
    category: 'Corporativo',
    summary: '',
    contentHtml: '',
    publishedAt: toISODateTime(new Date().toISOString().slice(0, 10)),
    slugId: '',
    author: '',
    documentUrl: '',
    imageUrl: '',
    displaySections: defaultSections,
  };
}

// ---- Visibility checkboxes sub-component ----
function SectionCheckboxes({ value, onChange, disabled }: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const active = sectionsToSet(value);
  const toggle = (key: string) => {
    const next = new Set(active);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(setToSections(next));
  };
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>
        Visibilidade — Mostrar em:
      </Typography>
      <FormGroup row sx={{ mt: 0.5, flexWrap: 'wrap' }}>
        {DISPLAY_SECTIONS.map(s => (
          <FormControlLabel
            key={s.key}
            control={<Checkbox size="small" checked={active.has(s.key)} onChange={() => toggle(s.key)} disabled={disabled} sx={{ p: 0.5 }} />}
            label={<Typography variant="caption" sx={{ fontWeight: 600 }}>{s.label}</Typography>}
            sx={{ mr: 2 }}
          />
        ))}
      </FormGroup>
    </Box>
  );
}

// ---- Communication Card (expandable) ----
function CommunicationCard({
  comm,
  onSave,
  onDelete,
}: {
  comm: Communication;
  onSave: (c: Communication) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Communication>(comm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setData(comm); }, [comm]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      await onSave(data);
      setEditing(false);
      setMsg({ type: 'success', text: 'Guardado com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !comm.id) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/communications/${comm.id}/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setData(p => ({ ...p, documentUrl: saved.url }));
      setMsg({ type: 'success', text: `"${file.name}" carregado — URL actualizado automaticamente.` });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar ficheiro.' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadingCover(true);
      const res = await fetch(`${API_BASE}/media-assets/images/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setData(p => ({ ...p, imageUrl: saved.url || saved.imageUrl || p.imageUrl }));
      setMsg({ type: 'success', text: `Imagem "${file.name}" carregada para biblioteca e aplicada.` });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar imagem de capa.' });
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const activeSections = sectionsToSet(data.displaySections);
  const typeColor = TYPE_COLORS[data.communicationType] ?? '#475569';

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 2 }}>
      {/* Header */}
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', userSelect: 'none', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" tabIndex={-1} onClick={e => { e.stopPropagation(); setOpen(v => !v); }}>
            {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </IconButton>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
              {data.title || '(sem título)'}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3, flexWrap: 'wrap' }}>
              <Chip
                label={data.communicationType}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: alpha(typeColor, 0.1), color: typeColor }}
              />
              {data.category && (
                <Chip label={data.category} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#64748b' }} />
              )}
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {data.publishedAt ? toDateInput(data.publishedAt) : '—'}
              </Typography>
              {data.author && (
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>{data.author}</Typography>
              )}
              {/* Visibility section badges */}
              {DISPLAY_SECTIONS.filter(s => activeSections.has(s.key)).map(s => (
                <Chip key={s.key} label={s.key} size="small" sx={{ height: 16, fontWeight: 700, fontSize: '0.6rem', bgcolor: '#dcfce7', color: '#166534' }} />
              ))}
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} onClick={e => e.stopPropagation()}>
          {editing ? (
            <>
              <Button size="small" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={14} /> : <Check size={14} />} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Guardar</Button>
              <Button size="small" onClick={() => { setEditing(false); setData(comm); }} startIcon={<X size={14} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Cancelar</Button>
            </>
          ) : (
            <Button size="small" onClick={() => { setOpen(true); setEditing(true); }} startIcon={<Pencil size={14} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Editar</Button>
          )}
          {comm.id && (
            confirmDelete
              ? <Stack direction="row" spacing={1}>
                  <Button size="small" color="error" variant="contained" onClick={() => onDelete(comm.id!)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Confirmar</Button>
                  <Button size="small" onClick={() => setConfirmDelete(false)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Cancelar</Button>
                </Stack>
              : <IconButton size="small" color="error" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /></IconButton>
          )}
        </Stack>
      </Box>

      <Collapse in={open}>
        <Box sx={{ px: 3, pb: 3 }}>
          {msg && (
            <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>
          )}

          {/* Visibility */}
          <Box sx={{ mb: 3, mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <SectionCheckboxes value={data.displaySections} onChange={v => setData(p => ({ ...p, displaySections: v }))} disabled={!editing} />
          </Box>

          {/* Metadata row */}
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.5 }}>Metadados</Typography>
          <Stack spacing={2} sx={{ mt: 1.5, mb: 3 }}>
            <TextField
              label="Título *"
              value={data.title}
              onChange={e => setData(p => ({ ...p, title: e.target.value }))}
              disabled={!editing}
              fullWidth
              size="small"
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                label="Tipo"
                value={data.communicationType}
                onChange={e => setData(p => ({ ...p, communicationType: e.target.value }))}
                disabled={!editing}
                size="small"
                sx={{ minWidth: 150 }}
                SelectProps={{ native: true }}
              >
                {COMM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </TextField>
              <TextField
                select
                label="Categoria"
                value={data.category}
                onChange={e => setData(p => ({ ...p, category: e.target.value }))}
                disabled={!editing}
                size="small"
                sx={{ minWidth: 150 }}
                SelectProps={{ native: true }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </TextField>
              <TextField
                label="Data de Publicação"
                type="date"
                value={toDateInput(data.publishedAt)}
                onChange={e => setData(p => ({ ...p, publishedAt: toISODateTime(e.target.value) }))}
                disabled={!editing}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="Autor"
                value={data.author}
                onChange={e => setData(p => ({ ...p, author: e.target.value }))}
                disabled={!editing}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Slug ID"
                value={data.slugId}
                onChange={e => setData(p => ({ ...p, slugId: e.target.value }))}
                disabled={!editing}
                size="small"
                sx={{ flex: 1 }}
                placeholder="PR-2025-001"
              />
              <TextField
                label="URL do Documento"
                value={data.documentUrl}
                onChange={e => setData(p => ({ ...p, documentUrl: e.target.value }))}
                disabled={!editing}
                size="small"
                sx={{ flex: 2 }}
                InputProps={{ startAdornment: data.documentUrl ? <Link size={14} color="#94a3b8" style={{ marginRight: 6, flexShrink: 0 }} /> : undefined }}
              />
            </Stack>
            {/* File upload */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
              {editing && comm.id && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={13} /> : <Upload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}
                  >
                    {uploading ? 'A carregar...' : 'Upload Ficheiro'}
                  </Button>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                </>
              )}
              {editing && !comm.id && (
                <Typography variant="caption" sx={{ color: '#f59e0b' }}>⚠ Guarde primeiro para fazer upload</Typography>
              )}
            </Stack>
            <TextField
              label="URL da Imagem"
              value={data.imageUrl}
              onChange={e => setData(p => ({ ...p, imageUrl: e.target.value }))}
              disabled={!editing}
              size="small"
              fullWidth
              placeholder="https://..."
            />
            {/* Cover image upload + preview */}
            {(editing || data.imageUrl) && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {editing && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Image size={14} />}
                      onClick={() => setImageLibraryOpen(true)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      Biblioteca
                    </Button>
                  </>
                )}
                {data.imageUrl && (
                  <Box
                    component="img"
                    src={data.imageUrl}
                    sx={{
                      height: 80,
                      maxWidth: 160,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      bgcolor: '#f8fafc',
                    }}
                  />
                )}
              </Box>
            )}
          </Stack>

          <SharedFilePicker
            open={imageLibraryOpen}
            onClose={() => setImageLibraryOpen(false)}
            onSelect={(f) => {
              setData((p) => ({ ...p, imageUrl: f.url }));
              setMsg({ type: 'success', text: 'Imagem seleccionada da biblioteca.' });
            }}
            title="Biblioteca de imagens (Notícias)"
          />

          <Divider sx={{ my: 2 }} />

          {/* Summary */}
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.5 }}>Resumo</Typography>
          <TextField
            value={data.summary}
            onChange={e => setData(p => ({ ...p, summary: e.target.value }))}
            disabled={!editing}
            fullWidth
            multiline
            minRows={3}
            size="small"
            sx={{ mt: 1.5, mb: 3 }}
            placeholder="Breve resumo visível na listagem..."
          />

          <Divider sx={{ my: 2 }} />

          {/* Content HTML */}
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.5 }}>Conteúdo</Typography>
          <Box sx={{ mt: 1.5 }}>
            <RichTextEditor
              value={data.contentHtml}
              onChange={html => setData(p => ({ ...p, contentHtml: html }))}
              disabled={!editing}
              minHeight={220}
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

// ---- New Communication inline form ----
function NewCommunicationForm({
  onSubmit,
  onCancel,
  defaultSections = 'HOME,COMUNICADOS',
}: {
  onSubmit: (c: Communication) => Promise<void>;
  onCancel: () => void;
  defaultSections?: string;
}) {
  const [data, setData] = useState<Communication>(emptyCommunication(defaultSections));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingCover(true);
      const response = await fetch(`${API_BASE}/media-assets/images/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error();
      const payload = await response.json() as { url?: string };
      setData((p) => ({ ...p, imageUrl: payload.url || p.imageUrl }));
    } catch {
      setErr('Erro ao carregar imagem para a biblioteca.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!data.title.trim()) { setErr('O título é obrigatório.'); return; }
    try {
      setSaving(true);
      setErr('');
      await onSubmit(data);
    } catch {
      setErr('Erro ao criar comunicação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Nova Comunicação</Typography>
      <Stack spacing={2}>
        <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} fullWidth size="small" autoFocus />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField select label="Tipo" value={data.communicationType} onChange={e => setData(p => ({ ...p, communicationType: e.target.value }))} size="small" sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
            {COMM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </TextField>
          <TextField select label="Categoria" value={data.category} onChange={e => setData(p => ({ ...p, category: e.target.value }))} size="small" sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </TextField>
          <TextField
            label="Data de Publicação"
            type="date"
            value={toDateInput(data.publishedAt)}
            onChange={e => setData(p => ({ ...p, publishedAt: toISODateTime(e.target.value) }))}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <TextField label="Autor" value={data.author} onChange={e => setData(p => ({ ...p, author: e.target.value }))} size="small" sx={{ flex: 1 }} />
        </Stack>
        <TextField label="Resumo" value={data.summary} onChange={e => setData(p => ({ ...p, summary: e.target.value }))} fullWidth multiline minRows={2} size="small" placeholder="Breve resumo visível na listagem..." />
        <TextField
          label="URL da Imagem"
          value={data.imageUrl}
          onChange={e => setData(p => ({ ...p, imageUrl: e.target.value }))}
          fullWidth
          size="small"
          placeholder="https://..."
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Image size={14} />}
            onClick={() => setImageLibraryOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
          >
            Escolher da Biblioteca
          </Button>
        </Stack>
        {data.imageUrl && (
          <Box
            component="img"
            src={data.imageUrl}
            sx={{
              height: 96,
              maxWidth: 180,
              objectFit: 'cover',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              bgcolor: '#f8fafc',
            }}
          />
        )}
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <SectionCheckboxes value={data.displaySections} onChange={v => setData(p => ({ ...p, displaySections: v }))} />
        </Box>
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={handleSubmit} disabled={saving || !data.title.trim()} startIcon={saving ? <CircularProgress size={14} /> : <Check size={14} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Criar Comunicação
          </Button>
          <Button onClick={onCancel} startIcon={<X size={14} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>

      <SharedFilePicker
        open={imageLibraryOpen}
        onClose={() => setImageLibraryOpen(false)}
        onSelect={(f) => setData((p) => ({ ...p, imageUrl: f.url }))}
        title="Biblioteca de imagens (Notícias)"
      />
    </Paper>
  );
}

// ---- Main Editor ----
export default function ComunicadosEditor({
  sectionFilter,
  pageTitle = 'Comunicados e Mídia',
  pageSlug  = '/ensa/comunicados',
  pageDesc  = 'Gestão de press releases, notas de imprensa e comunicados institucionais.',
  defaultSections = 'HOME,COMUNICADOS',
  pageUrl = '/comunicados',
}: {
  sectionFilter?: string;
  pageTitle?: string;
  pageSlug?: string;
  pageDesc?: string;
  defaultSections?: string;
  pageUrl?: string;
} = {}) {
  const [tab, setTab] = useState(0);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sectionFilter) params.set('section', sectionFilter);
      const res = await fetch(`${API_BASE}/communications?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCommunications(Array.isArray(data) ? data : []);
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar comunicações.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sectionFilter]);

  const COMM_TYPES_LIST = COMM_TYPES;
  const filtered = tab === 0
    ? communications
    : communications.filter(c => c.communicationType === COMM_TYPES_LIST[tab - 1]);

  const handleCreate = async (newComm: Communication) => {
    const res = await fetch(`${API_BASE}/communications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComm),
    });
    if (!res.ok) throw new Error();
    const saved = await res.json();
    setCommunications(prev => [saved, ...prev]);
    setShowNewForm(false);
    setMsg({ type: 'success', text: 'Comunicação criada com sucesso.' });
  };

  const handleSave = async (updated: Communication) => {
    if (!updated.id) return;
    const res = await fetch(`${API_BASE}/communications/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error();
    const saved = await res.json();
    setCommunications(prev => prev.map(c => (c.id === saved.id ? saved : c)));
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/communications/${id}`, { method: 'DELETE' });
    setCommunications(prev => prev.filter(c => c.id !== id));
    setMsg({ type: 'success', text: 'Comunicação removida.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Chip label={pageSlug} size="small" sx={{ fontWeight: 700, bgcolor: '#eef4ff', color: '#164993', mb: 1 }} />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>{pageDesc}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setShowNewForm(v => !v)}
          sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
        >
          Nova Comunicação
        </Button>
      </Stack>
      <PageUrlBanner urls={{ label: pageTitle, path: pageUrl }} />

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      {showNewForm && (
        <NewCommunicationForm defaultSections={defaultSections} onSubmit={handleCreate} onCancel={() => setShowNewForm(false)} />
      )}

      {/* Type filter tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minWidth: 'auto' } }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {['Todos', ...COMM_TYPES].map((label, i) => (
          <Tab
            key={label}
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{label}</span>
                <Chip
                  label={i === 0 ? communications.length : communications.filter(c => c.communicationType === COMM_TYPES[i - 1]).length}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }}
                />
              </Stack>
            }
          />
        ))}
      </Tabs>

      {/* List */}
      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography variant="caption" sx={{ mt: 2, color: '#94a3b8' }}>A carregar comunicações...</Typography>
        </Stack>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px solid #f1f5f9' }}>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Sem comunicações{tab > 0 ? ` do tipo "${COMM_TYPES[tab - 1]}"` : ''}. Clique em "Nova Entrada" para adicionar.
          </Typography>
        </Paper>
      ) : (
        filtered.map(comm => (
          <CommunicationCard
            key={comm.id}
            comm={comm}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))
      )}
    </Box>
  );
}
