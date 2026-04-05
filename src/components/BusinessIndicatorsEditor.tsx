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
  Typography,
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import { Check, ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';

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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<BusinessIndicator>(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
      <Box onClick={() => setOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.title || '(sem título)'}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.3, flexWrap: 'wrap' }}>
              <Chip label={`${data.indicatorValue || '—'} ${data.unit || ''}`} size="small" sx={{ height: 18, fontWeight: 700, fontSize: '0.65rem', bgcolor: '#eef4ff', color: '#164993' }} />
              <Chip label={data.category} size="small" sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#475569' }} />
              <Chip label={`${data.periodYear}${data.periodQuarter ? ` Q${data.periodQuarter}` : ''}`} size="small" sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#166534' }} />
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} onClick={e => e.stopPropagation()}>
          {editing
            ? <><Button size="small" variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Guardar</Button>
                <Button size="small" onClick={() => { setEditing(false); setData(item); }} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Cancelar</Button></>
            : <Button size="small" onClick={() => { setOpen(true); setEditing(true); }} startIcon={<Pencil size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Editar</Button>}
          {item.id && (confirmDelete
            ? <><Button size="small" color="error" variant="contained" onClick={() => onDelete(item.id!)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Confirmar</Button>
                <Button size="small" onClick={() => setConfirmDelete(false)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Cancelar</Button></>
            : <IconButton size="small" color="error" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /></IconButton>
          )}
        </Stack>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 3, pb: 3 }}>
          {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Título do Indicador *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} disabled={!editing} size="small" fullWidth />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Valor (texto)" value={data.indicatorValue} onChange={e => setData(p => ({ ...p, indicatorValue: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="ex: 18.4%" />
              <TextField label="Valor Numérico" type="number" value={data.numericValue ?? ''} onChange={e => setData(p => ({ ...p, numericValue: e.target.value === '' ? null : Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 140 }} />
              <TextField label="Unidade" value={data.unit} onChange={e => setData(p => ({ ...p, unit: e.target.value }))} disabled={!editing} size="small" sx={{ minWidth: 100 }} placeholder="%, AOA, M USD" />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField select label="Categoria" value={data.category} onChange={e => setData(p => ({ ...p, category: e.target.value }))} disabled={!editing} size="small" sx={{ minWidth: 160 }} SelectProps={{ native: true }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </TextField>
              <TextField label="Ano" type="number" value={data.periodYear} onChange={e => setData(p => ({ ...p, periodYear: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 110 }} />
              <TextField label="Trimestre (1-4)" type="number" value={data.periodQuarter ?? ''} onChange={e => setData(p => ({ ...p, periodQuarter: e.target.value === '' ? null : Math.min(4, Math.max(1, Number(e.target.value))) }))} disabled={!editing} size="small" sx={{ minWidth: 130 }} placeholder="Opcional" inputProps={{ min: 1, max: 4 }} />
            </Stack>
          </Stack>
        </Box>
      </Collapse>
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
