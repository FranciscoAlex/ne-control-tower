import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ChevronDown, ChevronRight, Plus, Save, Trash2, UserPlus } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type OrganMember = {
  name: string;
  role: string;
  photoUrl: string;
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

function MemberRow({
  member,
  index,
  color,
  onChange,
  onDelete,
}: {
  member: OrganMember;
  index: number;
  color: string;
  onChange: (idx: number, updated: OrganMember) => void;
  onDelete: (idx: number) => void;
}) {
  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        src={member.photoUrl || undefined}
        sx={{
          width: 44,
          height: 44,
          bgcolor: color + '22',
          color,
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        {initials}
      </Avatar>
      <Stack spacing={1} sx={{ flex: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            label="Nome"
            value={member.name}
            onChange={e => onChange(index, { ...member, name: e.target.value })}
            size="small"
            fullWidth
          />
          <TextField
            label="Cargo / Função"
            value={member.role}
            onChange={e => onChange(index, { ...member, role: e.target.value })}
            size="small"
            fullWidth
          />
        </Stack>
        <TextField
          label="URL Foto (opcional)"
          value={member.photoUrl}
          onChange={e => onChange(index, { ...member, photoUrl: e.target.value })}
          size="small"
          fullWidth
          placeholder="https://..."
        />
      </Stack>
      <IconButton color="error" size="small" onClick={() => onDelete(index)} sx={{ mt: 0.5 }}>
        <Trash2 size={15} />
      </IconButton>
    </Paper>
  );
}

function OrganCard({
  organ,
  organIndex,
  onOrganChange,
  onOrganDelete,
  onMemberChange,
  onMemberDelete,
  onMemberAdd,
}: {
  organ: Organ;
  organIndex: number;
  onOrganChange: (idx: number, updated: Organ) => void;
  onOrganDelete: (idx: number) => void;
  onMemberChange: (organIdx: number, memberIdx: number, updated: OrganMember) => void;
  onMemberDelete: (organIdx: number, memberIdx: number) => void;
  onMemberAdd: (organIdx: number) => void;
}) {
  const [open, setOpen] = useState(organIndex === 0);

  return (
    <Paper
      sx={{
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        mb: 2,
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          cursor: 'pointer',
          bgcolor: open ? '#f8fafc' : 'white',
          '&:hover': { bgcolor: '#f8fafc' },
          borderLeft: `4px solid ${organ.color || '#e2e8f0'}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton size="small" tabIndex={-1}>
            {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </IconButton>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
              {organ.title || '(sem título)'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {organ.members.length} membro{organ.members.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`#${organ.id}`}
            size="small"
            sx={{ bgcolor: organ.color + '18', color: organ.color, fontWeight: 700, fontSize: 11 }}
          />
          <IconButton
            size="small"
            color="error"
            onClick={e => { e.stopPropagation(); onOrganDelete(organIndex); }}
            title="Eliminar órgão"
          >
            <Trash2 size={15} />
          </IconButton>
        </Stack>
      </Box>

      {open && (
        <Box sx={{ px: 3, pb: 3 }}>
          {/* Organ metadata */}
          <Stack spacing={2} sx={{ mt: 2, mb: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Título"
                value={organ.title}
                onChange={e => onOrganChange(organIndex, { ...organ, title: e.target.value })}
                size="small"
                fullWidth
              />
              <TextField
                label="Cor (hex)"
                value={organ.color}
                onChange={e => onOrganChange(organIndex, { ...organ, color: e.target.value })}
                size="small"
                sx={{ maxWidth: 160 }}
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '4px',
                        bgcolor: organ.color,
                        mr: 1,
                        flexShrink: 0,
                      }}
                    />
                  ),
                }}
              />
            </Stack>
            <TextField
              label="Descrição do Órgão"
              value={organ.description}
              onChange={e => onOrganChange(organIndex, { ...organ, description: e.target.value })}
              size="small"
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>

          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
              Membros
            </Typography>
          </Divider>

          <Stack spacing={1.5}>
            {organ.members.map((member, memberIdx) => (
              <MemberRow
                key={memberIdx}
                member={member}
                index={memberIdx}
                color={organ.color}
                onChange={(mIdx, updated) => onMemberChange(organIndex, mIdx, updated)}
                onDelete={mIdx => onMemberDelete(organIndex, mIdx)}
              />
            ))}
          </Stack>

          <Button
            size="small"
            variant="outlined"
            startIcon={<UserPlus size={14} />}
            onClick={() => onMemberAdd(organIndex)}
            sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Adicionar Membro
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default function OrgaosSociaisEditor() {
  const [data, setData] = useState<OrganMembersData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSave = async () => {
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
      showMsg('success', 'Órgãos sociais guardados com sucesso.');
    } catch {
      showMsg('error', 'Erro ao guardar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const updateOrgan = (organIdx: number, updated: Organ) =>
    setData(prev => ({
      ...prev,
      organs: prev.organs.map((o, i) => (i === organIdx ? updated : o)),
    }));

  const updateMember = (organIdx: number, memberIdx: number, updated: OrganMember) =>
    setData(prev => ({
      ...prev,
      organs: prev.organs.map((o, i) =>
        i === organIdx
          ? { ...o, members: o.members.map((m, j) => (j === memberIdx ? updated : m)) }
          : o
      ),
    }));

  const deleteMember = (organIdx: number, memberIdx: number) =>
    setData(prev => ({
      ...prev,
      organs: prev.organs.map((o, i) =>
        i === organIdx ? { ...o, members: o.members.filter((_, j) => j !== memberIdx) } : o
      ),
    }));

  const addMember = (organIdx: number) =>
    setData(prev => ({
      ...prev,
      organs: prev.organs.map((o, i) =>
        i === organIdx
          ? { ...o, members: [...o.members, { name: '', role: '', photoUrl: '' }] }
          : o
      ),
    }));

  const addOrgan = () =>
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

  const deleteOrgan = (organIdx: number) =>
    setData(prev => ({
      ...prev,
      organs: prev.organs.filter((_, i) => i !== organIdx),
    }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      <PageUrlBanner urls={{ path: '/orgaos-sociais', label: 'Governança — Órgãos Sociais' }} />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Edite os membros de cada órgão exibidos em{' '}
            <Box
              component="code"
              sx={{ fontSize: 12, bgcolor: '#f1f5f9', px: 0.5, borderRadius: 0.5 }}
            >
              /ensa/orgaos-sociais
            </Box>
            . O Conselho de Administração é gerido na secção{' '}
            <strong>Corpo Directivo</strong>.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />
          }
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', flexShrink: 0 }}
        >
          {saving ? 'A guardar…' : 'Guardar Tudo'}
        </Button>
      </Stack>

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {msg.text}
        </Alert>
      )}

      {data.organs.map((organ, organIdx) => (
        <OrganCard
          key={organ.id || organIdx}
          organ={organ}
          organIndex={organIdx}
          onOrganChange={updateOrgan}
          onOrganDelete={deleteOrgan}
          onMemberChange={updateMember}
          onMemberDelete={deleteMember}
          onMemberAdd={addMember}
        />
      ))}

      <Button
        variant="outlined"
        startIcon={<Plus size={16} />}
        onClick={addOrgan}
        sx={{ mb: 2, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
      >
        Adicionar Órgão
      </Button>

      {data.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Última gravação: {data.updatedAt}
        </Typography>
      )}
    </Box>
  );
}
