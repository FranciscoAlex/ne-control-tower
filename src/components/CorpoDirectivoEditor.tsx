import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
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
import { Check, ChevronDown, ChevronRight, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import SharedFilePicker from './SharedFilePicker';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type BoardMember = {
  id?: number;
  fullName: string;
  role: string;
  bio: string;
  cvDocumentUrl: string;
  photoUrl: string;
  displayOrder: number;
};

function empty(): BoardMember {
  return { fullName: '', role: '', bio: '', cvDocumentUrl: '', photoUrl: '', displayOrder: 0 };
}

function MemberCard({ member, onSave, onDelete }: {
  member: BoardMember;
  onSave: (m: BoardMember) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<BoardMember>(member);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'cv' | 'photo' | null>(null);
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setData(member); }, [member]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const uploadFile = async (file: File, field: 'cvDocumentUrl' | 'photoUrl', kind: 'cv' | 'photo') => {
    if (!member.id) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('field', kind);
    try {
      setUploading(kind);
      const res = await fetch(`${API_BASE}/board-members/${member.id}/upload?field=${kind}`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setData(p => ({ ...p, [field]: saved.url }));
      setMsg({ type: 'success', text: `Ficheiro "${file.name}" carregado.` });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar ficheiro.' });
    } finally {
      setUploading(null);
    }
  };

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 2, overflow: 'hidden' }}>
      <Box onClick={() => setOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
          <Avatar src={data.photoUrl} sx={{ width: 40, height: 40, bgcolor: '#164993', fontWeight: 800 }}>
            {data.fullName?.[0] ?? '?'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.fullName || '(sem nome)'}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>{data.role || '—'} {data.displayOrder != null ? `· Ordem ${data.displayOrder}` : ''}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} onClick={e => e.stopPropagation()}>
          {editing
            ? <><Button size="small" variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Guardar</Button>
                <Button size="small" onClick={() => { setEditing(false); setData(member); }} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Cancelar</Button></>
            : <Button size="small" onClick={() => { setOpen(true); setEditing(true); }} startIcon={<Pencil size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Editar</Button>}
          {member.id && (confirmDelete
            ? <><Button size="small" color="error" variant="contained" onClick={() => onDelete(member.id!)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Confirmar</Button>
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
              <TextField label="Nome Completo *" value={data.fullName} onChange={e => setData(p => ({ ...p, fullName: e.target.value }))} disabled={!editing} size="small" fullWidth />
              <TextField label="Cargo / Função" value={data.role} onChange={e => setData(p => ({ ...p, role: e.target.value }))} disabled={!editing} size="small" fullWidth />
              <TextField label="Ordem de Exibição" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 120 }} />
            </Stack>
            <TextField label="Biografia" value={data.bio} onChange={e => setData(p => ({ ...p, bio: e.target.value }))} disabled={!editing} multiline minRows={3} size="small" fullWidth />
            <Divider />
            {/* Photo URL */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
              <TextField label="URL da Fotografia" value={data.photoUrl} onChange={e => setData(p => ({ ...p, photoUrl: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="https://..." />
              {editing && member.id && (
                <><Button size="small" variant="outlined" onClick={() => setImageLibraryOpen(true)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>Biblioteca</Button></>
              )}
              )}
            </Stack>
            {/* CV URL */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
              <TextField label="URL do CV (PDF)" value={data.cvDocumentUrl} onChange={e => setData(p => ({ ...p, cvDocumentUrl: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="https://..." />
              {editing && member.id && (
                <><Button size="small" variant="outlined" startIcon={uploading === 'cv' ? <CircularProgress size={13} /> : <Upload size={13} />} onClick={() => cvRef.current?.click()} disabled={!!uploading} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>CV PDF</Button>
                  <input ref={cvRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'cvDocumentUrl', 'cv'); e.target.value = ''; }} /></>
              )}
              {editing && !member.id && <Typography variant="caption" sx={{ color: '#f59e0b', whiteSpace: 'nowrap' }}>⚠ Guarde primeiro para upload</Typography>}
            </Stack>
          </Stack>
        </Box>
      </Collapse>

      <SharedFilePicker
        open={imageLibraryOpen}
        onClose={() => setImageLibraryOpen(false)}
        onSelect={(f) => setData(p => ({ ...p, photoUrl: f.url }))}
        title="Biblioteca de fotos do corpo directivo"
      />
    </Paper>
  );
}

function NewMemberForm({ onSubmit, onCancel }: { onSubmit: (m: BoardMember) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<BoardMember>(empty());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!data.fullName.trim()) { setErr('Nome obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Novo Membro do Corpo Directivo</Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Nome Completo *" value={data.fullName} onChange={e => setData(p => ({ ...p, fullName: e.target.value }))} size="small" fullWidth autoFocus />
          <TextField label="Cargo / Função" value={data.role} onChange={e => setData(p => ({ ...p, role: e.target.value }))} size="small" fullWidth />
          <TextField label="Ordem" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} size="small" sx={{ minWidth: 100 }} />
        </Stack>
        <TextField label="Biografia" value={data.bio} onChange={e => setData(p => ({ ...p, bio: e.target.value }))} multiline minRows={2} size="small" fullWidth />
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={submit} disabled={saving || !data.fullName.trim()} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Criar</Button>
          <Button onClick={onCancel} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function CorpoDirectivoEditor() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    try { setLoading(true); const r = await fetch(`${API_BASE}/board-members`); const d = await r.json(); setMembers(Array.isArray(d) ? d : []); }
    catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (m: BoardMember) => {
    const r = await fetch(`${API_BASE}/board-members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setMembers(p => [...p, saved].sort((a, b) => a.displayOrder - b.displayOrder));
    setShowNew(false);
    setMsg({ type: 'success', text: 'Criado com sucesso.' });
  };

  const handleSave = async (m: BoardMember) => {
    const r = await fetch(`${API_BASE}/board-members/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setMembers(p => p.map(x => x.id === saved.id ? saved : x).sort((a, b) => a.displayOrder - b.displayOrder));
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/board-members/${id}`, { method: 'DELETE' });
    setMembers(p => p.filter(x => x.id !== id));
    setMsg({ type: 'success', text: 'Removido.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Gestão dos membros do conselho de administração e direcção.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Novo Membro</Button>
      </Stack>
      <PageUrlBanner urls={{ label: 'Corpo Directivo', path: '/corpo-diretivo' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}
      {showNew && <NewMemberForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}
      {loading
        ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /><Typography variant="caption" sx={{ mt: 2, color: '#94a3b8' }}>A carregar...</Typography></Stack>
        : members.length === 0
          ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem membros. Clique em "Novo Membro" para adicionar.</Typography></Paper>
          : members.map(m => <MemberCard key={m.id} member={m} onSave={handleSave} onDelete={handleDelete} />)
      }
    </Box>
  );
}
