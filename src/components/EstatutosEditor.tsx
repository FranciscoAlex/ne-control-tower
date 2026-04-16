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
import { Edit2, Plus, Trash2, Upload, X } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';
import MarkdownRenderer from './MarkdownRenderer';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type Section = {
  id: string;
  title: string;
  content: string;
};

type EstatutosData = {
  lastUpdateLabel: string;
  legalBase: string;
  documentUrl: string;
  documentLabel: string;
  updatedAt: string;
  sections: Section[];
};

const DEFAULTS: EstatutosData = {
  lastUpdateLabel: '11 de Julho de 2024',
  legalBase: 'Lei das Sociedades Comerciais',
  documentUrl: '',
  documentLabel: 'Estatutos Sociais da ENSA',
  updatedAt: '',
  sections: [
    { id: 'natureza', title: 'Natureza e Firma', content: '' },
    { id: 'objecto', title: 'Objecto Social', content: '' },
    { id: 'capital', title: 'Capital Social e Acções', content: '' },
    { id: 'orgaos', title: 'Governança e Órgãos', content: '' },
    { id: 'sede', title: 'Sede e Duração', content: '' },
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

  useEffect(() => { setDraft(section); }, [section, open]);

  return (
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
        <Edit2 size={14} color="#94a3b8" />
      </Stack>
    </Paper>
  );
}
// ─── Main editor ─────────────────────────────────────────────────────────────
export default function EstatutosEditor() {
  const [data, setData] = useState<EstatutosData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const [docPickerOpen, setDocPickerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/estatutos`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((d: EstatutosData) => setData({
        ...DEFAULTS,
        ...d,
        sections: (d.sections || []).map(s => ({ id: s.id, title: s.title, content: s.content })),
      }))
      .catch(() => setData(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSaveSection = async (idx: number, updated: Section) => {
    const newSections = data.sections.map((s, i) => i === idx ? { id: updated.id, title: updated.title, content: updated.content } : s);
    const newData = { ...data, sections: newSections };
    setData(newData);
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/estatutos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      if (!res.ok) throw new Error();
      const saved: EstatutosData = await res.json();
      setData({ ...saved, sections: (saved.sections || []).map(s => ({ id: s.id, title: s.title, content: s.content })) });
      showMsg('success', 'Secção guardada com sucesso.');
    } catch {
      showMsg('error', 'Erro ao guardar a secção.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocument = async (url: string) => {
    const newData = { ...data, documentUrl: url };
    setData(newData);
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/estatutos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      if (!res.ok) throw new Error();
      const saved: EstatutosData = await res.json();
      setData({ ...DEFAULTS, ...saved, sections: (saved.sections || []).map(s => ({ id: s.id, title: s.title, content: s.content })) });
      showMsg('success', 'Documento guardado com sucesso.');
    } catch {
      showMsg('error', 'Erro ao guardar o documento.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = (idx: number) =>
    setData(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== idx) }));

  const addSection = () =>
    setData(prev => ({
      ...prev,
      sections: [...prev.sections, { id: `secao-${prev.sections.length + 1}`, title: '', content: '' }],
    }));

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ pb: 6 }}>
      <PageUrlBanner urls={{ path: '/estatuto', label: 'Governança — Estatuto da ENSA' }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Edite os capítulos e ficheiros de download por secção em{' '}
          <Box component="code" sx={{ fontSize: 12, bgcolor: '#f1f5f9', px: 0.5, borderRadius: 0.5 }}>/ensa/estatuto</Box>.
        </Typography>
      </Box>

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

      {/* Single statute document */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Documento dos Estatutos</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            label="Etiqueta do documento"
            value={data.documentLabel}
            onChange={e => setData(p => ({ ...p, documentLabel: e.target.value }))}
            size="small"
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="URL do ficheiro"
            value={data.documentUrl}
            size="small"
            fullWidth
            InputProps={{ readOnly: true }}
            placeholder="Selecione um ficheiro da Biblioteca"
          />
          <Tooltip title="Selecionar ficheiro da Biblioteca">
            <Button
              variant="outlined"
              startIcon={<Upload size={14} />}
              onClick={() => setDocPickerOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
            >
              Biblioteca
            </Button>
          </Tooltip>
          {data.documentUrl && (
            <Tooltip title="Remover documento">
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleSaveDocument('')}
                sx={{ borderRadius: 2, textTransform: 'none', flexShrink: 0 }}
              >
                Remover
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Paper>

      <SharedFilePicker
        open={docPickerOpen}
        onClose={() => setDocPickerOpen(false)}
        onSelect={f => { setDocPickerOpen(false); handleSaveDocument(f.url); }}
      />

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
          onSave={updated => { handleSaveSection(editIdx, updated); setEditIdx(null); }}
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
