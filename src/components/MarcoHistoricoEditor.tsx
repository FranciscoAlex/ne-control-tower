import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import RichTextEditor from './RichTextEditor';
import SharedFilePicker from './SharedFilePicker';
import { Check, ChevronDown, ChevronRight, Image, Pencil, Plus, Trash2, X } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type Milestone = {
  id?: number;
  title: string;
  description: string;
  milestoneYear: number;
  displayOrder: number;
  imageUrl: string;
  contentHtml: string;
  eventTitle: string;
};

function empty(): Milestone {
  return {
    title: '',
    description: '',
    milestoneYear: new Date().getFullYear(),
    displayOrder: 0,
    imageUrl: '',
    contentHtml: '',
    eventTitle: '',
  };
}

function MilestoneCard({ item, onSave, onDelete }: {
  item: Milestone;
  onSave: (m: Milestone) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Milestone>(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
      {/* Timeline stub on left */}
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Box sx={{ width: 6, bgcolor: '#164993', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Box onClick={() => setOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#164993', minWidth: 50 }}>{data.milestoneYear}</Typography>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.title || '(sem título)'}</Typography>
                  {data.eventTitle && <Typography variant="caption" sx={{ color: '#64748b' }}>{data.eventTitle}</Typography>}
                </Box>
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
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} disabled={!editing} size="small" fullWidth />
                  <TextField label="Título do Evento" value={data.eventTitle} onChange={e => setData(p => ({ ...p, eventTitle: e.target.value }))} disabled={!editing} size="small" fullWidth />
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField label="Ano" type="number" value={data.milestoneYear} onChange={e => setData(p => ({ ...p, milestoneYear: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 110 }} />
                  <TextField label="Ordem de Exibição" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 130 }} />
                </Stack>
                {/* Image picker row */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>Imagem do Card</Typography>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                    {data.imageUrl && (
                      <Box sx={{ width: 140, height: 84, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <img src={data.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    )}
                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <TextField
                        label="URL da Imagem"
                        value={data.imageUrl}
                        onChange={e => setData(p => ({ ...p, imageUrl: e.target.value }))}
                        disabled={!editing}
                        size="small"
                        fullWidth
                        placeholder="https://..."
                      />
                      {editing && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Image size={14} />}
                          onClick={() => setPickerOpen(true)}
                          sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'flex-start' }}
                        >
                          Biblioteca de Imagens
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Box>
                <SharedFilePicker
                  open={pickerOpen}
                  onClose={() => setPickerOpen(false)}
                  onSelect={f => { setData(p => ({ ...p, imageUrl: f.url })); setPickerOpen(false); }}
                  title="Selecionar Imagem do Marco"
                />
                <TextField label="Descrição" value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))} disabled={!editing} size="small" fullWidth multiline minRows={2} />
                <Divider />
                <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1.5 }}>Conteúdo</Typography>
                <RichTextEditor
                  value={data.contentHtml}
                  onChange={html => setData(p => ({ ...p, contentHtml: html }))}
                  disabled={!editing}
                  minHeight={160}
                />
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
}

function NewMilestoneForm({ onSubmit, onCancel }: { onSubmit: (m: Milestone) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<Milestone>(empty());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const submit = async () => {
    if (!data.title.trim()) { setErr('Título obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Novo Marco Histórico</Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} size="small" fullWidth autoFocus />
          <TextField label="Título do Evento" value={data.eventTitle} onChange={e => setData(p => ({ ...p, eventTitle: e.target.value }))} size="small" fullWidth />
          <TextField label="Ano" type="number" value={data.milestoneYear} onChange={e => setData(p => ({ ...p, milestoneYear: Number(e.target.value) }))} size="small" sx={{ minWidth: 110 }} />
          <TextField label="Ordem" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} size="small" sx={{ minWidth: 100 }} />
        </Stack>
        <TextField label="Descrição" value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))} size="small" fullWidth multiline minRows={2} />
        {/* Image picker */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>Imagem do Card</Typography>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            {data.imageUrl && (
              <Box sx={{ width: 120, height: 72, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                <img src={data.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            )}
            <Stack spacing={1} sx={{ flex: 1 }}>
              <TextField
                label="URL da Imagem"
                value={data.imageUrl}
                onChange={e => setData(p => ({ ...p, imageUrl: e.target.value }))}
                size="small"
                fullWidth
                placeholder="https://..."
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<Image size={14} />}
                onClick={() => setPickerOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'flex-start' }}
              >
                Biblioteca de Imagens
              </Button>
            </Stack>
          </Stack>
        </Box>
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={submit} disabled={saving || !data.title.trim()} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Criar</Button>
          <Button onClick={onCancel} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>
      <SharedFilePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={f => { setData(p => ({ ...p, imageUrl: f.url })); setPickerOpen(false); }}
        title="Selecionar Imagem do Marco"
      />
    </Paper>
  );
}

export default function MarcoHistoricoEditor() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    try { setLoading(true); const r = await fetch(`${API_BASE}/historical-milestones`); const d = await r.json(); setMilestones(Array.isArray(d) ? d : []); }
    catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (m: Milestone) => {
    const r = await fetch(`${API_BASE}/historical-milestones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setMilestones(p => [...p, saved].sort((a, b) => a.milestoneYear - b.milestoneYear));
    setShowNew(false);
    setMsg({ type: 'success', text: 'Criado.' });
  };
  const handleSave = async (m: Milestone) => {
    const r = await fetch(`${API_BASE}/historical-milestones/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setMilestones(p => p.map(x => x.id === saved.id ? saved : x).sort((a, b) => a.milestoneYear - b.milestoneYear));
  };
  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/historical-milestones/${id}`, { method: 'DELETE' });
    setMilestones(p => p.filter(x => x.id !== id));
    setMsg({ type: 'success', text: 'Removido.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Timeline da história institucional da ENSA.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Novo Marco</Button>
      </Stack>
      <PageUrlBanner urls={{ label: 'História da ENSA', path: '/sobre-nos' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}
      {showNew && <NewMilestoneForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}
      {loading
        ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        : milestones.length === 0
          ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem marcos históricos.</Typography></Paper>
          : milestones.map(m => <MilestoneCard key={m.id} item={m} onSave={handleSave} onDelete={handleDelete} />)
      }
    </Box>
  );
}
