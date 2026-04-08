import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  FileText,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
  Check,
} from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type Document = {
  id?: number;
  title: string;
  documentUrl: string;
  documentType: string;
  fileSizeLabel: string;
};

type Assembly = {
  id?: number;
  slugId?: string;
  title: string;
  meetingYear: number;
  meetingDate: string;
  status: string;
  assemblyType: string;
  summary: string;
  displayOrder: number;
  agendaItems: string[];
  documents: Document[];
};

const ASSEMBLY_TYPES = ['Ordinária', 'Extraordinária'];
const STATUS_OPTIONS = ['Realizada', 'Convocada', 'Cancelada'];
const DOC_TYPES = ['PDF', 'DOCX', 'XLSX', 'ZIP', 'PPT', 'Outro'];

const emptyAssembly = (type: string): Assembly => ({
  title: '',
  meetingYear: new Date().getFullYear(),
  meetingDate: '',
  status: 'Realizada',
  assemblyType: type,
  summary: '',
  displayOrder: 0,
  agendaItems: [],
  documents: [],
});

// ---- Assembly Card (grid card + edit dialog) ----
function AssemblyCard({
  assembly,
  onSave,
  onDelete,
}: {
  assembly: Assembly;
  onSave: (a: Assembly) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Assembly>(assembly);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState('');

  useEffect(() => { setDraft(assembly); }, [assembly]);

  const handleOpen = () => {
    setDraft({ ...assembly, agendaItems: [...assembly.agendaItems], documents: [...assembly.documents] });
    setDialogOpen(true);
  };
  const handleClose = () => { setDialogOpen(false); setMsg(null); setConfirmDelete(false); setNewAgendaItem(''); };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(draft);
      handleClose();
    } catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const addAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    setDraft(p => ({ ...p, agendaItems: [...p.agendaItems, newAgendaItem.trim()] }));
    setNewAgendaItem('');
  };

  const removeAgendaItem = (idx: number) =>
    setDraft(p => ({ ...p, agendaItems: p.agendaItems.filter((_, i) => i !== idx) }));

  const fmtBytes = (v?: string) => {
    const b = Number(v || 0);
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAddDocFromPicker = async (f: { url: string; name: string; sizeBytes?: string }) => {
    const newDoc = { title: f.name, documentUrl: f.url, documentType: 'PDF', fileSizeLabel: fmtBytes(f.sizeBytes) };
    if (assembly.id) {
      try {
        const res = await fetch(`${API_BASE}/general-assemblies/${assembly.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDoc),
        });
        if (!res.ok) throw new Error();
        const saved: Document = await res.json();
        setDraft(p => ({ ...p, documents: [...p.documents, saved] }));
      } catch { setMsg({ type: 'error', text: 'Erro ao adicionar documento.' }); }
    } else {
      setDraft(p => ({ ...p, documents: [...p.documents, newDoc] }));
    }
    setPickerOpen(false);
  };

  const handleDeleteDoc = async (docId: number | undefined, idx: number) => {
    if (docId) {
      try {
        await fetch(`${API_BASE}/general-assemblies/documents/${docId}`, { method: 'DELETE' });
      } catch { setMsg({ type: 'error', text: 'Erro ao remover documento.' }); return; }
    }
    setDraft(p => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }));
  };

  const statusColor = assembly.status === 'Realizada'
    ? { bg: alpha('#10b981', 0.1), text: '#059669' }
    : assembly.status === 'Cancelada'
    ? { bg: alpha('#ef4444', 0.1), text: '#dc2626' }
    : { bg: alpha('#f59e0b', 0.1), text: '#b45309' };

  return (
    <>
      {/* Grid card */}
      <Paper
        elevation={0}
        onClick={handleOpen}
        sx={{
          p: 2.5,
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #164993',
          borderRadius: 3,
          cursor: 'pointer',
          position: 'relative',
          bgcolor: '#fafafa',
          transition: 'box-shadow 0.15s, background-color 0.15s',
          '&:hover': { boxShadow: '0 2px 12px rgba(22,73,147,0.10)', bgcolor: 'white' },
        }}
      >
        <Tooltip title="Editar" sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton size="small" onClick={e => { e.stopPropagation(); handleOpen(); }} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
            <Pencil size={13} />
          </IconButton>
        </Tooltip>

        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', display: 'block', mb: 0.5 }}>
          {assembly.meetingDate || assembly.meetingYear}
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', pr: 6, mb: 1.5, lineHeight: 1.35 }}>
          {assembly.title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sem título</span>}
        </Typography>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip label={assembly.status} size="small" sx={{ height: 18, fontWeight: 700, fontSize: '0.65rem', bgcolor: statusColor.bg, color: statusColor.text }} />
          <Chip label={assembly.assemblyType} size="small" sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#eef4ff', color: '#164993' }} />
          {assembly.documents.length > 0 && (
            <Chip
              icon={<FileText size={10} />}
              label={`${assembly.documents.length} doc${assembly.documents.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#64748b' }}
            />
          )}
          {assembly.agendaItems.length > 0 && (
            <Chip
              label={`${assembly.agendaItems.length} ponto${assembly.agendaItems.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#64748b' }}
            />
          )}
        </Stack>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FileText size={18} color="#164993" />
            <span>Editar Assembleia</span>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, mt: 1, borderRadius: 2 }}>{msg.text}</Alert>}

          {/* Core fields */}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Título *" value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} size="small" fullWidth autoFocus />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Ano" type="number" value={draft.meetingYear} onChange={e => setDraft(p => ({ ...p, meetingYear: Number(e.target.value) }))} size="small" sx={{ width: 120 }} />
              <TextField label="Data (ex: 10 de Abril de 2025)" value={draft.meetingDate} onChange={e => setDraft(p => ({ ...p, meetingDate: e.target.value }))} size="small" fullWidth />
              <TextField select label="Estado" value={draft.status} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))} size="small" sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </TextField>
              <TextField type="number" label="Ordem" value={draft.displayOrder} onChange={e => setDraft(p => ({ ...p, displayOrder: Number(e.target.value) }))} size="small" sx={{ width: 100 }} />
            </Stack>
            <TextField label="Resumo / Descrição" value={draft.summary} onChange={e => setDraft(p => ({ ...p, summary: e.target.value }))} size="small" fullWidth multiline minRows={3} />
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Agenda items */}
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.5 }}>Pontos da Ordem do Dia</Typography>
          <Stack spacing={1} sx={{ mt: 1.5, mb: 2 }}>
            {draft.agendaItems.map((item, idx) => (
              <Stack key={idx} direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#164993', flexShrink: 0 }} />
                <TextField
                  value={item}
                  onChange={e => setDraft(p => {
                    const items = [...p.agendaItems];
                    items[idx] = e.target.value;
                    return { ...p, agendaItems: items };
                  })}
                  size="small"
                  fullWidth
                />
                <IconButton size="small" color="error" onClick={() => removeAgendaItem(idx)}><X size={14} /></IconButton>
              </Stack>
            ))}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField
                placeholder="Novo ponto da ordem do dia..."
                value={newAgendaItem}
                onChange={e => setNewAgendaItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAgendaItem()}
                size="small"
                fullWidth
              />
              <Button onClick={addAgendaItem} disabled={!newAgendaItem.trim()} startIcon={<Plus size={14} />} sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap' }}>Adicionar</Button>
            </Stack>
            {draft.agendaItems.length === 0 && (
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Sem pontos adicionados ainda.</Typography>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Documents */}
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.5 }}>Documentos</Typography>
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {draft.documents.map((doc, idx) => (
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <FileText size={15} color="#164993" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>{doc.documentType}{doc.fileSizeLabel ? ` · ${doc.fileSizeLabel}` : ''}</Typography>
                </Box>
                <Tooltip title="Remover">
                  <IconButton size="small" color="error" onClick={() => handleDeleteDoc(doc.id, idx)} sx={{ bgcolor: '#fff1f2', '&:hover': { bgcolor: '#ffe4e6' } }}>
                    <X size={13} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
            {draft.documents.length === 0 && (
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Nenhum documento adicionado.</Typography>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<Upload size={13} />}
              onClick={() => setPickerOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', borderStyle: 'dashed', color: '#64748b', borderColor: '#cbd5e1', alignSelf: 'flex-start', mt: 0.5 }}
            >
              Biblioteca
            </Button>
            <SharedFilePicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              onSelect={handleAddDocFromPicker}
            />
          </Stack>

          {confirmDelete && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              Tem a certeza? Esta acção não pode ser desfeita.
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" color="error" variant="contained" onClick={() => { onDelete(assembly.id!); handleClose(); }} sx={{ textTransform: 'none' }}>Sim, remover</Button>
                <Button size="small" onClick={() => setConfirmDelete(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
              </Stack>
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {assembly.id && !confirmDelete && (
            <Button color="error" startIcon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)} sx={{ textTransform: 'none', mr: 'auto' }}>
              Remover
            </Button>
          )}
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !draft.title.trim()}
            startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <Check size={14} />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ---- Main Editor ----
export default function AssembliasEditor() {
  const [tab, setTab] = useState(0);
  const assemblyType = ASSEMBLY_TYPES[tab];

  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAssembly, setNewAssembly] = useState<Assembly>(emptyAssembly(assemblyType));
  const [creating, setCreating] = useState(false);

  const load = async (type: string) => {
    try {
      setLoading(true);
      let result: Assembly[] = [];
      if (type === 'Extraordinária') {
        // Fetch both 'Extraordinária' and legacy 'Eleitoral' types for this tab
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/general-assemblies?type=${encodeURIComponent('Extraordinária')}`),
          fetch(`${API_BASE}/general-assemblies?type=${encodeURIComponent('Eleitoral')}`),
        ]);
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        result = [
          ...(Array.isArray(d1) ? d1 : []),
          ...(Array.isArray(d2) ? d2 : []),
        ].sort((a, b) => b.meetingYear - a.meetingYear);
      } else {
        const res = await fetch(`${API_BASE}/general-assemblies?type=${encodeURIComponent(type)}`);
        if (!res.ok) throw new Error();
        result = await res.json();
      }
      setAssemblies(Array.isArray(result) ? result : []);
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar assembleias.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(assemblyType); setShowNewForm(false); }, [tab]);

  const handleSave = async (updated: Assembly) => {
    if (updated.id) {
      const res = await fetch(`${API_BASE}/general-assemblies/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setAssemblies(prev => prev.map(a => (a.id === saved.id ? saved : a)));
    }
  };

  const handleCreate = async () => {
    if (!newAssembly.title || !newAssembly.meetingYear) {
      setMsg({ type: 'error', text: 'Título e ano são obrigatórios.' });
      return;
    }
    try {
      setCreating(true);
      const res = await fetch(`${API_BASE}/general-assemblies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAssembly, assemblyType }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setAssemblies(prev => [saved, ...prev]);
      setNewAssembly(emptyAssembly(assemblyType));
      setShowNewForm(false);
      setMsg({ type: 'success', text: 'Assembleia criada com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao criar assembleia.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/general-assemblies/${id}`, { method: 'DELETE' });
    setAssemblies(prev => prev.filter(a => a.id !== id));
    setMsg({ type: 'success', text: 'Assembleia removida.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Chip label="/ensa/assembleia-ordinaria  /ensa/assembleia-extraordinaria" size="small" sx={{ fontWeight: 700, bgcolor: '#eef4ff', color: '#164993', mb: 1 }} />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Gestão de assembleias, pontos da ordem do dia e documentos para investidores.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNewForm(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>
          Nova Assembleia
        </Button>
      </Stack>
      <PageUrlBanner urls={[
        { label: 'Assembleia Ordinária', path: '/assembleia-ordinaria' },
        { label: 'Assembleia Extraordinária', path: '/assembleia-extraordinaria' },
      ]} />

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}>
        {ASSEMBLY_TYPES.map(t => <Tab key={t} label={t} />)}
      </Tabs>

      {/* --- New Assembly Form --- */}
      {showNewForm && (
        <Paper sx={{ p: 3, borderRadius: 4, border: '2px dashed #164993', mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Nova Assembleia {assemblyType}</Typography>
          <Stack spacing={2}>
            <TextField label="Título *" value={newAssembly.title} onChange={e => setNewAssembly(p => ({ ...p, title: e.target.value }))} fullWidth size="small" />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Ano *" type="number" value={newAssembly.meetingYear} onChange={e => setNewAssembly(p => ({ ...p, meetingYear: Number(e.target.value) }))} size="small" sx={{ width: 120 }} />
              <TextField label="Data" value={newAssembly.meetingDate} onChange={e => setNewAssembly(p => ({ ...p, meetingDate: e.target.value }))} size="small" fullWidth placeholder="ex: 15 de Março de 2025" />
              <TextField select label="Estado" value={newAssembly.status} onChange={e => setNewAssembly(p => ({ ...p, status: e.target.value }))} size="small" sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </TextField>
            </Stack>
            <TextField label="Resumo" value={newAssembly.summary} onChange={e => setNewAssembly(p => ({ ...p, summary: e.target.value }))} fullWidth multiline minRows={2} size="small" />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={handleCreate} disabled={creating} startIcon={creating ? <CircularProgress size={14} /> : <Save size={14} />} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Criar</Button>
              <Button onClick={() => setShowNewForm(false)} sx={{ borderRadius: 3, textTransform: 'none' }}>Cancelar</Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* --- Assembly list --- */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
      ) : assemblies.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px solid #f1f5f9' }}>
          <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>Nenhuma assembleia {assemblyType} encontrada.</Typography>
          <Button startIcon={<Plus size={14} />} onClick={() => setShowNewForm(true)} sx={{ mt: 2, textTransform: 'none', borderRadius: 3 }}>Criar a primeira</Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {assemblies.map(a => (
            <AssemblyCard key={a.id ?? a.slugId} assembly={a} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </Box>
      )}
    </Box>
  );
}
