import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import { Calendar, Check, ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type Event = {
  id?: number;
  title: string;
  description?: string;
  eventDate: string;
  endDate?: string;
  location?: string;
  eventType: string;
};

const EVENT_TYPES = ['ASSEMBLEIA', 'CONFERENCIA', 'RESULTADOS', 'DIVULGACAO', 'WEBINAR', 'OUTRO'];

const TYPE_COLORS: Record<string, string> = {
  ASSEMBLEIA:   '#164993',
  CONFERENCIA:  '#2563eb',
  RESULTADOS:   '#16a34a',
  DIVULGACAO:   '#ca8a04',
  WEBINAR:      '#9333ea',
  OUTRO:        '#64748b',
};

function empty(): Event {
  const today = new Date().toISOString().split('T')[0];
  return { title: '', description: '', eventDate: today, endDate: '', location: '', eventType: 'OUTRO' };
}

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date();
}

function EventCard({ item, onSave, onDelete }: {
  item: Event;
  onSave: (e: Event) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Event>(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const past = isPast(data.eventDate);
  const color = TYPE_COLORS[data.eventType] || '#64748b';

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden', opacity: past ? 0.7 : 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Box sx={{ width: 6, bgcolor: color, borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Box
            onClick={() => setOpen(v => !v)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
              <Box sx={{ textAlign: 'center', minWidth: 48 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', lineHeight: 1 }}>
                  {new Date(data.eventDate).toLocaleDateString('pt-AO', { month: 'short' }).toUpperCase()}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color, lineHeight: 1.1 }}>
                  {new Date(data.eventDate).getDate()}
                </Typography>
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.title || '(sem título)'}</Typography>
                  <Chip label={data.eventType} size="small" sx={{ height: 18, fontSize: 10, bgcolor: `${color}18`, color, fontWeight: 700, border: 'none' }} />
                  {past && <Chip label="Passado" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f1f5f9', color: '#94a3b8' }} />}
                </Stack>
                {data.location && <Typography variant="caption" sx={{ color: '#64748b' }}>{data.location}</Typography>}
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
                  <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} disabled={!editing} size="small" fullWidth />
                  <TextField label="Tipo" select value={data.eventType} onChange={e => setData(p => ({ ...p, eventType: e.target.value }))} disabled={!editing} size="small" sx={{ minWidth: 160 }}>
                    {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Data de Início" type="date" value={data.eventDate} onChange={e => setData(p => ({ ...p, eventDate: e.target.value }))} disabled={!editing} size="small" InputLabelProps={{ shrink: true }} fullWidth />
                  <TextField label="Data de Fim" type="date" value={data.endDate || ''} onChange={e => setData(p => ({ ...p, endDate: e.target.value }))} disabled={!editing} size="small" InputLabelProps={{ shrink: true }} fullWidth />
                  <TextField label="Local" value={data.location || ''} onChange={e => setData(p => ({ ...p, location: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="Luanda, Angola" />
                </Stack>
                <TextField label="Descrição" value={data.description || ''} onChange={e => setData(p => ({ ...p, description: e.target.value }))} disabled={!editing} size="small" fullWidth multiline minRows={2} />
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
}

function NewEventForm({ onSubmit, onCancel }: { onSubmit: (e: Event) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<Event>(empty());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!data.title.trim()) { setErr('Título obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Novo Evento</Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} size="small" fullWidth autoFocus />
          <TextField label="Tipo" select value={data.eventType} onChange={e => setData(p => ({ ...p, eventType: e.target.value }))} size="small" sx={{ minWidth: 160 }}>
            {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Data" type="date" value={data.eventDate} onChange={e => setData(p => ({ ...p, eventDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="Local" value={data.location || ''} onChange={e => setData(p => ({ ...p, location: e.target.value }))} size="small" fullWidth placeholder="Luanda" />
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

export default function EventosEditor() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE}/events`);
      const d = await r.json();
      setEvents(Array.isArray(d) ? d.sort((a: Event, b: Event) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()) : []);
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: Event) => {
    const r = await fetch(`${API_BASE}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setEvents(p => [saved, ...p].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()));
    setShowNew(false);
    setMsg({ type: 'success', text: 'Evento criado.' });
  };
  const handleSave = async (e: Event) => {
    const r = await fetch(`${API_BASE}/events/${e.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setEvents(p => p.map(x => x.id === saved.id ? saved : x));
  };
  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    setEvents(p => p.filter(x => x.id !== id));
    setMsg({ type: 'success', text: 'Removido.' });
  };

  const now = new Date();
  const shown = events.filter(e => {
    if (filter === 'UPCOMING') return new Date(e.eventDate) >= now;
    if (filter === 'PAST') return new Date(e.eventDate) < now;
    return true;
  });

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Gestão de eventos institucionais — assembleias, conferências, resultados.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Novo Evento</Button>
      </Stack>
      <PageUrlBanner urls={{ label: 'Calendário de Eventos', path: '/calendario-divulgacoes' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {(['ALL', 'UPCOMING', 'PAST'] as const).map(f => (
          <Chip
            key={f}
            icon={<Calendar size={13} />}
            label={{ ALL: 'Todos', UPCOMING: 'Próximos', PAST: 'Passados' }[f]}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'filled' : 'outlined'}
            sx={{ fontWeight: filter === f ? 700 : 400, bgcolor: filter === f ? '#164993' : 'transparent', color: filter === f ? 'white' : undefined }}
          />
        ))}
        <Typography variant="caption" sx={{ color: '#94a3b8', alignSelf: 'center', ml: 1 }}>{shown.length} evento(s)</Typography>
      </Stack>

      {showNew && <NewEventForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}
      {loading
        ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        : shown.length === 0
          ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem eventos.</Typography></Paper>
          : shown.map(e => <EventCard key={e.id} item={e} onSave={handleSave} onDelete={handleDelete} />)
      }
    </Box>
  );
}
