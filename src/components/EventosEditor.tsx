import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import { Calendar, Check, CheckSquare, ChevronDown, ChevronRight, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react';

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

function EventCard({ item, onSave, onDelete, selectMode, selected, onToggleSelect }: {
  item: Event;
  onSave: (e: Event) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
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
          onClick={() => { if (selectMode && item.id) { onToggleSelect?.(item.id); } else { setOpen(v => !v); } }}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: selected ? '#eff6ff' : open ? '#f8fafc' : 'white', '&:hover': { bgcolor: selected ? '#dbeafe' : '#f8fafc' }, outline: selected ? '2px solid #3b82f6' : 'none', outlineOffset: -2 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              {selectMode && item.id ? (
                <Checkbox
                  checked={!!selected}
                  onChange={() => onToggleSelect?.(item.id!)}
                  onClick={e => e.stopPropagation()}
                  size="small"
                  sx={{ p: 0.5 }}
                />
              ) : (
                <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
              )}
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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Eliminar ${selectedIds.size} evento(s) selecionado(s)?`)) return;
    try {
      setBulkDeleting(true);
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' })
        )
      );
      setEvents(p => p.filter(x => !selectedIds.has(x.id!)));
      setMsg({ type: 'success', text: `${selectedIds.size} evento(s) eliminado(s).` });
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch {
      setMsg({ type: 'error', text: 'Erro ao eliminar.' });
    } finally {
      setBulkDeleting(false);
    }
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
        <Stack direction="row" spacing={1}>
          <Button
            variant={selectMode ? 'contained' : 'outlined'}
            color={selectMode ? 'warning' : 'inherit'}
            startIcon={selectMode ? <X size={16} /> : <ListChecks size={16} />}
            onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()); }}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
          >
            {selectMode ? 'Cancelar Seleção' : 'Selecionar'}
          </Button>
          {!selectMode && (
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Novo Evento</Button>
          )}
        </Stack>
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
          : shown.map(e => <EventCard key={e.id} item={e} onSave={handleSave} onDelete={handleDelete} selectMode={selectMode} selected={selectedIds.has(e.id!)} onToggleSelect={toggleSelect} />)
      }

      {/* Bulk-select floating action bar */}
      {selectMode && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: 4,
            px: 3,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 1300,
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            minWidth: 380,
          }}
        >
          <CheckSquare size={18} color="#3b82f6" />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', flex: 1 }}>
            {selectedIds.size} selecionado(s)
          </Typography>
          <Button
            size="small"
            onClick={() => setSelectedIds(new Set(shown.filter(e => e.id).map(e => e.id!)))}
            disabled={selectedIds.size === shown.filter(e => e.id).length}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 12 }}
          >
            Todos
          </Button>
          <Button
            size="small"
            onClick={() => setSelectedIds(new Set())}
            disabled={selectedIds.size === 0}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 12 }}
          >
            Limpar
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            disabled={selectedIds.size === 0 || bulkDeleting}
            onClick={handleBulkDelete}
            startIcon={bulkDeleting ? <CircularProgress size={13} color="inherit" /> : <Trash2 size={14} />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Eliminar{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
          </Button>
        </Paper>
      )}
    </Box>
  );
}
