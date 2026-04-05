import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Link,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
  Check,
} from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';

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

// ---- Assembly Card (expandable) ----
function AssemblyCard({
  assembly,
  onSave,
  onDelete,
}: {
  assembly: Assembly;
  onSave: (a: Assembly) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Assembly>(assembly);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [addingByUrl, setAddingByUrl] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<Document>>({ documentType: 'PDF' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset local data when parent updates
  useEffect(() => { setData(assembly); }, [assembly]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      await onSave(data);
      setEditing(false);
      setMsg({ type: 'success', text: 'Guardado com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const addAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    setData(prev => ({ ...prev, agendaItems: [...prev.agendaItems, newAgendaItem.trim()] }));
    setNewAgendaItem('');
  };

  const removeAgendaItem = (idx: number) => {
    setData(prev => ({ ...prev, agendaItems: prev.agendaItems.filter((_, i) => i !== idx) }));
  };

  const handleAddDocManual = async () => {
    if (!newDoc.title || !newDoc.documentUrl) return;
    if (assembly.id) {
      try {
        setSaving(true);
        const res = await fetch(`${API_BASE}/general-assemblies/${assembly.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newDoc.title,
            documentUrl: newDoc.documentUrl,
            documentType: newDoc.documentType || 'PDF',
            fileSizeLabel: newDoc.fileSizeLabel || '—',
          }),
        });
        if (!res.ok) throw new Error();
        const saved: Document = await res.json();
        setData(prev => ({ ...prev, documents: [...prev.documents, saved] }));
        setNewDoc({ documentType: 'PDF' });
        setAddingByUrl(false);
        setMsg({ type: 'success', text: 'Documento adicionado.' });
      } catch {
        setMsg({ type: 'error', text: 'Erro ao adicionar documento.' });
      } finally {
        setSaving(false);
      }
    } else {
      // Not yet saved — buffer locally
      setData(prev => ({
        ...prev,
        documents: [...prev.documents, {
          title: newDoc.title!,
          documentUrl: newDoc.documentUrl!,
          documentType: newDoc.documentType || 'PDF',
          fileSizeLabel: newDoc.fileSizeLabel || '—',
        }],
      }));
      setNewDoc({ documentType: 'PDF' });
      setAddingByUrl(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assembly.id) return;
    const title = file.name;
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const docType = DOC_TYPES.includes(ext) ? ext : 'PDF';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('documentType', docType);
    try {
      setUploadingFile(true);
      const res = await fetch(`${API_BASE}/general-assemblies/${assembly.id}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setData(prev => ({
        ...prev,
        documents: [...prev.documents, {
          id: Number(saved.id),
          title,
          documentUrl: saved.url,
          documentType: docType,
          fileSizeLabel: saved.fileSizeLabel,
        }],
      }));
      setMsg({ type: 'success', text: `"${title}" carregado com sucesso.` });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar ficheiro.' });
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId: number, idx: number) => {
    try {
      await fetch(`${API_BASE}/general-assemblies/documents/${docId}`, { method: 'DELETE' });
      setData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }));
    } catch {
      setMsg({ type: 'error', text: 'Erro ao remover documento.' });
    }
  };

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 2 }}>
      {/* Header */}
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', userSelect: 'none', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" tabIndex={-1} onClick={e => { e.stopPropagation(); setOpen(v => !v); }}>
            {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </IconButton>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
              {data.title || '(sem título)'}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>{data.meetingDate || data.meetingYear}</Typography>
              <Chip
                label={data.status}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.65rem',
                  bgcolor: data.status === 'Realizada' ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1),
                  color: data.status === 'Realizada' ? '#059669' : '#b45309',
                }}
              />
              <Chip label={`${data.agendaItems.length} bullet${data.agendaItems.length !== 1 ? 's' : ''}`} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#64748b' }} />
              <Chip label={`${data.documents.length} doc${data.documents.length !== 1 ? 's' : ''}`} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#64748b' }} />
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} onClick={e => e.stopPropagation()}>
          {editing ? (
            <>
              <Button size="small" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={14} /> : <Check size={14} />} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Guardar</Button>
              <Button size="small" onClick={() => { setEditing(false); setData(assembly); }} startIcon={<X size={14} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Cancelar</Button>
            </>
          ) : (
            <Button size="small" onClick={() => { setOpen(true); setEditing(true); }} startIcon={<Pencil size={14} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Editar</Button>
          )}
          {assembly.id && (
            confirmDelete
              ? <Stack direction="row" spacing={1}>
                  <Button size="small" color="error" variant="contained" onClick={() => onDelete(assembly.id!)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Confirmar</Button>
                  <Button size="small" onClick={() => setConfirmDelete(false)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Cancelar</Button>
                </Stack>
              : <IconButton size="small" color="error" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /></IconButton>
          )}
        </Stack>
      </Box>

      <Collapse in={open}>
        <Box sx={{ px: 3, pb: 3 }}>
          {msg && (
            <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>
          )}

          {/* --- Core fields --- */}
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.5 }}>Informação Geral</Typography>
          <Stack spacing={2} sx={{ mt: 1.5, mb: 3 }}>
            <TextField
              label="Título *"
              value={data.title}
              onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
              disabled={!editing}
              fullWidth
              size="small"
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Ano"
                type="number"
                value={data.meetingYear}
                onChange={e => setData(prev => ({ ...prev, meetingYear: Number(e.target.value) }))}
                disabled={!editing}
                size="small"
                sx={{ width: 120 }}
              />
              <TextField
                label="Data (ex: 10 de Abril de 2025)"
                value={data.meetingDate}
                onChange={e => setData(prev => ({ ...prev, meetingDate: e.target.value }))}
                disabled={!editing}
                fullWidth
                size="small"
              />
              <TextField
                select
                label="Estado"
                value={data.status}
                onChange={e => setData(prev => ({ ...prev, status: e.target.value }))}
                disabled={!editing}
                size="small"
                sx={{ minWidth: 150 }}
                SelectProps={{ native: true }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </TextField>
              <TextField
                type="number"
                label="Ordem"
                value={data.displayOrder}
                onChange={e => setData(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                disabled={!editing}
                size="small"
                sx={{ width: 100 }}
              />
            </Stack>
            <TextField
              label="Resumo / Descrição"
              value={data.summary}
              onChange={e => setData(prev => ({ ...prev, summary: e.target.value }))}
              disabled={!editing}
              fullWidth
              multiline
              minRows={3}
              size="small"
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* --- Agenda bullets --- */}
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.5 }}>Pontos da Ordem do Dia (Bullets)</Typography>
          <Stack spacing={1} sx={{ mt: 1.5, mb: 2 }}>
            {data.agendaItems.map((item, idx) => (
              <Stack key={idx} direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#164993', flexShrink: 0 }} />
                {editing ? (
                  <>
                    <TextField
                      value={item}
                      onChange={e => setData(prev => {
                        const items = [...prev.agendaItems];
                        items[idx] = e.target.value;
                        return { ...prev, agendaItems: items };
                      })}
                      size="small"
                      fullWidth
                    />
                    <IconButton size="small" color="error" onClick={() => removeAgendaItem(idx)}><X size={14} /></IconButton>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: '#334155' }}>{item}</Typography>
                )}
              </Stack>
            ))}
            {editing && (
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
            )}
            {data.agendaItems.length === 0 && !editing && (
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Nenhum ponto adicionado. Clique em Editar para adicionar.</Typography>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* --- Documents --- */}
          <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.5 }}>Documentos</Typography>
          <Stack spacing={1} sx={{ mt: 1.5, mb: 2 }}>
            {data.documents.map((doc, idx) => (
              <Stack key={idx} direction="row" spacing={2} alignItems="center" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <FileText size={16} color="#164993" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>{doc.documentType}</Typography>
                    {doc.fileSizeLabel && <Typography variant="caption" sx={{ color: '#94a3b8' }}>{doc.fileSizeLabel}</Typography>}
                  </Stack>
                </Box>
                <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#164993' }}>
                  <IconButton size="small"><Link size={14} /></IconButton>
                </a>
                {editing && doc.id && (
                  <IconButton size="small" color="error" onClick={() => handleDeleteDoc(doc.id!, idx)}><Trash2 size={14} /></IconButton>
                )}
              </Stack>
            ))}

            {editing && !addingByUrl && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  startIcon={uploadingFile ? <CircularProgress size={13} /> : <Upload size={14} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || !assembly.id}
                  title={!assembly.id ? 'Guarde a assembleia primeiro para fazer upload' : 'Upload directo — o título será preenchido automaticamente'}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
                >
                  {uploadingFile ? 'A carregar...' : 'Upload Documento'}
                </Button>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                <Button size="small" startIcon={<Link size={14} />} onClick={() => setAddingByUrl(true)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>
                  Inserir URL
                </Button>
                {!assembly.id && (
                  <Typography variant="caption" sx={{ color: '#f59e0b', ml: 1 }}>⚠ Guarde primeiro para activar o upload.</Typography>
                )}
              </Stack>
            )}

            {editing && addingByUrl && (
              <Paper sx={{ p: 2, borderRadius: 3, border: '1px dashed #e2e8f0', bgcolor: '#fafafa' }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1}>
                    <TextField label="Título *" value={newDoc.title || ''} onChange={e => setNewDoc(p => ({ ...p, title: e.target.value }))} size="small" fullWidth />
                    <TextField select label="Tipo" value={newDoc.documentType || 'PDF'} onChange={e => setNewDoc(p => ({ ...p, documentType: e.target.value }))} size="small" sx={{ minWidth: 90 }} SelectProps={{ native: true }}>
                      {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </TextField>
                  </Stack>
                  <TextField label="URL do documento *" value={newDoc.documentUrl || ''} onChange={e => setNewDoc(p => ({ ...p, documentUrl: e.target.value }))} size="small" fullWidth placeholder="https://..." />
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={handleAddDocManual}
                      disabled={!newDoc.title || !newDoc.documentUrl}
                      startIcon={<Check size={14} />}
                      variant="contained"
                      sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
                    >
                      Confirmar
                    </Button>
                    <Button size="small" onClick={() => { setAddingByUrl(false); setNewDoc({ documentType: 'PDF' }); }} startIcon={<X size={14} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Cancelar</Button>
                  </Stack>
                </Stack>
              </Paper>
            )}

            {data.documents.length === 0 && !editing && (
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Nenhum documento. Clique em Editar para adicionar.</Typography>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
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
        assemblies.map(a => (
          <AssemblyCard key={a.id ?? a.slugId} assembly={a} onSave={handleSave} onDelete={handleDelete} />
        ))
      )}
    </Box>
  );
}
