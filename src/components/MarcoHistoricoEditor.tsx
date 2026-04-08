import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import RichTextEditor from './RichTextEditor';
import SharedFilePicker from './SharedFilePicker';
import { Check, Image, Pencil, Plus, Trash2, X } from 'lucide-react';

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

// ── Visual card shown in the grid ────────────────────────────────────────────
function MilestoneGridCard({ item, onClick }: { item: Milestone; onClick: () => void }) {
  return (
    <Paper
      onClick={onClick}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(0,0,0,0.10)' },
        '&:hover .edit-badge': { opacity: 1 },
      }}
    >
      {/* Image or year banner */}
      {item.imageUrl ? (
        <Box sx={{ height: 130, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
          <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
            <Chip label={item.milestoneYear} size="small" sx={{ fontWeight: 900, bgcolor: '#164993', color: '#fff', fontSize: '0.75rem' }} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ height: 72, bgcolor: '#164993', display: 'flex', alignItems: 'center', px: 2.5, flexShrink: 0 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900, letterSpacing: -1 }}>{item.milestoneYear}</Typography>
        </Box>
      )}

      {/* Body */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.3 }}>{item.title || '(sem título)'}</Typography>
        {item.eventTitle && (
          <Typography variant="caption" sx={{ color: '#164993', fontWeight: 600 }}>{item.eventTitle}</Typography>
        )}
        {item.description && (
          <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </Typography>
        )}
      </Box>

      {/* Edit badge */}
      <Box
        className="edit-badge"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity: 0,
          transition: 'opacity 0.15s',
          bgcolor: 'rgba(255,255,255,0.92)',
          borderRadius: 2,
          px: 1,
          py: 0.4,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
        }}
      >
        <Pencil size={11} />
        <Typography variant="caption" fontWeight={700} fontSize={11}>Editar</Typography>
      </Box>
    </Paper>
  );
}

// ── Edit dialog ───────────────────────────────────────────────────────────────
function MilestoneEditDialog({
  item,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  item: Milestone;
  open: boolean;
  onClose: () => void;
  onSave: (m: Milestone) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}) {
  const [data, setData] = useState<Milestone>(item);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => { setData(item); setMsg(null); setConfirmDelete(false); }, [open, item.id]);

  const handleSave = async () => {
    if (!data.title.trim()) { setMsg({ type: 'error', text: 'Título obrigatório.' }); return; }
    try {
      setSaving(true);
      await onSave(data);
      setMsg({ type: 'success', text: 'Guardado com sucesso.' });
      setTimeout(() => { setMsg(null); onClose(); }, 900);
    } catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!item.id || !onDelete) return;
    try {
      setDeleting(true);
      await onDelete(item.id);
      onClose();
    } catch { setMsg({ type: 'error', text: 'Erro ao eliminar.' }); }
    finally { setDeleting(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>{data.title || 'Marco Histórico'}</Typography>
          <Typography variant="caption" color="text.secondary">Edite os campos e clique em Guardar.</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* ── IMAGE PREVIEW AT TOP ── */}
        {data.imageUrl && (
          <Box sx={{ height: 180, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            <img src={data.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }} />
            <Box sx={{ position: 'absolute', bottom: 14, left: 18 }}>
              <Chip label={data.milestoneYear} size="small" sx={{ fontWeight: 900, bgcolor: '#164993', color: '#fff' }} />
              {data.title && (
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 800, ml: 1, display: 'inline', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                  {data.title}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* ── FORM ── */}
        <Box sx={{ p: 3 }}>
          {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} size="small" fullWidth />
              <TextField label="Título do Evento" value={data.eventTitle} onChange={e => setData(p => ({ ...p, eventTitle: e.target.value }))} size="small" fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Ano" type="number" value={data.milestoneYear} onChange={e => setData(p => ({ ...p, milestoneYear: Number(e.target.value) }))} size="small" sx={{ minWidth: 110 }} />
              <TextField label="Ordem de Exibição" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} size="small" sx={{ minWidth: 130 }} />
            </Stack>
            <TextField label="Descrição" value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))} size="small" fullWidth multiline minRows={2} />

            {/* Image */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>Imagem do Card</Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                {data.imageUrl && (
                  <Box sx={{ width: 120, height: 72, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                    <img src={data.imageUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}
                <Stack spacing={1} sx={{ flex: 1 }}>
                  <TextField label="URL da Imagem" value={data.imageUrl} onChange={e => setData(p => ({ ...p, imageUrl: e.target.value }))} size="small" fullWidth placeholder="https://..." />
                  <Button size="small" variant="outlined" startIcon={<Image size={14} />} onClick={() => setPickerOpen(true)} sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'flex-start' }}>
                    Biblioteca de Imagens
                  </Button>
                </Stack>
              </Stack>
              <SharedFilePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={f => { setData(p => ({ ...p, imageUrl: f.url })); setPickerOpen(false); }} title="Selecionar Imagem do Marco" />
            </Box>

            <Divider />
            <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1.5 }}>Conteúdo</Typography>
            <RichTextEditor value={data.contentHtml} onChange={html => setData(p => ({ ...p, contentHtml: html }))} minHeight={160} />

            <Divider />
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              {item.id && onDelete ? (
                confirmDelete ? (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" color="error" variant="contained" onClick={handleDelete} disabled={deleting}
                      startIcon={deleting ? <CircularProgress size={12} color="inherit" /> : <Trash2 size={13} />}>
                      Confirmar eliminação
                    </Button>
                    <Button size="small" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                  </Stack>
                ) : (
                  <Button size="small" color="error" variant="outlined" startIcon={<Trash2 size={13} />} onClick={() => setConfirmDelete(true)}>
                    Eliminar
                  </Button>
                )
              ) : <Box />}

              <Stack direction="row" spacing={1}>
                <Button onClick={onClose} variant="outlined" disabled={saving}>Cancelar</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check size={14} />}>
                  Guardar
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────
export default function MarcoHistoricoEditor() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editingItem, setEditingItem] = useState<Milestone | null>(null);

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
    setMsg({ type: 'success', text: 'Marco criado.' });
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
    setMsg({ type: 'success', text: 'Marco eliminado.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: '#64748b' }}>Timeline da história institucional da ENSA. Clique num marco para editar.</Typography>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(true)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>
          Novo Marco
        </Button>
      </Stack>

      <PageUrlBanner urls={{ label: 'História da ENSA', path: '/sobre-nos' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : milestones.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem marcos históricos. Clique em "Novo Marco" para adicionar.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {milestones.map(m => (
            <Grid key={m.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ position: 'relative', height: '100%' }}>
                <MilestoneGridCard item={m} onClick={() => setEditingItem(m)} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit dialog */}
      {editingItem && (
        <MilestoneEditDialog
          open={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async (updated) => { await handleSave(updated); setEditingItem(null); }}
          onDelete={async (id) => { await handleDelete(id); setEditingItem(null); }}
        />
      )}

      {/* New dialog */}
      <MilestoneEditDialog
        item={empty()}
        open={showNew}
        onClose={() => setShowNew(false)}
        onSave={handleCreate}
      />
    </Box>
  );
}

