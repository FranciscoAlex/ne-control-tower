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
  Plus, 
  Save, 
  Trash2, 
  UserPlus, 
  Edit2, 
  X,
  Briefcase
} from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedImagePickerDialog from './SharedImagePickerDialog';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type OrganMember = {
  name: string;
  role: string;
  photoUrl: string;
  bio?: string;
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

const EXECUTIVE_ORGAN_ID = 'corpo-diretivo';

/**
 * Member Dialog specifically for Corpo Diretivo
 */
function MemberEditDialog({
  open,
  onClose,
  member,
  color,
  onSave,
  onOpenLibrary,
}: {
  open: boolean;
  onClose: () => void;
  member: OrganMember | null;
  color: string;
  onSave: (updated: OrganMember) => void;
  onOpenLibrary: () => void;
}) {
  const [localMember, setLocalMember] = useState<OrganMember>({ name: '', role: '', photoUrl: '', bio: '' });

  useEffect(() => {
    if (member) {
      setLocalMember(member);
    } else {
      setLocalMember({ name: '', role: '', photoUrl: '', bio: '' });
    }
  }, [member, open]);

  const currentInitials = localMember.name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
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
          {member ? 'Editar Membro Executivo' : 'Novo Membro Executivo'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
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
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>FOTO DO PERFIL / BG</Typography>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={onOpenLibrary}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}
              >
                Biblioteca
              </Button>
            </Stack>
          </Box>

          <TextField
            fullWidth
            label="Nome Completo"
            value={localMember.name}
            onChange={e => setLocalMember(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Dr. Mário Mota Lemos"
            InputProps={{ sx: { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            label="Cargo Executivo"
            value={localMember.role}
            onChange={e => setLocalMember(prev => ({ ...prev, role: e.target.value }))}
            placeholder="Ex: Presidente da Comissão Executiva (CEO)"
            InputProps={{ sx: { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            label="URL Foto (opcional)"
            value={localMember.photoUrl}
            onChange={e => setLocalMember(prev => ({ ...prev, photoUrl: e.target.value }))}
            placeholder="https://..."
            InputProps={{ sx: { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            label="Biografia Executiva"
            value={localMember.bio || ''}
            onChange={e => setLocalMember(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Escreva a biografia proeminente deste membro da Comissão Executiva..."
            multiline
            minRows={4}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          variant="contained" 
          onClick={() => onSave(localMember)}
          disabled={!localMember.name}
          sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
        >
          Guardar Membro
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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

export default function CorpoDiretivoEditor() {
  const [data, setData] = useState<OrganMembersData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [editingMemberIdx, setEditingMemberIdx] = useState<number | null | 'NEW'>(null);
  const [imageLibraryTarget, setImageLibraryTarget] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/organ-members`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: OrganMembersData) => setData(d))
      .catch(() => setData(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/organ-members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated: OrganMembersData = await res.json();
      setData(updated);
      showMsg('success', 'Corpo Directivo guardado com sucesso.');
    } catch {
      showMsg('error', 'Erro ao guardar os dados do Corpo Directivo.');
    } finally {
      setSaving(false);
    }
  };

  const ensureExecutiveOrgan = (currentData: OrganMembersData): { executive: Organ; updatedData: OrganMembersData } => {
    const existing = currentData.organs.find(o => o.id === EXECUTIVE_ORGAN_ID);
    if (existing) return { executive: existing, updatedData: currentData };

    const newExecutive: Organ = {
      id: EXECUTIVE_ORGAN_ID,
      title: 'Corpo Directivo',
      description: 'O Corpo Directivo é responsável por tomar as decisões estratégicas da Sociedade.',
      color: '#164993',
      members: [
        { name: 'Dr. Mário Mota Lemos', role: 'Presidente da Comissão Executiva (CEO)', photoUrl: '', bio: '' },
        { name: 'Dr.ª Matilde Guebe', role: 'Administradora Executiva', photoUrl: '', bio: '' },
        { name: 'Dr.ª Amália Quintão Barbosa', role: 'Administradora Executiva', photoUrl: '', bio: '' },
        { name: 'Dr. Ildo do Nascimento', role: 'Administrador Executivo', photoUrl: '', bio: '' },
        { name: 'Dr. Silvano Pinto Adriano', role: 'Administrador Executivo', photoUrl: '', bio: '' }
      ]
    };
    const clonedData = { ...currentData, organs: [...currentData.organs, newExecutive] };
    return { executive: newExecutive, updatedData: clonedData };
  };

  const { executive, updatedData } = ensureExecutiveOrgan(data);
  // Optional: keep local state consistently synced if it wasn't there
  useEffect(() => {
    if (!data.organs.find(o => o.id === EXECUTIVE_ORGAN_ID) && !loading) {
      setData(updatedData);
    }
  }, [data, loading, updatedData]);

  const updateExecutiveOrgan = (changes: Partial<Organ>) => {
    setData(prev => ({
      ...prev,
      organs: prev.organs.map(o => o.id === EXECUTIVE_ORGAN_ID ? { ...o, ...changes } : o),
    }));
  };

  const handleMemberSave = (updated: OrganMember) => {
    setData(prev => {
      return {
        ...prev,
        organs: prev.organs.map(o => {
          if (o.id !== EXECUTIVE_ORGAN_ID) return o;
          
          let newMembers = [...o.members];
          if (editingMemberIdx === 'NEW') {
            newMembers.push(updated);
          } else if (typeof editingMemberIdx === 'number') {
            newMembers[editingMemberIdx] = updated;
          }
          return { ...o, members: newMembers };
        })
      };
    });
    setEditingMemberIdx(null);
  };

  const deleteMember = (memberIdx: number) => {
    if (!confirm('Tem a certeza que deseja remover este executivo?')) return;
    setData(prev => ({
      ...prev,
      organs: prev.organs.map(o =>
        o.id === EXECUTIVE_ORGAN_ID ? { ...o, members: o.members.filter((_, j) => j !== memberIdx) } : o
      ),
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 20, gap: 2 }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>A carregar Corpo Directivo...</Typography>
      </Box>
    );
  }

  const currentEditedMemberData = typeof editingMemberIdx === 'number'
    ? executive.members[editingMemberIdx]
    : null;

  return (
    <Box sx={{ pb: 10, maxWidth: '1200px', mx: 'auto' }}>
      <PageUrlBanner urls={{ path: '/corpo-diretivo', label: 'Governança — Corpo Directivo' }} />

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
            Editor do Corpo Directivo
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Faça a gestão exclusiva do Corpo Directivo e seus membros.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <Button
            variant="contained"
            disableElevation
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            onClick={handleSaveAll}
            disabled={saving}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 4 }}
          >
            {saving ? 'A guardar…' : 'Gravar Alterações'}
          </Button>
        </Stack>
      </Stack>

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }}>
          {msg.text}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          mb: 3,
          bgcolor: 'white',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2.5,
            bgcolor: alpha(executive.color, 0.02),
            borderLeft: `5px solid ${executive.color}`,
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
              bgcolor: executive.color + '15',
              color: executive.color
            }}>
              <Briefcase size={18} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.2 }}>
                Informações da Comissão
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={`ID: ${executive.id}`}
            size="small"
            sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 11 }}
          />
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Título Principal"
                value={executive.title}
                onChange={e => updateExecutiveOrgan({ title: e.target.value })}
                fullWidth
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Cor (Herança)"
                value={executive.color}
                onChange={e => updateExecutiveOrgan({ color: e.target.value })}
                fullWidth
                InputProps={{
                  sx: { borderRadius: 2 },
                  startAdornment: (
                    <Box sx={{ width: 18, height: 18, borderRadius: '4px', bgcolor: executive.color, mr: 1, border: '1px solid rgba(0,0,0,0.05)' }} />
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Descrição Executiva"
                value={executive.description}
                onChange={e => updateExecutiveOrgan({ description: e.target.value })}
                fullWidth
                multiline
                minRows={2}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          p: 3,
          bgcolor: '#fff'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Directores ({executive.members.length})
          </Typography>
          <Button
            size="small"
            variant="contained"
            disableElevation
            startIcon={<UserPlus size={16} />}
            onClick={() => setEditingMemberIdx('NEW')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: executive.color, '&:hover': { bgcolor: executive.color, opacity: 0.9 }, px: 3, py: 1 }}
          >
            Adicionar Membro
          </Button>
        </Stack>

        {executive.members.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 4, bgcolor: '#f8fafc' }}>
            <Typography variant="body2" color="text.secondary">Nenhum membro configurado no Corpo Directivo.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {executive.members.map((member, memberIdx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={memberIdx}>
                <MemberCard
                  member={member}
                  color={executive.color}
                  onEdit={() => setEditingMemberIdx(memberIdx)}
                  onDelete={() => deleteMember(memberIdx)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Member Editor Popup */}
      <MemberEditDialog
        open={editingMemberIdx !== null}
        onClose={() => setEditingMemberIdx(null)}
        member={currentEditedMemberData}
        color={executive.color}
        onSave={handleMemberSave}
        onOpenLibrary={() => setImageLibraryTarget(true)}
      />

      <SharedImagePickerDialog
        open={imageLibraryTarget}
        onClose={() => setImageLibraryTarget(false)}
        onSelect={(url) => {
          setImageLibraryTarget(false);
          // Can implement direct logic here or expect user to copy/paste
        }}
        title="Biblioteca de Imagens"
      />
    </Box>
  );
}
