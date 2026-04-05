import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
  Tooltip,
} from '@mui/material';
import { Plus, Pencil, Trash2, Calendar, X, Check, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type Item = { date: string; desc: string };
type Group = { id: string; title: string; color: string; items: Item[] };
type CalendarioData = { updatedAt?: string; groups: Group[] };

const PRESET_COLORS = ['#164993', '#10b981', '#e63c2e', '#f59e0b', '#6366f1', '#0ea5e9', '#8b5cf6', '#ec4899'];

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').substring(0, 40) + '-' + Date.now();
}

export default function CalendarioDivulgacoesEditor() {
  const [data, setData] = useState<CalendarioData>({ groups: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Which groups are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Group being edited inline (title/color)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupDraft, setGroupDraft] = useState<{ title: string; color: string }>({ title: '', color: '#164993' });

  // Item form state: { groupId, itemIndex (null = new), date, desc }
  const [itemForm, setItemForm] = useState<{ groupId: string; itemIndex: number | null; date: string; desc: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/calendario-divulgacoes`);
      if (!res.ok) throw new Error();
      const d: CalendarioData = await res.json();
      setData(d);
      const exp: Record<string, boolean> = {};
      d.groups.forEach(g => { exp[g.id] = true; });
      setExpanded(exp);
    } catch {
      setMessage('Erro ao carregar calendário do backend.');
    } finally {
      setLoading(false);
    }
  };

  const save = async (payload: CalendarioData) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/calendario-divulgacoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const saved: CalendarioData = await res.json();
      setData(saved);
      setMessage('Calendário guardado com sucesso!');
    } catch {
      setMessage('Erro ao guardar no backend.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Group operations ──────────────────────────────────────────────────────

  const addGroup = () => {
    const newGroup: Group = { id: slugify('novo-grupo'), title: 'Novo Grupo', color: '#164993', items: [] };
    const updated = { ...data, groups: [...data.groups, newGroup] };
    setData(updated);
    setExpanded(prev => ({ ...prev, [newGroup.id]: true }));
    setEditingGroupId(newGroup.id);
    setGroupDraft({ title: newGroup.title, color: newGroup.color });
  };

  const startEditGroup = (g: Group) => {
    setEditingGroupId(g.id);
    setGroupDraft({ title: g.title, color: g.color });
    setItemForm(null);
  };

  const confirmEditGroup = () => {
    if (!editingGroupId || !groupDraft.title.trim()) return;
    const updated = {
      ...data,
      groups: data.groups.map(g =>
        g.id === editingGroupId ? { ...g, title: groupDraft.title.trim(), color: groupDraft.color } : g
      ),
    };
    save(updated);
    setEditingGroupId(null);
  };

  const deleteGroup = (groupId: string) => {
    if (!window.confirm('Tem a certeza que pretende eliminar este grupo e todos os seus items?')) return;
    const updated = { ...data, groups: data.groups.filter(g => g.id !== groupId) };
    save(updated);
  };

  // ── Item operations ───────────────────────────────────────────────────────

  const openItemForm = (groupId: string, itemIndex: number | null) => {
    const group = data.groups.find(g => g.id === groupId);
    if (!group) return;
    if (itemIndex === null) {
      setItemForm({ groupId, itemIndex: null, date: '', desc: '' });
    } else {
      const item = group.items[itemIndex];
      setItemForm({ groupId, itemIndex, date: item.date, desc: item.desc });
    }
    setEditingGroupId(null);
  };

  const confirmItem = () => {
    if (!itemForm || !itemForm.desc.trim()) return;
    const updated = {
      ...data,
      groups: data.groups.map(g => {
        if (g.id !== itemForm.groupId) return g;
        const items = [...g.items];
        const newItem = { date: itemForm.date.trim(), desc: itemForm.desc.trim() };
        if (itemForm.itemIndex === null) {
          items.push(newItem);
        } else {
          items[itemForm.itemIndex] = newItem;
        }
        return { ...g, items };
      }),
    };
    save(updated);
    setItemForm(null);
  };

  const deleteItem = (groupId: string, itemIndex: number) => {
    const updated = {
      ...data,
      groups: data.groups.map(g => {
        if (g.id !== groupId) return g;
        return { ...g, items: g.items.filter((_, i) => i !== itemIndex) };
      }),
    };
    save(updated);
  };

  if (loading) {
    return <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>A carregar calendário...</Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Calendar size={22} color="#164993" />
          <Box>
            <Chip label="/ensa/calendario-divulgacoes" size="small"
              sx={{ fontWeight: 700, bgcolor: '#eef4ff', color: '#164993', mb: 0.5, display: 'block' }} />
            <Typography variant="body2" color="text.secondary">
              Cada grupo é um card na página. Dentro de cada grupo, adicione as datas e descrições.
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={addGroup}
          sx={{ borderRadius: 3, fontWeight: 700 }}>
          Novo Grupo de Card
        </Button>
      </Stack>

      {message && (
        <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: message.includes('Erro') ? '#b91c1c' : '#166534' }}>
          {message}
        </Typography>
      )}

      {data.groups.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 5, border: '1px dashed #cbd5e1' }}>
          <Typography color="text.secondary">Nenhum grupo criado. Clique em "Novo Grupo de Card" para começar.</Typography>
        </Paper>
      )}

      <Stack spacing={3}>
        {data.groups.map((group) => (
          <Paper key={group.id} sx={{ borderRadius: 5, border: `2px solid ${alpha(group.color, 0.25)}`, overflow: 'hidden' }}>

            {/* Group header bar */}
            <Box sx={{ bgcolor: alpha(group.color, 0.06), px: 3, py: 2, borderBottom: `1px solid ${alpha(group.color, 0.15)}` }}>
              {editingGroupId === group.id ? (
                // Inline group editor
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small"
                    label="Título do Grupo"
                    value={groupDraft.title}
                    onChange={e => setGroupDraft(p => ({ ...p, title: e.target.value }))}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                    autoFocus
                  />
                  {/* Color picker */}
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {PRESET_COLORS.map(c => (
                      <Box key={c} onClick={() => setGroupDraft(p => ({ ...p, color: c }))}
                        sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                          border: groupDraft.color === c ? '3px solid #1e293b' : '2px solid transparent',
                          transition: 'border 0.1s' }} />
                    ))}
                  </Stack>
                  <Tooltip title="Confirmar"><IconButton size="small" onClick={confirmEditGroup} disabled={saving}
                    sx={{ bgcolor: group.color, color: 'white', '&:hover': { bgcolor: group.color } }}>
                    <Check size={16} />
                  </IconButton></Tooltip>
                  <Tooltip title="Cancelar"><IconButton size="small" onClick={() => setEditingGroupId(null)}>
                    <X size={16} />
                  </IconButton></Tooltip>
                </Stack>
              ) : (
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1.5} alignItems="center"
                    onClick={() => setExpanded(p => ({ ...p, [group.id]: !p[group.id] }))}
                    sx={{ cursor: 'pointer', flex: 1 }}>
                    <GripVertical size={16} color="#94a3b8" />
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: group.color, flexShrink: 0 }} />
                    <Typography sx={{ fontWeight: 800, color: '#1e293b' }}>{group.title}</Typography>
                    <Chip label={`${group.items.length} item${group.items.length !== 1 ? 's' : ''}`}
                      size="small" sx={{ fontWeight: 600, bgcolor: alpha(group.color, 0.1), color: group.color, ml: 1 }} />
                    {expanded[group.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Editar grupo"><IconButton size="small" onClick={() => startEditGroup(group)}
                      sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}><Pencil size={14} /></IconButton></Tooltip>
                    <Tooltip title="Eliminar grupo"><IconButton size="small" onClick={() => deleteGroup(group.id)}
                      sx={{ border: '1px solid #fee2e2', color: '#e63c2e', borderRadius: 2 }}><Trash2 size={14} /></IconButton></Tooltip>
                  </Stack>
                </Stack>
              )}
            </Box>

            {/* Items list — collapsible */}
            {expanded[group.id] && (
              <Box sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  {group.items.map((item, idx) => (
                    <Box key={idx}>
                      {itemForm?.groupId === group.id && itemForm.itemIndex === idx ? (
                        // Inline item editor
                        <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${alpha(group.color, 0.3)}` }}>
                          <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                              <TextField size="small" label="Data (ex: 20/08/2025)" value={itemForm.date}
                                onChange={e => setItemForm(p => p ? { ...p, date: e.target.value } : p)}
                                sx={{ minWidth: 180 }} />
                              <TextField size="small" label="Descrição *" value={itemForm.desc} fullWidth
                                onChange={e => setItemForm(p => p ? { ...p, desc: e.target.value } : p)} />
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="contained" onClick={confirmItem} disabled={saving}
                                startIcon={<Check size={14} />} sx={{ fontWeight: 700, borderRadius: 2 }}>
                                {saving ? 'A guardar...' : 'Guardar'}
                              </Button>
                              <Button size="small" variant="outlined" onClick={() => setItemForm(null)} sx={{ borderRadius: 2 }}>
                                Cancelar
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      ) : (
                        // Item row
                        <Stack direction="row" alignItems="center" justifyContent="space-between"
                          sx={{ px: 2, py: 1.5, borderRadius: 3, bgcolor: '#f8fafc',
                            '&:hover': { bgcolor: alpha(group.color, 0.04) } }}>
                          <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: group.color, mt: 0.7, flexShrink: 0 }} />
                            <Box>
                              {item.date && (
                                <Typography variant="caption" sx={{ fontWeight: 800, color: group.color, display: 'block', mb: 0.25 }}>
                                  {item.date.toUpperCase()}
                                </Typography>
                              )}
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                                {item.desc}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={0.75}>
                            <IconButton size="small" onClick={() => openItemForm(group.id, idx)}
                              sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}><Pencil size={13} /></IconButton>
                            <IconButton size="small" onClick={() => deleteItem(group.id, idx)}
                              sx={{ border: '1px solid #fee2e2', color: '#e63c2e', borderRadius: 2 }}><Trash2 size={13} /></IconButton>
                          </Stack>
                        </Stack>
                      )}
                    </Box>
                  ))}

                  {/* Add item form */}
                  {itemForm?.groupId === group.id && itemForm.itemIndex === null ? (
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px dashed ${alpha(group.color, 0.4)}` }}>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField size="small" label="Data (ex: 20/08/2025)" value={itemForm.date}
                            onChange={e => setItemForm(p => p ? { ...p, date: e.target.value } : p)}
                            sx={{ minWidth: 180 }} autoFocus />
                          <TextField size="small" label="Descrição *" value={itemForm.desc} fullWidth
                            onChange={e => setItemForm(p => p ? { ...p, desc: e.target.value } : p)} />
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" onClick={confirmItem} disabled={saving}
                            startIcon={<Check size={14} />} sx={{ fontWeight: 700, borderRadius: 2 }}>
                            {saving ? 'A guardar...' : 'Adicionar'}
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => setItemForm(null)} sx={{ borderRadius: 2 }}>
                            Cancelar
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ) : (
                    <Button size="small" startIcon={<Plus size={14} />}
                      onClick={() => openItemForm(group.id, null)}
                      sx={{ alignSelf: 'flex-start', color: group.color, fontWeight: 700,
                        border: `1px dashed ${alpha(group.color, 0.4)}`, borderRadius: 3, px: 2,
                        '&:hover': { bgcolor: alpha(group.color, 0.05) } }}>
                      Adicionar item
                    </Button>
                  )}
                </Stack>

                {group.items.length > 0 && <Divider sx={{ mt: 2 }} />}
              </Box>
            )}
          </Paper>
        ))}
      </Stack>

      {data.groups.length > 0 && (
        <Typography variant="caption" sx={{ mt: 3, display: 'block', color: '#94a3b8' }}>
          Última actualização: {data.updatedAt || '—'} — As alterações são guardadas automaticamente ao confirmar cada item.
        </Typography>
      )}
    </Box>
  );
}
