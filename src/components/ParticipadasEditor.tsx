import { useEffect, useState } from 'react';
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

type Participada = {
  id: string;
  name: string;
  percentage: number;
  displayOrder: number;
};

type ParticipadasDataDTO = {
  updatedAt: string;
  participadas: Participada[];
};

function empty(): Participada {
  return { id: crypto.randomUUID(), name: '', percentage: 0, displayOrder: 0 };
}

function ParticipadaCard({ item, onSave, onDelete }: {
  item: Participada;
  onSave: (s: Participada) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Participada>(item);
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
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <Box sx={{ width: 6, bgcolor: '#164993', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Box
            onClick={() => setOpen(v => !v)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
              <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#164993', flexShrink: 0 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.name || '(sem nome)'}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {data.percentage}% de Participação Social
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
                  <TextField label="Empresa (Subs. e/ou Associada) *" value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))} disabled={!editing} size="small" fullWidth />
                  <TextField label="Percentagem (%)" type="number" value={data.percentage} onChange={e => setData(p => ({ ...p, percentage: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 140 }} inputProps={{ min: 0, max: 100, step: 0.01 }} />
                  <TextField label="Ordem de Exibição" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 140 }} />
                </Stack>
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
}

function NewParticipadaForm({ onSubmit, onCancel }: { onSubmit: (s: Participada) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<Participada>(empty());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!data.name.trim()) { setErr('Nome obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Nova Participada</Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Empresa *" value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))} size="small" fullWidth autoFocus />
          <TextField label="Percentagem (%)" type="number" value={data.percentage} onChange={e => setData(p => ({ ...p, percentage: Number(e.target.value) }))} size="small" sx={{ minWidth: 100 }} inputProps={{ min: 0, max: 100, step: 0.01 }} />
          <TextField label="Ordem" type="number" value={data.displayOrder} onChange={e => setData(p => ({ ...p, displayOrder: Number(e.target.value) }))} size="small" sx={{ minWidth: 90 }} />
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

export default function ParticipadasEditor() {
  const [participadas, setParticipadas] = useState<Participada[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE}/participadas`);
      const d = await r.json() as ParticipadasDataDTO;
      setParticipadas(Array.isArray(d?.participadas) ? d.participadas.sort((a, b) => a.displayOrder - b.displayOrder) : []);
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveToApi = async (updatedList: Participada[]) => {
    const payload: ParticipadasDataDTO = {
      updatedAt: new Date().toISOString(),
      participadas: updatedList
    };
    const r = await fetch(`${API_BASE}/participadas`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    if (!r.ok) throw new Error();
    const saved = await r.json() as ParticipadasDataDTO;
    setParticipadas(saved.participadas.sort((a, b) => a.displayOrder - b.displayOrder));
  };

  const handleCreate = async (s: Participada) => {
    const updatedList = [...participadas, s];
    await saveToApi(updatedList);
    setShowNew(false);
    setMsg({ type: 'success', text: 'Participada criada.' });
  };
  
  const handleSave = async (s: Participada) => {
    const updatedList = participadas.map(x => x.id === s.id ? s : x);
    await saveToApi(updatedList);
  };
  
  const handleDelete = async (id: string) => {
    const updatedList = participadas.filter(x => x.id !== id);
    await saveToApi(updatedList);
    setMsg({ type: 'success', text: 'Removida.' });
  };

  const initMockData = async () => {
    try {
      const mockData: Participada[] = [
        { id: crypto.randomUUID(), name: 'Africa-Re, African Reinsurance Corporation', percentage: 1.05, displayOrder: 1 },
        { id: crypto.randomUUID(), name: 'Clínica Sagrada Esperança Luanda - Marginal, LDA', percentage: 30, displayOrder: 2 },
        { id: crypto.randomUUID(), name: 'Access Bank Angola, S.A', percentage: 12.14, displayOrder: 3 },
        { id: crypto.randomUUID(), name: 'Banco Postal S.A', percentage: 3.86, displayOrder: 4 },
        { id: crypto.randomUUID(), name: 'Editora e Livraria Chá de Caxinde, S.A', percentage: 24.94, displayOrder: 5 },
        { id: crypto.randomUUID(), name: 'Fecope - Sociedade Angolana de Comercio Internacional, LDA.', percentage: 10, displayOrder: 6 },
        { id: crypto.randomUUID(), name: 'SADI - Sociedade Angolana de Desenvolvimento Imobiliário, S.A', percentage: 5, displayOrder: 7 },
        { id: crypto.randomUUID(), name: 'Regenera - Activos Imobiliários (SU), LDA', percentage: 100, displayOrder: 8 },
      ];
      await saveToApi(mockData);
      setMsg({ type: 'success', text: 'Dados Iniciais Inseridos.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao inserir dados iniciais.' });
    }
  }

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Gestão das Empresas Participadas — página <em>Estrutura Accionista</em>.</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            {participadas.length === 0 && <Button variant="outlined" onClick={initMockData} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Inserir Dados Iniciais</Button>}
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Nova Empresa</Button>
        </Stack>
      </Stack>
      <PageUrlBanner urls={{ label: 'Estrutura Accionista', path: '/estrutura-acionista' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}
      {showNew && <NewParticipadaForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}
      {loading
        ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        : participadas.length === 0 && !showNew
          ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem empresas participadas registadas.</Typography></Paper>
          : participadas.map(s => <ParticipadaCard key={s.id} item={s} onSave={handleSave} onDelete={handleDelete} />)
      }
    </Box>
  );
}
