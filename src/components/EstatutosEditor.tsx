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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Edit2, FileText, Link2, Paperclip, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';

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

// ─── Edit dialog ──────────────────────────────────────────────────────────────
function SectionDialog({
  section,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  section: Section;
  open: boolean;
  onClose: () => void;
  onSave: (updated: Section) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<Section>(section);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => { setDraft(section); }, [section, open]);

  const updateFile = (fi: number, field: keyof SectionFile, value: string) =>
    setDraft(d => ({ ...d, files: d.files.map((f, i) => i === fi ? { ...f, [field]: value } : f) }));

  const removeFile = (fi: number) =>
    setDraft(d => ({ ...d, files: d.files.filter((_, i) => i !== fi) }));

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {draft.title || 'Novo Capítulo'}
          </Typography>
          <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="ID (slug)"
                value={draft.id}
                onChange={e => setDraft(d => ({ ...d, id: e.target.value }))}
                size="small"
                sx={{ minWidth: 140 }}
                helperText="Identificador único, sem espaços"
              />
              <TextField
                label="Título da Secção"
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                size="small"
                fullWidth
              />
            </Stack>
            <TextField
              label="Conteúdo"
              value={draft.content}
              onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
              multiline
              minRows={4}
              fullWidth
              size="small"
            />

            <Divider />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Ficheiros ({draft.files?.length || 0})
              </Typography>
              <Tooltip title="Selecionar ficheiro da Biblioteca">
                <Button
                  size="small" variant="outlined"
                  startIcon={<Upload size={13} />}
                  onClick={() => setPickerOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Biblioteca
                </Button>
              </Tooltip>
            </Stack>

            {(draft.files?.length || 0) === 0 ? (
              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                Nenhum ficheiro. Clique em "Biblioteca" para adicionar.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {draft.files.map((file, fi) => (
                  <Paper key={fi} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Link2 size={14} color="#475569" />
                      <TextField
                        size="small" label="Etiqueta" value={file.label}
                        onChange={e => updateFile(fi, 'label', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small" label="URL" value={file.url}
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
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            size="small" color="error" startIcon={<Trash2 size={14} />}
            onClick={() => { onDelete(); onClose(); }}
            sx={{ textTransform: 'none' }}
          >
            Eliminar
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancelar</Button>
            <Button variant="contained" onClick={() => { onSave(draft); onClose(); }} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Guardar
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <SharedFilePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={f => setDraft(d => ({ ...d, files: [...(d.files || []), { label: f.name, url: f.url }] }))}
      />
    </>
  );
}

// ─── Small card ───────────────────────────────────────────────────────────────
function SectionCard({
  section,
  index,
  onEdit,
}: {
  section: Section;
  index: number;
  onEdit: () => void;
}) {
  return (
    <Paper
      onClick={onEdit}
      sx={{
        p: 2, borderRadius: 3, border: '1px solid #e2e8f0', cursor: 'pointer',
        transition: 'all .15s',
        '&:hover': { borderColor: '#93c5fd', boxShadow: '0 4px 12px rgba(59,130,246,0.12)', transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Chip
          label={index + 1} size="small"
          sx={{ minWidth: 28, bgcolor: '#eef4ff', color: '#164993', fontWeight: 800, borderRadius: 1, flexShrink: 0 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }} noWrap>
            {section.title || '(sem título)'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            id: {section.id || '—'}
          </Typography>
        </Box>
        {(section.files?.length || 0) > 0 && (
          <Tooltip title={`${section.files.length} ficheiro(s)`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
              <Paperclip size={13} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{section.files.length}</Typography>
            </Box>
          </Tooltip>
        )}
        <Edit2 size={14} color="#94a3b8" />
      </Stack>
    </Paper>
  );
}
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
// ─── Main editor ─────────────────────────────────────────────────────────────
export default function EstatutosEditor() {
  const [data, setData] = useState<EstatutosData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);

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
          onClick={() => {
            const newIdx = data.sections.length;
            addSection();
            // open dialog for the new item after state update
            setTimeout(() => setEditIdx(newIdx), 0);
          }}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Novo Capítulo
        </Button>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        {data.sections.map((section, idx) => (
          <SectionCard
            key={idx}
            section={section}
            index={idx}
            onEdit={() => setEditIdx(idx)}
          />
        ))}
        {data.sections.length === 0 && (
          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', gridColumn: '1/-1' }}>
            Sem capítulos. Clique em "Novo Capítulo" para adicionar.
          </Typography>
        )}
      </Box>

      {editIdx !== null && data.sections[editIdx] && (
        <SectionDialog
          section={data.sections[editIdx]}
          open={editIdx !== null}
          onClose={() => setEditIdx(null)}
          onSave={updated => updateSection(editIdx, updated)}
          onDelete={() => { deleteSection(editIdx); setEditIdx(null); }}
        />
      )}

      {data.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Última gravação: {data.updatedAt}
        </Typography>
      )}
    </Box>
  );
}
