import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import { Check, ChevronDown, ChevronRight, ExternalLink, Globe, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type Subsidiary = {
  id?: number;
  name: string;
  descriptionPt?: string;
  descriptionEn?: string;
  logoUrl?: string;
  websiteUrl?: string;
  ownershipPercentage: number;
  country: string;
  sector: string;
  sortOrder: number;
};

function empty(): Subsidiary {
  return { name: '', descriptionPt: '', descriptionEn: '', logoUrl: '', websiteUrl: '', ownershipPercentage: 100, country: 'Angola', sector: 'Seguros', sortOrder: 0 };
}

function SubsidiaryCard({ item, onSave, onDelete }: {
  item: Subsidiary;
  onSave: (s: Subsidiary) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Subsidiary>(item);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item.id) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      const r = await fetch(`${API_BASE}/subsidiaries/${item.id}/upload`, { method: 'POST', body: form });
      if (!r.ok) throw new Error();
      const result = await r.json();
      setData(p => ({ ...p, logoUrl: result.url || result.logoUrl || '' }));
      setMsg({ type: 'success', text: 'Logo carregado.' });
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar logo.' }); }
    finally { setUploading(false); if (logoRef.current) logoRef.current.value = ''; }
  };

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
          {data.logoUrl
            ? <Box component="img" src={data.logoUrl} sx={{ height: 32, width: 48, objectFit: 'contain', borderRadius: 1, bgcolor: '#f1f5f9', p: 0.5 }} />
            : <Box sx={{ height: 32, width: 48, borderRadius: 1, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={18} color="#94a3b8" /></Box>
          }
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.name || '(sem nome)'}</Typography>
            <Stack direction="row" spacing={1}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>{data.ownershipPercentage}% · {data.country} · {data.sector}</Typography>
              {data.websiteUrl && <Chip label="Website" size="small" icon={<ExternalLink size={10} />} sx={{ height: 16, fontSize: 10 }} component="a" href={data.websiteUrl} target="_blank" onClick={e => e.stopPropagation()} clickable />}
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Nome *" value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))} disabled={!editing} size="small" fullWidth />
              <TextField label="Participação (%)" type="number" value={data.ownershipPercentage} onChange={e => setData(p => ({ ...p, ownershipPercentage: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 130 }} inputProps={{ min: 0, max: 100, step: 0.01 }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="País" value={data.country} onChange={e => setData(p => ({ ...p, country: e.target.value }))} disabled={!editing} size="small" fullWidth />
              <TextField label="Sector" value={data.sector} onChange={e => setData(p => ({ ...p, sector: e.target.value }))} disabled={!editing} size="small" fullWidth />
              <TextField label="Ordem" type="number" value={data.sortOrder} onChange={e => setData(p => ({ ...p, sortOrder: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 90 }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Website" value={data.websiteUrl || ''} onChange={e => setData(p => ({ ...p, websiteUrl: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="https://..." />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 280 }}>
                <TextField label="URL do Logo" value={data.logoUrl || ''} onChange={e => setData(p => ({ ...p, logoUrl: e.target.value }))} disabled={!editing} size="small" fullWidth />
                {editing && item.id && (
                  <Button size="small" variant="outlined" onClick={() => logoRef.current?.click()} disabled={uploading} startIcon={uploading ? <CircularProgress size={13} /> : <Upload size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>
                    Upload
                  </Button>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} ref={logoRef} onChange={handleLogoUpload} />
              </Stack>
            </Stack>
            <TextField label="Descrição (PT)" value={data.descriptionPt || ''} onChange={e => setData(p => ({ ...p, descriptionPt: e.target.value }))} disabled={!editing} size="small" fullWidth multiline minRows={2} />
            <TextField label="Descrição (EN)" value={data.descriptionEn || ''} onChange={e => setData(p => ({ ...p, descriptionEn: e.target.value }))} disabled={!editing} size="small" fullWidth multiline minRows={2} />
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}

function NewSubsidiaryForm({ onSubmit, onCancel }: { onSubmit: (s: Subsidiary) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<Subsidiary>(empty());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!data.name.trim()) { setErr('Nome obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Nova Empresa do Grupo</Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Nome *" value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))} size="small" fullWidth autoFocus />
          <TextField label="Participação (%)" type="number" value={data.ownershipPercentage} onChange={e => setData(p => ({ ...p, ownershipPercentage: Number(e.target.value) }))} size="small" sx={{ minWidth: 130 }} inputProps={{ min: 0, max: 100, step: 0.01 }} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="País" value={data.country} onChange={e => setData(p => ({ ...p, country: e.target.value }))} size="small" fullWidth />
          <TextField label="Sector" value={data.sector} onChange={e => setData(p => ({ ...p, sector: e.target.value }))} size="small" fullWidth />
          <TextField label="Ordem" type="number" value={data.sortOrder} onChange={e => setData(p => ({ ...p, sortOrder: Number(e.target.value) }))} size="small" sx={{ minWidth: 90 }} />
        </Stack>
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={submit} disabled={saving || !data.name.trim()} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Criar</Button>
          <Button onClick={onCancel} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function EmpresasGrupoEditor() {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE}/subsidiaries`);
      const d = await r.json();
      setSubsidiaries(Array.isArray(d) ? d.sort((a: Subsidiary, b: Subsidiary) => a.sortOrder - b.sortOrder) : []);
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (s: Subsidiary) => {
    const r = await fetch(`${API_BASE}/subsidiaries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setSubsidiaries(p => [...p, saved].sort((a, b) => a.sortOrder - b.sortOrder));
    setShowNew(false);
    setMsg({ type: 'success', text: 'Criada.' });
  };
  const handleSave = async (s: Subsidiary) => {
    const r = await fetch(`${API_BASE}/subsidiaries/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setSubsidiaries(p => p.map(x => x.id === saved.id ? saved : x).sort((a, b) => a.sortOrder - b.sortOrder));
  };
  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/subsidiaries/${id}`, { method: 'DELETE' });
    setSubsidiaries(p => p.filter(x => x.id !== id));
    setMsg({ type: 'success', text: 'Removida.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Subsidiárias e participadas da ENSA — Fundo de Pensões e secção do grupo.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Nova Empresa</Button>
      </Stack>
      <PageUrlBanner urls={{ label: 'Estrutura Accionista / Grupo', path: '/estrutura-acionista' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}
      {showNew && <NewSubsidiaryForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}
      {loading
        ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        : subsidiaries.length === 0 && !showNew
          ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem empresas registadas.</Typography></Paper>
          : subsidiaries.map(s => <SubsidiaryCard key={s.id} item={s} onSave={handleSave} onDelete={handleDelete} />)
      }
    </Box>
  );
}
