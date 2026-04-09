import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PageUrlBanner from './PageUrlBanner';
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type BusinessIndicator = {
  id?: number;
  title: string;
  indicatorValue: string;
  numericValue: number | null;
  periodYear: number;
  periodQuarter: number | null;
  category: string;
  unit: string;
};

const CATEGORIES = ['Financeiro', 'Operacional', 'Seguros', 'Capital', 'Rendibilidade', 'Solvência', 'Outro'];

function empty(): BusinessIndicator {
  return {
    title: '',
    indicatorValue: '',
    numericValue: null,
    periodYear: new Date().getFullYear(),
    periodQuarter: null,
    category: 'Financeiro',
    unit: '%',
  };
}

function IndicatorCard({ item, onSave, onDelete }: {
  item: BusinessIndicator;
  onSave: (i: BusinessIndicator) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<BusinessIndicator>(item);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { setData(item); }, [item]);

  const startEdit = () => { setEditing(true); setConfirmDelete(false); };
  const cancelEdit = () => { setEditing(false); setData(item); setShowExtra(false); setMsg(null); };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(data);
      setEditing(false);
      setShowExtra(false);
      setMsg({ type: 'success', text: 'Guardado.' });
      setTimeout(() => setMsg(null), 2500);
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<BusinessIndicator>) => setData(p => ({ ...p, ...patch }));

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: editing ? '1.5px solid #164993' : '1px solid #e2e8f0',
        mb: 1.5,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        '&:hover .kpi-edit-btn': { opacity: 1 },
      }}
    >
      {/* ── Read view ── */}
      {!editing && (
        <Box
          onClick={startEdit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2.5,
            py: 1.75,
            cursor: 'pointer',
            gap: 2,
            '&:hover': { bgcolor: '#f8fafc' },
          }}
        >
          {/* Value badge */}
          <Box sx={{
            minWidth: 72,
            textAlign: 'center',
            bgcolor: alpha('#164993', 0.08),
            borderRadius: 2,
            px: 1.5,
            py: 0.75,
            flexShrink: 0,
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#164993', lineHeight: 1 }}>
              {data.indicatorValue || '—'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
              {data.unit}
            </Typography>
          </Box>

          {/* Title + meta */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }} noWrap>
              {data.title || '(sem título)'}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 0.4, flexWrap: 'wrap' }}>
              <Chip label={data.category} size="small" sx={{ height: 18, fontSize: '0.63rem', fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569' }} />
              <Chip label={`${data.periodYear}${data.periodQuarter ? ` Q${data.periodQuarter}` : ''}`} size="small" sx={{ height: 18, fontSize: '0.63rem', fontWeight: 600, bgcolor: '#f0fdf4', color: '#166534' }} />
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={0.5} onClick={e => e.stopPropagation()} sx={{ flexShrink: 0 }}>
            <Tooltip title="Editar">
              <IconButton className="kpi-edit-btn" size="small" onClick={startEdit}
                sx={{ opacity: 0, transition: 'opacity 0.15s', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            {item.id && !confirmDelete && (
              <Tooltip title="Eliminar">
                <IconButton size="small" color="error" onClick={() => setConfirmDelete(true)}
                  sx={{ bgcolor: alpha('#ef4444', 0.08), '&:hover': { bgcolor: alpha('#ef4444', 0.18) } }}>
                  <Trash2 size={14} />
                </IconButton>
              </Tooltip>
            )}
            {confirmDelete && (
              <>
                <Button size="small" color="error" variant="contained" onClick={() => onDelete(item.id!)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, height: 30 }}>Eliminar</Button>
                <Button size="small" onClick={() => setConfirmDelete(false)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, height: 30 }}>Cancelar</Button>
              </>
            )}
          </Stack>
        </Box>
      )}

      {/* ── Edit form (inline) ── */}
      {editing && (
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Título *"
                value={data.title}
                onChange={e => set({ title: e.target.value })}
                size="small"
                fullWidth
                autoFocus
              />
              <TextField
                label="Valor"
                value={data.indicatorValue}
                onChange={e => set({ indicatorValue: e.target.value })}
                size="small"
                sx={{ minWidth: 120 }}
                placeholder="ex: 18.4%"
              />
              <TextField
                label="Unidade"
                value={data.unit}
                onChange={e => set({ unit: e.target.value })}
                size="small"
                sx={{ minWidth: 90 }}
                placeholder="%, AOA…"
              />
            </Stack>

            {/* Extra fields toggle */}
            <Box>
              <Button
                size="small"
                onClick={() => setShowExtra(v => !v)}
                endIcon={showExtra ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                sx={{ textTransform: 'none', color: '#64748b', fontSize: 12, px: 0 }}
              >
                {showExtra ? 'Ocultar detalhes' : 'Mais detalhes'}
              </Button>
              <Collapse in={showExtra}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
                  <TextField
                    select
                    label="Categoria"
                    value={data.category}
                    onChange={e => set({ category: e.target.value })}
                    size="small"
                    sx={{ minWidth: 150 }}
                    SelectProps={{ native: true }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </TextField>
                  <TextField
                    label="Ano"
                    type="number"
                    value={data.periodYear}
                    onChange={e => set({ periodYear: Number(e.target.value) })}
                    size="small"
                    sx={{ minWidth: 100 }}
                  />
                  <TextField
                    label="Trimestre (1–4)"
                    type="number"
                    value={data.periodQuarter ?? ''}
                    onChange={e => set({ periodQuarter: e.target.value === '' ? null : Math.min(4, Math.max(1, Number(e.target.value))) })}
                    size="small"
                    sx={{ minWidth: 130 }}
                    placeholder="Opcional"
                    inputProps={{ min: 1, max: 4 }}
                  />
                  <TextField
                    label="Valor numérico"
                    type="number"
                    value={data.numericValue ?? ''}
                    onChange={e => set({ numericValue: e.target.value === '' ? null : Number(e.target.value) })}
                    size="small"
                    sx={{ minWidth: 140 }}
                    placeholder="Opcional"
                  />
                </Stack>
              </Collapse>
            </Box>

            {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ borderRadius: 2, py: 0 }}>{msg.text}</Alert>}

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving || !data.title.trim()}
                startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <Check size={13} />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                {saving ? 'A guardar…' : 'Guardar'}
              </Button>
              <Button
                size="small"
                onClick={cancelEdit}
                startIcon={<X size={13} />}
                sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}
              >
                Cancelar
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* Success flash on read view */}
      {!editing && msg?.type === 'success' && (
        <Box sx={{ px: 2.5, pb: 1.25 }}>
          <Alert severity="success" onClose={() => setMsg(null)} sx={{ borderRadius: 2, py: 0 }}>{msg.text}</Alert>
        </Box>
      )}
    </Paper>
  );
}

function NewIndicatorForm({ onSubmit, onCancel }: { onSubmit: (i: BusinessIndicator) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<BusinessIndicator>(empty());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!data.title.trim()) { setErr('Título obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Novo Indicador de Negócio</Typography>
      <Stack spacing={2}>
        <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} size="small" fullWidth autoFocus />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Valor" value={data.indicatorValue} onChange={e => setData(p => ({ ...p, indicatorValue: e.target.value }))} size="small" fullWidth />
          <TextField label="Unidade" value={data.unit} onChange={e => setData(p => ({ ...p, unit: e.target.value }))} size="small" sx={{ minWidth: 100 }} />
          <TextField select label="Categoria" value={data.category} onChange={e => setData(p => ({ ...p, category: e.target.value }))} size="small" sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </TextField>
          <TextField label="Ano" type="number" value={data.periodYear} onChange={e => setData(p => ({ ...p, periodYear: Number(e.target.value) }))} size="small" sx={{ minWidth: 110 }} />
        </Stack>
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={submit} disabled={saving || !data.title.trim()} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Criar</Button>
          <Button onClick={onCancel} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function BusinessIndicatorsEditor() {
  const [indicators, setIndicators] = useState<BusinessIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    try { setLoading(true); const r = await fetch(`${API_BASE}/business-indicators`); const d = await r.json(); setIndicators(Array.isArray(d) ? d : []); }
    catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (i: BusinessIndicator) => {
    const r = await fetch(`${API_BASE}/business-indicators`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(i) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setIndicators(p => [saved, ...p]);
    setShowNew(false);
    setMsg({ type: 'success', text: 'Criado.' });
  };
  const handleSave = async (i: BusinessIndicator) => {
    const r = await fetch(`${API_BASE}/business-indicators/${i.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(i) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setIndicators(p => p.map(x => x.id === saved.id ? saved : x));
  };
  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/business-indicators/${id}`, { method: 'DELETE' });
    setIndicators(p => p.filter(x => x.id !== id));
    setMsg({ type: 'success', text: 'Removido.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>KPIs operacionais e financeiros publicados no portal de investidores.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Novo Indicador</Button>
      </Stack>
      <PageUrlBanner urls={{ label: 'Dashboard Financeiro', path: '/dashboard-financeiro' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}
      {showNew && <NewIndicatorForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}
      {loading
        ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        : indicators.length === 0
          ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem indicadores. Clique em "Novo Indicador" para adicionar.</Typography></Paper>
          : indicators.map(i => <IndicatorCard key={i.id} item={i} onSave={handleSave} onDelete={handleDelete} />)
      }
    </Box>
  );
}
