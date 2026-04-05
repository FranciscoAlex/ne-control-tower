import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import { Check, ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

// --- Types ---
type FoundationItem = { id: string; title: string; content: string; color: string };
type PillarItem = { id: string; title: string; description: string };
type StatItem = { id: string; value: string; label: string };
type ModernizationItem = { id: string; title: string; description: string; accentColor: string };

type PlanoData = {
  updatedAt: string;
  pdfUrl: string;
  pdfLabel: string;
  pdfTotalPages: number;
  foundation: FoundationItem[];
  pillars: PillarItem[];
  commitmentTitle: string;
  commitmentText: string;
  commitmentStats: StatItem[];
  modernizationItems: ModernizationItem[];
};

const DEFAULTS: PlanoData = {
  updatedAt: '',
  pdfUrl: '',
  pdfLabel: 'Descarregar Plano Estratégico',
  pdfTotalPages: 10,
  foundation: [],
  pillars: [],
  commitmentTitle: 'Compromisso com o Futuro',
  commitmentText: '',
  commitmentStats: [],
  modernizationItems: [],
};

// ---- Collapsible card wrapper ----
function SectionCard({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
          {badge !== undefined && (
            <Chip label={badge} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }} />
          )}
        </Stack>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 3, pb: 3, pt: 1 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
}

// ---- Foundation tab ----
function FoundationTab({ items, onChange }: { items: FoundationItem[]; onChange: (v: FoundationItem[]) => void }) {
  const update = (idx: number, patch: Partial<FoundationItem>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () =>
    onChange([...items, { id: `foundation-${Date.now()}`, title: '', content: '', color: '#164993' }]);

  return (
    <Box>
      {items.map((it, idx) => (
        <Paper
          key={it.id}
          elevation={0}
          sx={{ p: 2.5, mb: 2, border: '1px solid #e2e8f0', borderLeft: `4px solid ${it.color || '#164993'}`, borderRadius: 2 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Card #{idx + 1}</Typography>
            <IconButton size="small" color="error" onClick={() => remove(idx)}><Trash2 size={14} /></IconButton>
          </Stack>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Título"
                value={it.title}
                onChange={e => update(idx, { title: e.target.value })}
                size="small"
                fullWidth
                placeholder='ex: "Missão"'
              />
              <TextField
                label="Cor (hex)"
                value={it.color}
                onChange={e => update(idx, { color: e.target.value })}
                size="small"
                sx={{ maxWidth: 130 }}
                placeholder="#164993"
              />
            </Stack>
            <TextField
              label="Conteúdo"
              value={it.content}
              onChange={e => update(idx, { content: e.target.value })}
              size="small"
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </Paper>
      ))}
      <Button
        startIcon={<Plus size={14} />}
        variant="outlined"
        size="small"
        onClick={add}
        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
      >
        Adicionar Card
      </Button>
    </Box>
  );
}

// ---- Pillars tab ----
function PillarsTab({ items, onChange }: { items: PillarItem[]; onChange: (v: PillarItem[]) => void }) {
  const update = (idx: number, patch: Partial<PillarItem>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () =>
    onChange([...items, { id: `pilar-${Date.now()}`, title: '', description: '' }]);

  return (
    <Box>
      {items.map((it, idx) => (
        <Paper
          key={it.id}
          elevation={0}
          sx={{ p: 2.5, mb: 2, border: '1px solid #e2e8f0', borderLeft: '4px solid #6366f1', borderRadius: 2 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Pilar #{idx + 1}</Typography>
            <IconButton size="small" color="error" onClick={() => remove(idx)}><Trash2 size={14} /></IconButton>
          </Stack>
          <Stack spacing={1.5}>
            <TextField
              label="Título do Pilar"
              value={it.title}
              onChange={e => update(idx, { title: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Descrição"
              value={it.description}
              onChange={e => update(idx, { description: e.target.value })}
              size="small"
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </Paper>
      ))}
      <Button
        startIcon={<Plus size={14} />}
        variant="outlined"
        size="small"
        onClick={add}
        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
      >
        Adicionar Pilar
      </Button>
    </Box>
  );
}

// ---- Commitment tab ----
function CommitmentTab({
  data,
  onChange,
}: {
  data: Pick<PlanoData, 'commitmentTitle' | 'commitmentText' | 'commitmentStats' | 'modernizationItems'>;
  onChange: (patch: Partial<PlanoData>) => void;
}) {
  const updateStat = (idx: number, patch: Partial<StatItem>) =>
    onChange({ commitmentStats: data.commitmentStats.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  const removeStat = (idx: number) =>
    onChange({ commitmentStats: data.commitmentStats.filter((_, i) => i !== idx) });
  const addStat = () =>
    onChange({ commitmentStats: [...data.commitmentStats, { id: `stat-${Date.now()}`, value: '', label: '' }] });

  const updateMod = (idx: number, patch: Partial<ModernizationItem>) =>
    onChange({ modernizationItems: data.modernizationItems.map((m, i) => (i === idx ? { ...m, ...patch } : m)) });
  const removeMod = (idx: number) =>
    onChange({ modernizationItems: data.modernizationItems.filter((_, i) => i !== idx) });
  const addMod = () =>
    onChange({
      modernizationItems: [
        ...data.modernizationItems,
        { id: `mod-${Date.now()}`, title: '', description: '', accentColor: '#164993' },
      ],
    });

  return (
    <Box>
      {/* Commitment text */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Secção "Compromisso com o Futuro"</Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Título da secção"
            value={data.commitmentTitle}
            onChange={e => onChange({ commitmentTitle: e.target.value })}
            size="small"
            fullWidth
          />
          <TextField
            label="Texto"
            value={data.commitmentText}
            onChange={e => onChange({ commitmentText: e.target.value })}
            size="small"
            fullWidth
            multiline
            minRows={3}
          />
        </Stack>
      </Paper>

      {/* Stats */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Estatísticas em Destaque</Typography>
          <Button size="small" startIcon={<Plus size={13} />} onClick={addStat} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Adicionar</Button>
        </Stack>
        {data.commitmentStats.map((s, idx) => (
          <Stack key={s.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
            <TextField label="Valor" value={s.value} onChange={e => updateStat(idx, { value: e.target.value })} size="small" sx={{ maxWidth: 120 }} placeholder='ex: "+46"' />
            <TextField label="Etiqueta" value={s.label} onChange={e => updateStat(idx, { label: e.target.value })} size="small" fullWidth placeholder='ex: "Anos de História"' />
            <IconButton size="small" color="error" onClick={() => removeStat(idx)}><Trash2 size={14} /></IconButton>
          </Stack>
        ))}
        {data.commitmentStats.length === 0 && (
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Sem estatísticas.</Typography>
        )}
      </Paper>

      {/* Modernization items */}
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Itens de Modernização</Typography>
          <Button size="small" startIcon={<Plus size={13} />} onClick={addMod} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Adicionar</Button>
        </Stack>
        {data.modernizationItems.map((m, idx) => (
          <Paper
            key={m.id}
            elevation={0}
            sx={{ p: 2, mb: 1.5, border: '1px solid #e2e8f0', borderLeft: `4px solid ${m.accentColor || '#164993'}`, borderRadius: 2 }}
          >
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
              <IconButton size="small" color="error" onClick={() => removeMod(idx)}><Trash2 size={14} /></IconButton>
            </Stack>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField label="Título" value={m.title} onChange={e => updateMod(idx, { title: e.target.value })} size="small" fullWidth />
                <TextField label="Cor Destaque (hex)" value={m.accentColor} onChange={e => updateMod(idx, { accentColor: e.target.value })} size="small" sx={{ maxWidth: 150 }} placeholder="#164993" />
              </Stack>
              <TextField label="Descrição" value={m.description} onChange={e => updateMod(idx, { description: e.target.value })} size="small" fullWidth multiline minRows={2} />
            </Stack>
          </Paper>
        ))}
        {data.modernizationItems.length === 0 && (
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Sem itens.</Typography>
        )}
      </Paper>
    </Box>
  );
}

// ---- Main Editor ----
export default function PlanoEstrategicoEditor() {
  const [data, setData] = useState<PlanoData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/plano-estrategico`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: PlanoData) => setData(d))
      .catch(() => setData(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/plano-estrategico`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated: PlanoData = await res.json();
      setData(updated);
      setMsg({ type: 'success', text: 'Conteúdo guardado com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 12 }}><CircularProgress /></Stack>;
  }

  return (
    <Box sx={{ pb: 6 }}>
      <PageUrlBanner urls={{ path: '/ensa/plano-estrategico', label: 'Sobre — Plano Estratégico' }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Gerir o conteúdo da página <code>/ensa/plano-estrategico</code>: missão/visão, pilares, PDF e secção de compromisso.
        </Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check size={14} />}
          disabled={saving}
          onClick={handleSave}
          sx={{ borderRadius: 0, fontWeight: 700, textTransform: 'none', px: 3 }}
        >
          {saving ? 'A guardar…' : 'Guardar Tudo'}
        </Button>
      </Stack>

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}
      >
        <Tab label="📄 PDF do Plano" />
        <Tab label={`🏛 Fundação (${data.foundation.length})`} />
        <Tab label={`🎯 Pilares Estratégicos (${data.pillars.length})`} />
        <Tab label="💡 Compromisso" />
      </Tabs>

      {/* Tab 0 — PDF */}
      {tab === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Documento PDF do Plano Estratégico</Typography>
          <Stack spacing={2}>
            <TextField
              label="URL do PDF"
              value={data.pdfUrl}
              onChange={e => setData(p => ({ ...p, pdfUrl: e.target.value }))}
              size="small"
              fullWidth
              placeholder="https://... (deixe vazio para ocultar o botão de download)"
              helperText="Pode usar o URL de um ficheiro enviado via upload no servidor, ou um link externo."
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Texto do Botão de Download"
                value={data.pdfLabel}
                onChange={e => setData(p => ({ ...p, pdfLabel: e.target.value }))}
                size="small"
                fullWidth
                placeholder='ex: "Descarregar Plano Estratégico 2026-2028"'
              />
              <TextField
                label="Nº Total de Páginas (visualizador)"
                type="number"
                value={data.pdfTotalPages}
                onChange={e => setData(p => ({ ...p, pdfTotalPages: Math.max(1, Number(e.target.value)) }))}
                size="small"
                sx={{ maxWidth: 200 }}
                helperText="Usado no visualizador slide-a-slide."
              />
            </Stack>
            {data.pdfUrl && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label="Pré-visualizar PDF"
                  component="a"
                  href={data.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {/* Tab 1 — Foundation */}
      {tab === 1 && (
        <SectionCard title="Cards de Fundação (Missão, Visão, Valores)" badge={data.foundation.length}>
          <FoundationTab
            items={data.foundation}
            onChange={foundation => setData(p => ({ ...p, foundation }))}
          />
        </SectionCard>
      )}

      {/* Tab 2 — Pillars */}
      {tab === 2 && (
        <SectionCard title="Pilares Estratégicos" badge={data.pillars.length}>
          <PillarsTab
            items={data.pillars}
            onChange={pillars => setData(p => ({ ...p, pillars }))}
          />
        </SectionCard>
      )}

      {/* Tab 3 — Commitment */}
      {tab === 3 && (
        <CommitmentTab
          data={{
            commitmentTitle: data.commitmentTitle,
            commitmentText: data.commitmentText,
            commitmentStats: data.commitmentStats,
            modernizationItems: data.modernizationItems,
          }}
          onChange={patch => setData(p => ({ ...p, ...patch }))}
        />
      )}

      <Divider sx={{ my: 3 }} />
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check size={14} />}
          disabled={saving}
          onClick={handleSave}
          sx={{ borderRadius: 0, fontWeight: 700, textTransform: 'none', px: 4 }}
        >
          {saving ? 'A guardar…' : 'Guardar Tudo'}
        </Button>
      </Stack>
    </Box>
  );
}
