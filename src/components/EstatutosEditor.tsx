import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type Section = {
  id: string;
  title: string;
  content: string;
};

type EstatutosData = {
  lastUpdateLabel: string;
  legalBase: string;
  pdfUrl: string;
  updatedAt: string;
  sections: Section[];
};

const DEFAULTS: EstatutosData = {
  lastUpdateLabel: '11 de Julho de 2024',
  legalBase: 'Lei das Sociedades Comerciais',
  pdfUrl: '',
  updatedAt: '',
  sections: [
    { id: 'natureza', title: 'Natureza e Firma', content: '' },
    { id: 'objecto', title: 'Objecto Social', content: '' },
    { id: 'capital', title: 'Capital Social e Acções', content: '' },
    { id: 'orgaos', title: 'Governança e Órgãos', content: '' },
    { id: 'sede', title: 'Sede e Duração', content: '' },
  ],
};

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

  return (
    <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          cursor: 'pointer',
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
              id: {section.id || '—'}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          size="small"
          color="error"
          onClick={e => { e.stopPropagation(); onDelete(index); }}
        >
          <Trash2 size={15} />
        </IconButton>
      </Box>

      {open && (
        <Box sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

export default function EstatutosEditor() {
  const [data, setData] = useState<EstatutosData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/estatutos`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((d: EstatutosData) => setData(d))
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
      setData(updated);
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
      sections: [...prev.sections, { id: `secao-${prev.sections.length + 1}`, title: '', content: '' }],
    }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      <PageUrlBanner urls={{ path: '/estatuto', label: 'Governança — Estatuto da ENSA' }} />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Edite os capítulos dos estatutos exibidos em{' '}
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
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Última Actualização (label)"
              value={data.lastUpdateLabel}
              onChange={e => setData(p => ({ ...p, lastUpdateLabel: e.target.value }))}
              size="small"
              fullWidth
              helperText='Texto exibido no rodapé de cada capítulo, ex: "11 de Julho de 2024"'
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
          <TextField
            label="URL do PDF dos Estatutos"
            value={data.pdfUrl}
            onChange={e => setData(p => ({ ...p, pdfUrl: e.target.value }))}
            size="small"
            fullWidth
            placeholder="https://... ou deixe vazio para ocultar o botão de download"
          />
        </Stack>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* Sections */}
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
