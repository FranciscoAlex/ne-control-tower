import { useEffect, useState } from 'react';
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Check, Edit2, ExternalLink, Paperclip, Plus, Trash2, X } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type PolicyItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  fileUrl?: string;
  fileName?: string;
};

type PoliticasData = {
  updatedAt: string;
  items: PolicyItem[];
};

type AssetItem = {
  name: string;
  url: string;
  path: string;
  extension?: string;
  sizeBytes?: string;
  insertedAt?: string;
};

const getExt = (name: string) =>
  name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';

const isImageExt = (ext: string) =>
  ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);

const formatBytes = (v?: string) => {
  const b = Number(v || 0);
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const DEFAULT_ITEMS: PolicyItem[] = [
  { id: 'p-1', sortOrder: 1, question: '1. O QUE É O FATCA?', answer: 'O FATCA resulta do acordo entre Angola e os EUA para identificar contas detidas por Pessoas dos EUA e reportar informações financeiras à AGT, nos termos aplicáveis.' },
  { id: 'p-2', sortOrder: 2, question: '2. QUEM É CONSIDERADO PESSOA DOS EUA?', answer: 'Inclui cidadãos norte-americanos (incluindo dupla nacionalidade), titulares de Green Card, pessoas com nascimento/residência fiscal nos EUA e entidades com beneficiários efectivos enquadráveis.' },
  { id: 'p-3', sortOrder: 3, question: '3. QUAL O IMPACTO PARA CLIENTES ENSA?', answer: 'A ENSA mantém processos de qualificação e reporte para os casos obrigatórios por lei, sem impacto generalizado para a maioria dos clientes.' },
  { id: 'p-4', sortOrder: 4, question: '4. LEGISLAÇÃO ANGOLANA RELEVANTE', answer: 'Decreto Legislativo Presidencial n.º 1/17; Decreto Presidencial n.º 33/20; Despacho n.º 1169/20 (no âmbito do regime de reporte FATCA).' },
];

function newItem(sortOrder: number): PolicyItem {
  return { id: `p-${Date.now()}`, question: '', answer: '', sortOrder };
}

// ─── Edit dialog ──────────────────────────────────────────────────────────────
function BlockDialog({
  item,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  item: PolicyItem;
  open: boolean;
  onClose: () => void;
  onSave: (updated: PolicyItem) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<PolicyItem>(item);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => { setDraft(item); }, [item, open]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {draft.question ? draft.question.slice(0, 40) + (draft.question.length > 40 ? '…' : '') : 'Novo Bloco'}
          </Typography>
          <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Pergunta / Título"
              value={draft.question}
              onChange={e => setDraft(d => ({ ...d, question: e.target.value }))}
              size="small" fullWidth
              placeholder="Ex: 1. O QUE É O FATCA?"
              helperText={draft.fileUrl ? '✓ Este título será um link de download no site' : undefined}
              FormHelperTextProps={{ sx: { color: '#166534', fontWeight: 600 } }}
            />
            <TextField
              label="Resposta / Corpo do texto"
              value={draft.answer}
              onChange={e => setDraft(d => ({ ...d, answer: e.target.value }))}
              size="small" fullWidth multiline minRows={4}
              placeholder="Texto explicativo..."
            />
            <Box>
              {draft.fileUrl ? (
                <Stack direction="row" spacing={1} alignItems="center"
                  sx={{ p: 1.5, borderRadius: 2, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }}>
                  <Paperclip size={14} color="#166534" />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', flexGrow: 1 }} noWrap>
                    {draft.fileName || draft.fileUrl}
                  </Typography>
                  <Tooltip title="Abrir ficheiro">
                    <IconButton size="small" component="a" href={draft.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={13} />
                    </IconButton>
                  </Tooltip>
                  <Button size="small" onClick={() => setPickerOpen(true)} sx={{ textTransform: 'none', fontSize: 11, minWidth: 0, px: 1, color: '#64748b' }}>Trocar</Button>
                  <IconButton size="small" onClick={() => setDraft(d => ({ ...d, fileUrl: undefined, fileName: undefined }))} sx={{ color: '#dc2626' }}>
                    <X size={13} />
                  </IconButton>
                </Stack>
              ) : (
                <Button
                  variant="outlined" size="small" startIcon={<Paperclip size={14} />}
                  onClick={() => setPickerOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', borderStyle: 'dashed', color: '#64748b', borderColor: '#cbd5e1' }}
                >
                  Anexar ficheiro a este bloco
                </Button>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button size="small" color="error" startIcon={<Trash2 size={14} />} onClick={() => { onDelete(); onClose(); }} sx={{ textTransform: 'none' }}>
            Eliminar
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancelar</Button>
            <Button variant="contained" onClick={() => { onSave(draft); onClose(); }} sx={{ textTransform: 'none', fontWeight: 700 }}>Guardar</Button>
          </Stack>
        </DialogActions>
      </Dialog>
      <SharedFilePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={f => setDraft(d => ({ ...d, fileUrl: f.url, fileName: f.name }))} />
    </>
  );
}

// ─── Small card ───────────────────────────────────────────────────────────────
function BlockCard({ item, idx, onEdit }: { item: PolicyItem; idx: number; onEdit: () => void }) {
  return (
    <Paper
      onClick={onEdit}
      sx={{
        p: 2, borderRadius: 3, border: '1px solid #e2e8f0', cursor: 'pointer',
        transition: 'all .15s',
        '&:hover': { borderColor: '#93c5fd', boxShadow: '0 4px 12px rgba(59,130,246,0.12)', transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Chip label={idx + 1} size="small" sx={{ minWidth: 28, bgcolor: '#eef4ff', color: '#164993', fontWeight: 800, borderRadius: 1, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.question || '(sem título)'}
          </Typography>
        </Box>
        {item.fileUrl && <Tooltip title="Tem ficheiro anexado"><Paperclip size={13} color="#64748b" /></Tooltip>}
        <Edit2 size={14} color="#94a3b8" />
      </Stack>
    </Paper>
  );
}
export default function PoliticasEditor() {
  const [items, setItems] = useState<PolicyItem[]>(DEFAULT_ITEMS);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/governance/politicas`);
        if (!r.ok) throw new Error('not found');
        const data: PoliticasData = await r.json();
        if (Array.isArray(data.items) && data.items.length > 0) setItems(data.items);
        setUpdatedAt(data.updatedAt || '');
      } catch {
        // backend not yet seeded — defaults stay
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload: PoliticasData = {
        updatedAt: new Date().toISOString(),
        items: items.map((it, idx) => ({ ...it, sortOrder: idx + 1 })),
      };
      const r = await fetch(`${API_BASE}/governance/politicas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error();
      const saved: PoliticasData = await r.json();
      if (Array.isArray(saved.items)) setItems(saved.items);
      setUpdatedAt(saved.updatedAt || '');
      setMsg({ type: 'success', text: 'Políticas guardadas com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar. Verifique a ligação ao backend.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress /></Stack>;
  }

  return (
    <Box>
      <PageUrlBanner urls={{ label: 'Políticas Institucionais', path: '/governanca/politicas' }} />

      <Stack spacing={3}>
        {msg && (
          <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ borderRadius: 2 }}>
            {msg.text}
          </Alert>
        )}

        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
              Blocos de Informação
            </Typography>
            <Chip label={`${items.length} bloco${items.length !== 1 ? 's' : ''}`} size="small"
              sx={{ bgcolor: '#eef4ff', color: '#164993', fontWeight: 700 }} />
          </Stack>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Cada bloco tem título, texto e um ficheiro opcional. Clique num cartão para editar.
          </Typography>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          {items.map((item, idx) => (
            <BlockCard key={item.id} item={item} idx={idx} onEdit={() => setEditIdx(idx)} />
          ))}
          {items.length === 0 && (
            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', gridColumn: '1/-1' }}>
              Sem blocos. Clique em "Adicionar Bloco" para criar.
            </Typography>
          )}
        </Box>

        {editIdx !== null && items[editIdx] && (
          <BlockDialog
            item={items[editIdx]}
            open={editIdx !== null}
            onClose={() => setEditIdx(null)}
            onSave={updated => setItems(prev => prev.map((it, i) => i === editIdx ? updated : it))}
            onDelete={() => { setItems(prev => prev.filter((_, i) => i !== editIdx)); setEditIdx(null); }}
          />
        )}

        <Button
          variant="outlined"
          startIcon={<Plus size={16} />}
          onClick={() => {
            const newIdx = items.length;
            setItems(prev => [...prev, newItem(prev.length + 1)]);
            setTimeout(() => setEditIdx(newIdx), 0);
          }}
          sx={{ alignSelf: 'flex-start', borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
        >
          Adicionar Bloco
        </Button>

        <Divider />

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check size={14} />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
          >
            {saving ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
          {updatedAt && (
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Última actualização: {new Date(updatedAt).toLocaleString('pt-PT')}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
