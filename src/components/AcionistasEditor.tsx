import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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

type Shareholder = {
  id?: number;
  shareholderName: string;
  sharesLabel?: string;
  percentage: number;
  displayColor?: string;
  displayOrder: number;
};

const PRESET_COLORS = ['#164993', '#e63c2e', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#64748b'];

function empty(): Shareholder {
  return { shareholderName: '', sharesLabel: '', percentage: 0, displayColor: '#164993', displayOrder: 0 };
}

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 22, height: 22, borderRadius: '50%', bgcolor: color, cursor: 'pointer', flexShrink: 0,
        border: selected ? '3px solid #1e293b' : '2px solid transparent',
        boxShadow: selected ? `0 0 0 2px ${color}` : 'none',
        transition: 'all .15s',
        '&:hover': { transform: 'scale(1.15)' },
      }}
    />
  );
}

function ShareholderCard({ item, onSave, onDelete }: {
  item: Shareholder;
  onSave: (s: Shareholder) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Shareholder>(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colorRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Box sx={{ width: 6, bgcolor: data.displayColor || '#164993', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Box
            onClick={() => setOpen(v => !v)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
              <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: data.displayColor || '#164993', flexShrink: 0 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.shareholderName || '(sem nome)'}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {data.percentage}% {data.sharesLabel ? `· ${data.sharesLabel}` : ''}
                </Typography>
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
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Nome do Accionista *" value={data.shareholderName} onChange={e => setData(p => ({ ...p, shareholderName: e.target.value }))} disabled={!editing} size="small" fullWidth />
                  <TextField label="Rótulo de Acções" value={data.sharesLabel || ''} onChange={e => setData(p => ({ ...p, sharesLabel: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="Ex: 45.000.000 acções" />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Percentagem (%)" type="number" value={data.percentage} onChange={e => setData(p => ({ ...p, percentage: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 140 }} inputProps={{ min: 0, max: 100, step: 0.01 }} />
                  <TextField label="Ordem de Exibição" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 140 }} />
                </Stack>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1 }}>Cor no Gráfico</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                    {PRESET_COLORS.map(c => (
                      <ColorDot key={c} color={c} selected={data.displayColor === c} onClick={() => { if (editing) setData(p => ({ ...p, displayColor: c })); }} />
                    ))}
                    {editing && (
                      <>
                        <Box component="input" type="color" ref={colorRef} value={data.displayColor || '#164993'} onChange={e => setData(p => ({ ...p, displayColor: e.target.value }))} style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }} />
                        <Button size="small" onClick={() => colorRef.current?.click()} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 11, ml: 1 }}>Cor personalizada</Button>
                      </>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
}

function NewShareholderForm({ onSubmit, onCancel }: { onSubmit: (s: Shareholder) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<Shareholder>(empty());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!data.shareholderName.trim()) { setErr('Nome obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Novo Accionista</Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Nome *" value={data.shareholderName} onChange={e => setData(p => ({ ...p, shareholderName: e.target.value }))} size="small" fullWidth autoFocus />
          <TextField label="%" type="number" value={data.percentage} onChange={e => setData(p => ({ ...p, percentage: Number(e.target.value) }))} size="small" sx={{ minWidth: 100 }} inputProps={{ min: 0, max: 100, step: 0.01 }} />
          <TextField label="Ordem" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} size="small" sx={{ minWidth: 90 }} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Rótulo de Acções" value={data.sharesLabel || ''} onChange={e => setData(p => ({ ...p, sharesLabel: e.target.value }))} size="small" fullWidth placeholder="Ex: 45.000.000 acções" />
          <Stack direction="row" spacing={1} alignItems="center">
            {PRESET_COLORS.map(c => (
              <ColorDot key={c} color={c} selected={data.displayColor === c} onClick={() => setData(p => ({ ...p, displayColor: c }))} />
            ))}
          </Stack>
        </Stack>
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={submit} disabled={saving || !data.shareholderName.trim()} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Criar</Button>
          <Button onClick={onCancel} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function PiePreview({ shareholders }: { shareholders: Shareholder[] }) {
  const total = shareholders.reduce((s, x) => s + (x.percentage || 0), 0);
  return (
    <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', mb: 3 }}>
      <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1.5, display: 'block', mb: 2 }}>Pré-visualização</Typography>
      <Stack spacing={1}>
        {[...shareholders].sort((a, b) => b.percentage - a.percentage).map(s => (
          <Stack key={s.id ?? s.shareholderName} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: s.displayColor || '#164993', flexShrink: 0 }} />
            <Box sx={{ flex: 1, bgcolor: '#f1f5f9', borderRadius: 1, height: 16, overflow: 'hidden' }}>
              <Box sx={{ width: `${Math.min(100, (s.percentage / Math.max(total, 100)) * 100)}%`, bgcolor: s.displayColor || '#164993', height: '100%', borderRadius: 1, opacity: 0.8 }} />
            </Box>
            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right', fontWeight: 700 }}>{s.percentage}%</Typography>
            <Typography variant="caption" sx={{ color: '#64748b', minWidth: 140 }}>{s.shareholderName}</Typography>
          </Stack>
        ))}
        {total !== 100 && <Alert severity={total > 100 ? 'error' : 'warning'} sx={{ borderRadius: 2, py: 0 }}>Total: {total.toFixed(2)}% (deve ser 100%)</Alert>}
      </Stack>
    </Paper>
  );
}

export default function AcionistasEditor() {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE}/shareholder-structure`);
      const d = await r.json();
      setShareholders(Array.isArray(d) ? d.sort((a: Shareholder, b: Shareholder) => a.displayOrder - b.displayOrder) : []);
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (s: Shareholder) => {
    const r = await fetch(`${API_BASE}/shareholder-structure`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setShareholders(p => [...p, saved].sort((a, b) => a.displayOrder - b.displayOrder));
    setShowNew(false);
    setMsg({ type: 'success', text: 'Accionista criado.' });
  };
  const handleSave = async (s: Shareholder) => {
    const r = await fetch(`${API_BASE}/shareholder-structure/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setShareholders(p => p.map(x => x.id === saved.id ? saved : x).sort((a, b) => a.displayOrder - b.displayOrder));
  };
  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/shareholder-structure/${id}`, { method: 'DELETE' });
    setShareholders(p => p.filter(x => x.id !== id));
    setMsg({ type: 'success', text: 'Removido.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Gestão da composição do capital da ENSA — página <em>Estrutura Accionista</em>.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Novo Accionista</Button>
      </Stack>
      <PageUrlBanner urls={{ label: 'Estrutura Accionista', path: '/estrutura-acionista' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}
      {shareholders.length > 0 && <PiePreview shareholders={shareholders} />}
      {showNew && <NewShareholderForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}
      {loading
        ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        : shareholders.length === 0 && !showNew
          ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem accionistas registados.</Typography></Paper>
          : shareholders.map(s => <ShareholderCard key={s.id} item={s} onSave={handleSave} onDelete={handleDelete} />)
      }
    </Box>
  );
}
