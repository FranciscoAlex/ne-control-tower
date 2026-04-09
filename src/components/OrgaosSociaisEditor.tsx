import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
  Tooltip,
} from '@mui/material';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Save, 
  Trash2, 
  UserPlus, 
  Edit2, 
  MoreVertical,
  X
} from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';
import { Switch, FormControlLabel } from '@mui/material';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type OrganMember = {
  name: string;
  role: string;
  photoUrl: string;
  bio?: string;
  otherTitles?: string[];
  hyperlink?: string;
  active?: boolean;
};

type Organ = {
  id: string;
  title: string;
  description: string;
  color: string;
  members: OrganMember[];
};

type OrganMembersData = {
  updatedAt: string;
  organs: Organ[];
};

const DEFAULTS: OrganMembersData = {
  updatedAt: '',
  organs: [],
};

const CONSELHO_ADMIN_ID = 'conselho-administracao';

const CONSELHO_ADMIN_DEFAULT: Organ = {
  id: CONSELHO_ADMIN_ID,
  title: 'Conselho de Administração',
  description: 'Órgão responsável pela definição da estratégia e supervisão da gestão da Sociedade, garantindo a criação de valor sustentável.',
  color: '#164993',
  members: [
    { name: 'Eng. Mário Mota Lemos', role: 'Presidente do Conselho de Administração', photoUrl: '' },
    { name: 'Dra. Matilde Guebe', role: 'Administradora Executiva', photoUrl: '' },
    { name: 'Dra. Amália Quintão Barbosa', role: 'Administradora Executiva', photoUrl: '' },
    { name: 'Dr. Ildo do Nascimento', role: 'Administrador Executivo', photoUrl: '' },
    { name: 'Dr. Silvano Pinto Adriano', role: 'Administrador Executivo', photoUrl: '' },
    { name: 'Administrador Não Executivo', role: 'Administrador Não Executivo', photoUrl: '' },
    { name: 'Administrador Não Executivo', role: 'Administrador Não Executivo', photoUrl: '' },
  ],
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasConselhoAdministracao(data: OrganMembersData): boolean {
  return data.organs.some((o) => {
    const id = normalize(o.id || '');
    const title = normalize(o.title || '');
    return id === normalize(CONSELHO_ADMIN_ID) || title.includes('conselho de administracao');
  });
}

function ensureConselhoAdministracao(data: OrganMembersData): OrganMembersData {
  if (hasConselhoAdministracao(data)) return data;
  return {
    ...data,
    organs: [CONSELHO_ADMIN_DEFAULT, ...data.organs],
  };
}

/**
 * NEW: Component to edit a member in a popup
 */
function MemberEditDialog({
  open,
  onClose,
  member,
  color,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  member: OrganMember | null;
  color: string;
  onSave: (updated: OrganMember) => void;
}) {
  const [localMember, setLocalMember] = useState<OrganMember>({ name: '', role: '', photoUrl: '', bio: '', otherTitles: [], hyperlink: '', active: true });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    if (member) {
      setLocalMember({ active: true, otherTitles: [], ...member });
    } else {
      setLocalMember({ name: '', role: '', photoUrl: '', bio: '', otherTitles: [], hyperlink: '', active: true });
    }
    setTitleInput('');
  }, [member, open]);

  const addTitle = () => {
    const t = titleInput.trim();
    if (!t) return;
    setLocalMember(prev => ({ ...prev, otherTitles: [...(prev.otherTitles || []), t] }));
    setTitleInput('');
  };

  const removeTitle = (idx: number) => {
    setLocalMember(prev => ({ ...prev, otherTitles: (prev.otherTitles || []).filter((_, i) => i !== idx) }));
  };

  const currentInitials = localMember.name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {member ? 'Editar Membro' : 'Novo Membro'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  src={localMember.photoUrl}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: color + '15',
                    color: color,
                    fontSize: 32,
                    fontWeight: 900,
                    border: `2px solid ${alpha(color, 0.1)}`
                  }}
                >
                  {currentInitials}
                </Avatar>
              </Box>
              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>FOTO DO PERFIL</Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => setPickerOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}
                >
                  Selecionar da Biblioteca
                </Button>
                {localMember.photoUrl && (
                  <Typography variant="caption" sx={{ color: '#94a3b8', wordBreak: 'break-all' }}>
                    {localMember.photoUrl.split('/').pop()}
                  </Typography>
                )}
              </Stack>
            </Box>

            <TextField
              fullWidth
              label="Nome Completo"
              value={localMember.name}
              onChange={e => setLocalMember(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do membro"
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Cargo / Função"
              value={localMember.role}
              onChange={e => setLocalMember(prev => ({ ...prev, role: e.target.value }))}
              placeholder="Ex: Presidente, Vogal..."
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Hiperligação (abre em novo separador)"
              value={localMember.hyperlink || ''}
              onChange={e => setLocalMember(prev => ({ ...prev, hyperlink: e.target.value }))}
              placeholder="https://..."
              helperText="Quando preenchido, o card do membro abre este link ao ser clicado."
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Biografia"
              value={localMember.bio || ''}
              onChange={e => setLocalMember(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Escreva uma breve biografia..."
              multiline
              minRows={4}
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            {/* Other Titles */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>OUTROS TÍTULOS / QUALIFICAÇÕES</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <TextField
                  size="small"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTitle(); } }}
                  placeholder="Ex: MBA, CFA, PhD..."
                  InputProps={{ sx: { borderRadius: 2 } }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={addTitle}
                  disabled={!titleInput.trim()}
                  sx={{ borderRadius: 2, fontWeight: 700, minWidth: 60 }}
                >
                  + Add
                </Button>
              </Box>
              {(localMember.otherTitles || []).length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {(localMember.otherTitles || []).map((t, i) => (
                    <Chip key={i} label={t} size="small" onDelete={() => removeTitle(i)} sx={{ borderRadius: 2, fontWeight: 600 }} />
                  ))}
                </Box>
              )}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={localMember.active !== false}
                  onChange={e => setLocalMember(prev => ({ ...prev, active: e.target.checked }))}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {localMember.active !== false ? 'Card visível no site' : 'Card oculto no site'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Quando desactivado, este membro não aparece na página pública.
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            variant="contained" 
            onClick={() => onSave({ ...localMember, hyperlink: localMember.hyperlink?.trim() || undefined, otherTitles: (localMember.otherTitles || []).filter(t => t.trim()) })}
            disabled={!localMember.name}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            Guardar Membro
          </Button>
        </DialogActions>
      </Dialog>

      <SharedFilePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={f => { setLocalMember(prev => ({ ...prev, photoUrl: f.url })); setPickerOpen(false); }}
        title="Biblioteca de Imagens"
      />
    </>
  );
}

/**
 * Redesigned Member Card for the Editor
 */
function MemberCard({
  member,
  color,
  onEdit,
  onDelete,
}: {
  member: OrganMember;
  color: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 4px 20px ${alpha(color, 0.08)}`,
          transform: 'translateY(-2px)'
        },
        position: 'relative'
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={member.photoUrl}
          sx={{
            width: 56,
            height: 56,
            bgcolor: color + '12',
            color: color,
            fontWeight: 800,
            fontSize: '1.2rem',
            border: `1px solid ${alpha(color, 0.05)}`
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>
            {member.name || '(sem nome)'}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: '#64748b', display: 'block', fontWeight: 500 }}>
            {member.role || '(sem cargo)'}
          </Typography>
          {member.active === false && (
            <Chip label="Oculto" size="small" sx={{ mt: 0.5, bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: 10, height: 18 }} />
          )}
        </Box>
        <Stack direction="row">
          <Tooltip title="Editar">
            <IconButton size="small" onClick={onEdit} sx={{ color: '#64748b', '&:hover': { color: color, bgcolor: color + '10' } }}>
              <Edit2 size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={onDelete} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

function OrganCard({
  organ,
  organIndex,
  onOrganChange,
  onOrganDelete,
  onMemberEdit,
  onMemberDelete,
  onMemberAdd,
}: {
  organ: Organ;
  organIndex: number;
  onOrganChange: (idx: number, updated: Organ) => void;
  onOrganDelete: (idx: number) => void;
  onMemberEdit: (organIdx: number, memberIdx: number) => void;
  onMemberDelete: (organIdx: number, memberIdx: number) => void;
  onMemberAdd: (organIdx: number) => void;
}) {
  const [open, setOpen] = useState(organIndex === 0);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        mb: 3,
        bgcolor: 'white',
        boxShadow: open ? '0 10px 40px -10px rgba(0,0,0,0.05)' : 'none'
      }}
    >
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          cursor: 'pointer',
          bgcolor: open ? alpha(organ.color, 0.02) : 'white',
          borderLeft: `5px solid ${organ.color || '#e2e8f0'}`,
          '&:hover': { bgcolor: alpha(organ.color, 0.04) },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: organ.color + '15',
            color: organ.color
          }}>
            {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.2 }}>
              {organ.title || '(sem título)'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {organ.members.length} membro{organ.members.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            label={`ID: ${organ.id}`}
            size="small"
            sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 11 }}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); onOrganDelete(organIndex); }}
            sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}
          >
            <Trash2 size={16} />
          </IconButton>
        </Stack>
      </Box>

      {open && (
        <Box sx={{ p: 3, pt: 1 }}>
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Typography variant="overline" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: 1.5 }}>Configuração Geral</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Título do Órgão"
                  value={organ.title}
                  onChange={e => onOrganChange(organIndex, { ...organ, title: e.target.value })}
                  fullWidth
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Cor Identificadora"
                  value={organ.color}
                  onChange={e => onOrganChange(organIndex, { ...organ, color: e.target.value })}
                  fullWidth
                  InputProps={{
                    sx: { borderRadius: 2 },
                    startAdornment: (
                      <Box sx={{ width: 18, height: 18, borderRadius: '4px', bgcolor: organ.color, mr: 1, border: '1px solid rgba(0,0,0,0.05)' }} />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Descrição / Competências"
                  value={organ.description}
                  onChange={e => onOrganChange(organIndex, { ...organ, description: e.target.value })}
                  fullWidth
                  multiline
                  minRows={2}
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="overline" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: 1.5 }}>Lista de Membros</Typography>
            <Button
              size="small"
              variant="contained"
              disableElevation
              startIcon={<UserPlus size={14} />}
              onClick={() => onMemberAdd(organIndex)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: organ.color, '&:hover': { bgcolor: organ.color, opacity: 0.9 } }}
            >
              Novo Membro
            </Button>
          </Stack>

          {organ.members.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 4, bgcolor: '#f8fafc' }}>
              <Typography variant="body2" color="text.secondary">Nenhum membro adicionado a este órgão.</Typography>
              <Button size="small" onClick={() => onMemberAdd(organIndex)} sx={{ mt: 1, fontWeight: 700 }}>Clique aqui para começar</Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {organ.members.map((member, memberIdx) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={memberIdx}>
                  <MemberCard
                    member={member}
                    color={organ.color}
                    onEdit={() => onMemberEdit(organIndex, memberIdx)}
                    onDelete={() => onMemberDelete(organIndex, memberIdx)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default function OrgaosSociaisEditor() {
  const [data, setData] = useState<OrganMembersData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organsDirty, setOrgansDirty] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Member edit state
  const [editingMember, setEditingMember] = useState<{ organIdx: number; memberIdx: number | null } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/organ-members`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: OrganMembersData) => setData(ensureConselhoAdministracao(d)))
      .catch(() => setData(ensureConselhoAdministracao(DEFAULTS)))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const saveToApi = async (payload: OrganMembersData): Promise<OrganMembersData> => {
    const res = await fetch(`${API_BASE}/organ-members`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ensureConselhoAdministracao(payload)),
    });
    if (!res.ok) throw new Error();
    return res.json();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await saveToApi(data);
      setData(ensureConselhoAdministracao(updated));
      setOrgansDirty(false);
      showMsg('success', 'Órgãos sociais guardados com sucesso.');
    } catch {
      showMsg('error', 'Erro ao guardar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const updateOrgan = (organIdx: number, updated: Organ) => {
    setData(prev => ({
      ...prev,
      organs: prev.organs.map((o, i) => (i === organIdx ? updated : o)),
    }));
    setOrgansDirty(true);
  };

  const deleteOrgan = (organIdx: number) => {
    setData(prev => ({
      ...prev,
      organs: prev.organs.filter((_, i) => i !== organIdx),
    }));
    setOrgansDirty(true);
  };

  const addOrgan = () => {
    setData(prev => ({
      ...prev,
      organs: [
        ...prev.organs,
        {
          id: `organ-${Date.now()}`,
          title: '',
          description: '',
          color: '#164993',
          members: [],
        },
      ],
    }));
    setOrgansDirty(true);
  };

  // Member operations
  const handleOpenMemberEdit = (organIdx: number, memberIdx: number | null) => {
    setEditingMember({ organIdx, memberIdx });
  };

  const handleSaveMember = async (updated: OrganMember) => {
    if (!editingMember) return;
    const { organIdx, memberIdx } = editingMember;

    const newData: OrganMembersData = {
      ...data,
      organs: data.organs.map((o, i) => {
        if (i !== organIdx) return o;
        const newMembers = [...o.members];
        if (memberIdx === null) {
          newMembers.push(updated);
        } else {
          newMembers[memberIdx] = updated;
        }
        return { ...o, members: newMembers };
      }),
    };

    setEditingMember(null);

    try {
      setSaving(true);
      const saved = await saveToApi(newData);
      setData(ensureConselhoAdministracao(saved));
      showMsg('success', 'Membro guardado com sucesso.');
    } catch {
      setData(newData); // keep local changes even if API fails
      showMsg('error', 'Erro ao guardar o membro.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = (organIdx: number, memberIdx: number) => {
    if (!confirm('Tem a certeza que deseja remover este membro?')) return;
    setData(prev => ({
      ...prev,
      organs: prev.organs.map((o, i) =>
        i === organIdx ? { ...o, members: o.members.filter((_, j) => j !== memberIdx) } : o
      ),
    }));
  };

  const applyImageToEditingMember = (_url: string) => {};
  void applyImageToEditingMember;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 20, gap: 2 }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>A carregar dados...</Typography>
      </Box>
    );
  }

  const currentEditedMemberData = editingMember !== null && editingMember.memberIdx !== null
    ? data.organs[editingMember.organIdx].members[editingMember.memberIdx]
    : null;

  const currentEditedMemberColor = editingMember !== null
    ? data.organs[editingMember.organIdx].color
    : '#164993';

  return (
    <Box sx={{ pb: 10, maxWidth: '1200px', mx: 'auto' }}>
      <PageUrlBanner urls={{ path: '/governo/orgaos-sociais', label: 'Governança — Órgãos Sociais' }} />

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
            Editor de Órgãos Sociais
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Faça a gestão dos membros e competências de cada órgão da ENSA.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
          {!hasConselhoAdministracao(data) && (
            <Button
              variant="outlined"
              onClick={() => setData(prev => ensureConselhoAdministracao(prev))}
              sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 3 }}
            >
              Inserir Conselho Administração
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={addOrgan}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 3 }}
          >
            Adicionar Órgão
          </Button>
          {organsDirty && (
            <Button
              variant="contained"
              disableElevation
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 4 }}
            >
              {saving ? 'A guardar…' : 'Gravar Alterações'}
            </Button>
          )}
        </Stack>
      </Stack>

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }}>
          {msg.text}
        </Alert>
      )}

      <Stack spacing={1}>
        {data.organs.map((organ, organIdx) => (
          <OrganCard
            key={organ.id || organIdx}
            organ={organ}
            organIndex={organIdx}
            onOrganChange={updateOrgan}
            onOrganDelete={deleteOrgan}
            onMemberEdit={handleOpenMemberEdit}
            onMemberDelete={deleteMember}
            onMemberAdd={organIdx => handleOpenMemberEdit(organIdx, null)}
          />
        ))}
      </Stack>

      {data.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block', textAlign: 'center', fontWeight: 600 }}>
          Última atualização do sistema: {data.updatedAt}
        </Typography>
      )}

      {/* Member Editor Popup */}
      <MemberEditDialog
        open={editingMember !== null}
        onClose={() => setEditingMember(null)}
        member={currentEditedMemberData}
        color={currentEditedMemberColor}
        onSave={handleSaveMember}
      />
    </Box>
  );
}
