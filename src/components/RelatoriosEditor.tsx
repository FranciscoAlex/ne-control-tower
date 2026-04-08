import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';
import { BarChart2, Check, ChevronDown, ChevronRight, FileText, Pencil, Plus, Trash2, TrendingUp, Upload, X } from 'lucide-react';
import { RefreshCw } from 'lucide-react';

const KPI_COLORS = ['#164993', '#e63c2e', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

// --- Types ---
type FinancialStatement = {
  id?: number;
  year: number;
  title: string;
  documentUrl: string;
  statementType: string;
  language: string;
};

type GovernanceReport = {
  id?: number;
  title: string;
  documentUrl: string;
  reportYear: number;
  language: string;
};

const STATEMENT_TYPES = ['Relatório e Contas', 'Demonstração Financeira', 'Relatório de Auditoria', 'Relatório Intercalar', 'Outro'];
const LANGUAGES = ['PT', 'EN'];

const STATEMENT_TYPE_COLORS: Record<string, { border: string; chipBg: string; chipText: string }> = {
  'Relatório e Contas':        { border: '#3b82f6', chipBg: '#eff6ff', chipText: '#1d4ed8' },
  'Demonstração Financeira':   { border: '#6366f1', chipBg: '#eef2ff', chipText: '#4338ca' },
  'Relatório de Auditoria':    { border: '#8b5cf6', chipBg: '#f5f3ff', chipText: '#6d28d9' },
  'Relatório Intercalar':      { border: '#f59e0b', chipBg: '#fffbeb', chipText: '#b45309' },
  'Outro':                     { border: '#94a3b8', chipBg: '#f1f5f9', chipText: '#475569' },
};
const GOV_REPORT_COLOR = { border: '#14b8a6', chipBg: '#f0fdfa', chipText: '#0f766e' };

// ---- Generic document row card ----
function DocRow({ label, url }: { label: string; url: string }) {
  if (!url) return null;
  return (
    <Chip
      icon={<FileText size={13} />}
      label={label}
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      clickable
      size="small"
      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
}

// ---- Financial Statement Card (grid card + edit dialog) ----
function StatementCard({ item, onSave, onDelete }: {
  item: FinancialStatement;
  onSave: (i: FinancialStatement) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<FinancialStatement>(item);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setDraft(item); }, [item]);

  const handleOpen = () => { setDraft({ ...item }); setDialogOpen(true); };
  const handleClose = () => { setDialogOpen(false); setMsg(null); setConfirmDelete(false); };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(draft);
      handleClose();
    } catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const typeColor = STATEMENT_TYPE_COLORS[item.statementType] || STATEMENT_TYPE_COLORS['Outro'];

  return (
    <>
      {/* Visual grid card */}
      <Paper
        elevation={0}
        onClick={handleOpen}
        sx={{
          p: 2.5,
          border: '1px solid #e2e8f0',
          borderLeft: `4px solid ${typeColor.border}`,
          borderRadius: 3,
          cursor: 'pointer',
          position: 'relative',
          bgcolor: '#fafafa',
          transition: 'box-shadow 0.15s, background-color 0.15s',
          '&:hover': { boxShadow: '0 2px 12px rgba(22,73,147,0.10)', bgcolor: 'white' },
        }}
      >
        {/* action buttons */}
        <Tooltip title="Editar" sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton size="small" onClick={e => { e.stopPropagation(); handleOpen(); }} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
            <Pencil size={13} />
          </IconButton>
        </Tooltip>

        {/* year badge */}
        <Chip
          label={String(item.year)}
          size="small"
          sx={{ height: 18, fontWeight: 700, fontSize: '0.65rem', bgcolor: '#eef4ff', color: '#164993', mb: 1 }}
        />

        {/* title */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', pr: 7, mb: 1, lineHeight: 1.35 }}>
          {item.title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sem título</span>}
        </Typography>

        {/* chips row */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            label={item.statementType}
            size="small"
            sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: typeColor.chipBg, color: typeColor.chipText }}
          />
          <Chip
            label={item.language}
            size="small"
            sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#166534' }}
          />
        </Stack>

      </Paper>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FileText size={18} color={typeColor.border} />
            <span>{item.id ? 'Editar Demonstração' : 'Nova Demonstração'}</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, mt: 1, borderRadius: 2 }}>{msg.text}</Alert>}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Título *"
              value={draft.title}
              onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
              size="small"
              fullWidth
              autoFocus
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ano"
                type="number"
                value={draft.year}
                onChange={e => setDraft(p => ({ ...p, year: Number(e.target.value) }))}
                size="small"
                sx={{ minWidth: 110 }}
              />
              <TextField
                select
                label="Tipo"
                value={draft.statementType}
                onChange={e => setDraft(p => ({ ...p, statementType: e.target.value }))}
                size="small"
                fullWidth
                SelectProps={{ native: true }}
              >
                {STATEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </TextField>
              <TextField
                select
                label="Idioma"
                value={draft.language}
                onChange={e => setDraft(p => ({ ...p, language: e.target.value }))}
                size="small"
                sx={{ minWidth: 100 }}
                SelectProps={{ native: true }}
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </TextField>
            </Stack>
            {draft.documentUrl && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: '#f8fafc', borderRadius: 2, px: 1.5, py: 0.75 }}>
                <FileText size={14} color="#64748b" />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', flex: 1 }}>
                  {draft.documentUrl.split('/').pop() || draft.documentUrl}
                </Typography>
                <Tooltip title="Remover documento">
                  <IconButton size="small" onClick={() => setDraft(p => ({ ...p, documentUrl: '' }))} sx={{ p: 0.25 }}>
                    <X size={13} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<Upload size={13} />}
              onClick={() => setPickerOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', borderStyle: 'dashed', color: '#64748b', borderColor: '#cbd5e1', alignSelf: 'flex-start' }}
            >
              Biblioteca
            </Button>
            <SharedFilePicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              onSelect={f => { setDraft(p => ({ ...p, documentUrl: f.url })); setPickerOpen(false); }}
            />
          </Stack>

          {confirmDelete && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              Tem a certeza? Esta acção não pode ser desfeita.
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" color="error" variant="contained" onClick={() => { onDelete(item.id!); handleClose(); }} sx={{ textTransform: 'none' }}>
                  Sim, remover
                </Button>
                <Button size="small" onClick={() => setConfirmDelete(false)} sx={{ textTransform: 'none' }}>
                  Cancelar
                </Button>
              </Stack>
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {item.id && !confirmDelete && (
            <Button
              color="error"
              startIcon={<Trash2 size={14} />}
              onClick={() => setConfirmDelete(true)}
              sx={{ textTransform: 'none', mr: 'auto' }}
            >
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

// ---- Governance Report Card (grid card + edit dialog) ----
function GovReportCard({ item, onSave, onDelete }: {
  item: GovernanceReport;
  onSave: (i: GovernanceReport) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<GovernanceReport>(item);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setDraft(item); }, [item]);

  const handleOpen = () => { setDraft({ ...item }); setDialogOpen(true); };
  const handleClose = () => { setDialogOpen(false); setMsg(null); setConfirmDelete(false); };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(draft);
      handleClose();
    } catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  return (
    <>
      {/* Visual grid card */}
      <Paper
        elevation={0}
        onClick={handleOpen}
        sx={{
          p: 2.5,
          border: '1px solid #e2e8f0',
          borderLeft: `4px solid ${GOV_REPORT_COLOR.border}`,
          borderRadius: 3,
          cursor: 'pointer',
          position: 'relative',
          bgcolor: '#fafafa',
          transition: 'box-shadow 0.15s, background-color 0.15s',
          '&:hover': { boxShadow: '0 2px 12px rgba(20,184,166,0.12)', bgcolor: 'white' },
        }}
      >
        {/* action buttons */}
        <Tooltip title="Editar" sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton size="small" onClick={e => { e.stopPropagation(); handleOpen(); }} sx={{ bgcolor: '#f0fdfa', '&:hover': { bgcolor: '#ccfbf1' } }}>
            <Pencil size={13} />
          </IconButton>
        </Tooltip>

        {/* year badge */}
        <Chip
          label={String(item.reportYear)}
          size="small"
          sx={{ height: 18, fontWeight: 700, fontSize: '0.65rem', bgcolor: GOV_REPORT_COLOR.chipBg, color: GOV_REPORT_COLOR.chipText, mb: 1 }}
        />

        {/* title */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', pr: 7, mb: 1, lineHeight: 1.35 }}>
          {item.title || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sem título</span>}
        </Typography>

        {/* language chip */}
        <Chip
          label={item.language}
          size="small"
          sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#166534' }}
        />

      </Paper>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FileText size={18} color={GOV_REPORT_COLOR.border} />
            <span>Editar Relatório de Governação</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, mt: 1, borderRadius: 2 }}>{msg.text}</Alert>}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Título *"
              value={draft.title}
              onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
              size="small"
              fullWidth
              autoFocus
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ano"
                type="number"
                value={draft.reportYear}
                onChange={e => setDraft(p => ({ ...p, reportYear: Number(e.target.value) }))}
                size="small"
                sx={{ minWidth: 110 }}
              />
              <TextField
                select
                label="Idioma"
                value={draft.language}
                onChange={e => setDraft(p => ({ ...p, language: e.target.value }))}
                size="small"
                sx={{ minWidth: 100 }}
                SelectProps={{ native: true }}
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </TextField>
            </Stack>
            {draft.documentUrl && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: '#f8fafc', borderRadius: 2, px: 1.5, py: 0.75 }}>
                <FileText size={14} color="#64748b" />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', flex: 1 }}>
                  {draft.documentUrl.split('/').pop() || draft.documentUrl}
                </Typography>
                <Tooltip title="Remover documento">
                  <IconButton size="small" onClick={() => setDraft(p => ({ ...p, documentUrl: '' }))} sx={{ p: 0.25 }}>
                    <X size={13} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<Upload size={13} />}
              onClick={() => setPickerOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', borderStyle: 'dashed', color: '#64748b', borderColor: '#cbd5e1', alignSelf: 'flex-start' }}
            >
              Biblioteca
            </Button>
            <SharedFilePicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              onSelect={f => { setDraft(p => ({ ...p, documentUrl: f.url })); setPickerOpen(false); }}
            />
          </Stack>

          {confirmDelete && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              Tem a certeza? Esta acção não pode ser desfeita.
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" color="error" variant="contained" onClick={() => { onDelete(item.id!); handleClose(); }} sx={{ textTransform: 'none' }}>
                  Sim, remover
                </Button>
                <Button size="small" onClick={() => setConfirmDelete(false)} sx={{ textTransform: 'none' }}>
                  Cancelar
                </Button>
              </Stack>
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {item.id && !confirmDelete && (
            <Button
              color="error"
              startIcon={<Trash2 size={14} />}
              onClick={() => setConfirmDelete(true)}
              sx={{ textTransform: 'none', mr: 'auto' }}
            >
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

// ---- New forms ----
function NewStatementForm({ onSubmit, onCancel }: { onSubmit: (i: FinancialStatement) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<FinancialStatement>({ year: new Date().getFullYear(), title: '', documentUrl: '', statementType: 'Relatório e Contas', language: 'PT' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!data.title.trim()) { setErr('Título obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Nova Demonstração Financeira</Typography>
      <Stack spacing={2}>
        <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} size="small" fullWidth autoFocus />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Ano" type="number" value={data.year} onChange={e => setData(p => ({ ...p, year: Number(e.target.value) }))} size="small" sx={{ minWidth: 110 }} />
          <TextField select label="Tipo" value={data.statementType} onChange={e => setData(p => ({ ...p, statementType: e.target.value }))} size="small" sx={{ minWidth: 200 }} SelectProps={{ native: true }}>
            {STATEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </TextField>
          <TextField select label="Idioma" value={data.language} onChange={e => setData(p => ({ ...p, language: e.target.value }))} size="small" sx={{ minWidth: 100 }} SelectProps={{ native: true }}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </TextField>
        </Stack>
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={submit} disabled={saving || !data.title.trim()} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Criar</Button>
          <Button onClick={onCancel} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function NewGovReportForm({ onSubmit, onCancel }: { onSubmit: (i: GovernanceReport) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<GovernanceReport>({ reportYear: new Date().getFullYear(), title: '', documentUrl: '', language: 'PT' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!data.title.trim()) { setErr('Título obrigatório.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #7c3aed', bgcolor: '#fdf9ff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#7c3aed', mb: 2 }}>Novo Relatório de Governação</Typography>
      <Stack spacing={2}>
        <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} size="small" fullWidth autoFocus />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Ano" type="number" value={data.reportYear} onChange={e => setData(p => ({ ...p, reportYear: Number(e.target.value) }))} size="small" sx={{ minWidth: 110 }} />
          <TextField select label="Idioma" value={data.language} onChange={e => setData(p => ({ ...p, language: e.target.value }))} size="small" sx={{ minWidth: 100 }} SelectProps={{ native: true }}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </TextField>
        </Stack>
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={submit} disabled={saving || !data.title.trim()} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>Criar</Button>
          <Button onClick={onCancel} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ---- Destaque Editor ----
type StatCard = {
  id: string;
  label: string;
  value: string;
  trend: string;
  progressValue: number;
  showProgress: boolean;
  note: string;
};

type DestaqueData = {
  updatedAt: string;
  badgeLabel: string;
  subtitle: string;
  headline: string;
  description: string;
  downloadUrl: string;
  downloadLabel: string;
  statCards: StatCard[];
};

const DESTAQUE_DEFAULTS: DestaqueData = {
  updatedAt: '',
  badgeLabel: 'DESTAQUE 2024',
  subtitle: 'Relatório e Contas Consolidado',
  headline: 'Resultados que reflectem a nossa Solidez',
  description: '',
  downloadUrl: '',
  downloadLabel: 'Baixar Relatório Completo',
  statCards: [
    { id: 'premios-brutos', label: 'Prémios Brutos Emitidos', value: '473.1B AOA', trend: '+12.5% vs 2023', progressValue: 0, showProgress: false, note: '' },
    { id: 'resultado-liquido', label: 'Resultado Líquido', value: '18.4B AOA', trend: '+8.2% vs 2023', progressValue: 0, showProgress: false, note: '' },
    { id: 'quota-mercado', label: 'Quota de Mercado', value: '37%', trend: '+2.1% vs 2023', progressValue: 37, showProgress: true, note: '' },
    { id: 'capital-proprio', label: 'Capital Próprio', value: '98.4B AOA', trend: '+5.4% vs 2023', progressValue: 0, showProgress: false, note: '' },
  ],
};

// ---- KPI Cards Grid + Edit Dialog ----
interface KpiCardsGridProps {
  cards: StatCard[];
  onUpdate: (idx: number, card: StatCard) => void;
  onDelete: (idx: number) => void;
  onAdd: () => void;
  onReset: () => void;
}

function KpiCardsGrid({ cards, onUpdate, onDelete, onAdd, onReset }: KpiCardsGridProps) {
  const [editCard, setEditCard] = useState<{ idx: number; draft: StatCard } | null>(null);

  const handleOpen = (idx: number) => setEditCard({ idx, draft: { ...cards[idx] } });
  const handleClose = () => setEditCard(null);
  const handleSave = () => {
    if (!editCard) return;
    onUpdate(editCard.idx, editCard.draft);
    setEditCard(null);
  };
  const patchDraft = (patch: Partial<StatCard>) =>
    setEditCard(p => p ? { ...p, draft: { ...p.draft, ...patch } } : p);

  return (
    <>
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Cartões de Métricas KPI
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Cartões visíveis em <code>/relatorio-contas</code> abaixo do banner azul — (ex: Prémios Brutos, Resultado Líquido…). Clique no lápis para editar.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0, ml: 2 }}>
            <Tooltip title="Apagar todos e voltar aos valores originais">
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<RefreshCw size={13} />}
                onClick={onReset}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Repor
              </Button>
            </Tooltip>
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {cards.map((card, idx) => (
            <Paper
              key={card.id || idx}
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                position: 'relative',
                bgcolor: '#fafafa',
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: '0 2px 12px rgba(22,73,147,0.10)' },
              }}
            >
              {/* action buttons */}
              <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Tooltip title="Editar cartão">
                  <IconButton size="small" onClick={() => handleOpen(idx)} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
                    <Pencil size={13} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remover">
                  <IconButton size="small" color="error" onClick={() => onDelete(idx)} sx={{ bgcolor: '#fff1f2', '&:hover': { bgcolor: '#ffe4e6' } }}>
                    <Trash2 size={13} />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* colour indicator bar */}
              <Box sx={{ width: 32, height: 4, borderRadius: 2, bgcolor: KPI_COLORS[idx % KPI_COLORS.length], mb: 1.5 }} />

              {/* label */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.5, pr: 6, lineHeight: 1.3 }}>
                {card.label || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Sem título</span>}
              </Typography>

              {/* value */}
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.5, lineHeight: 1.1 }}>
                {card.value || <span style={{ fontSize: '1rem', fontWeight: 400, color: '#94a3b8', fontStyle: 'italic' }}>Sem valor</span>}
              </Typography>

              {/* trend chip */}
              {card.trend && (
                <Chip
                  label={card.trend}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#ecfdf5', color: '#059669', mb: 0.5 }}
                />
              )}

              {/* progress bar preview */}
              {card.showProgress && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, card.progressValue))}
                    sx={{ borderRadius: 2, height: 5, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: KPI_COLORS[idx % KPI_COLORS.length] } }}
                  />
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>{card.progressValue}%</Typography>
                </Box>
              )}

              {/* note */}
              {card.note && (
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.75, lineHeight: 1.4 }}>
                  {card.note}
                </Typography>
              )}
            </Paper>
          ))}

          {/* add-card tile */}
          <Paper
            elevation={0}
            onClick={onAdd}
            sx={{
              p: 2.5,
              border: '2px dashed #cbd5e1',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              minHeight: 120,
              transition: 'all 0.15s',
              '&:hover': { borderColor: '#164993', bgcolor: '#f0f6ff' },
            }}
          >
            <Stack alignItems="center" spacing={0.75}>
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#e8effb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color="#164993" />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                Adicionar Métrica
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={!!editCard}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BarChart2 size={18} color="#164993" />
            <span>Editar Cartão KPI</span>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {editCard && (
            <Stack spacing={2.5} sx={{ pt: 1.5 }}>
              <TextField
                label="Título da Métrica"
                value={editCard.draft.label}
                onChange={e => patchDraft({ label: e.target.value })}
                size="small"
                fullWidth
                autoFocus
                placeholder='ex: "Prémios Brutos Emitidos"'
                helperText="Nome curto que aparece no topo do cartão."
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Valor"
                  value={editCard.draft.value}
                  onChange={e => patchDraft({ value: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder='ex: "473.1B AOA"'
                  helperText="Número ou texto em destaque."
                />
                <TextField
                  label="Tendência"
                  value={editCard.draft.trend}
                  onChange={e => patchDraft({ trend: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder='ex: "+12.5% vs 2023"'
                  helperText="Aparece como chip verde."
                />
              </Stack>

              <TextField
                label="Nota (texto secundário)"
                value={editCard.draft.note}
                onChange={e => patchDraft({ note: e.target.value })}
                size="small"
                fullWidth
                placeholder='ex: "Relativo ao ano fiscal 2024."'
              />

              <Divider />

              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Barra de progresso</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Mostrar uma barra de progresso no cartão (ex: quota de mercado: 37%).
                  </Typography>
                </Box>
                <Switch
                  checked={editCard.draft.showProgress}
                  onChange={e => patchDraft({ showProgress: e.target.checked })}
                  size="small"
                />
              </Stack>

              {editCard.draft.showProgress && (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', minWidth: 80 }}>
                      Percentagem
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#164993', minWidth: 48, textAlign: 'right' }}>
                      {editCard.draft.progressValue}%
                    </Typography>
                    <TextField
                      type="number"
                      value={editCard.draft.progressValue}
                      onChange={e => patchDraft({ progressValue: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      size="small"
                      sx={{ width: 80 }}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Stack>
                  <Slider
                    value={editCard.draft.progressValue}
                    onChange={(_e, val) => patchDraft({ progressValue: val as number })}
                    min={0}
                    max={100}
                    step={1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={v => `${v}%`}
                    sx={{
                      color: '#164993',
                      '& .MuiSlider-thumb': { width: 20, height: 20 },
                      '& .MuiSlider-track': { height: 8, borderRadius: 4 },
                      '& .MuiSlider-rail': { height: 8, borderRadius: 4, bgcolor: '#e2e8f0' },
                    }}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={editCard.draft.progressValue}
                    sx={{ borderRadius: 2, height: 6, mt: 0.5, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#164993' } }}
                  />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>0%</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>100%</Typography>
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<Check size={14} />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function DestaqueEditor() {
  const [data, setData] = useState<DestaqueData>(DESTAQUE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/annual-report-destaque`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: DestaqueData) => {
        const initialised = d.statCards && d.statCards.length > 0 ? d : { ...d, statCards: DESTAQUE_DEFAULTS.statCards };
        setData(initialised);
        if (!d.statCards || d.statCards.length === 0) {
          // auto-seed the 4 KPI cards into the backend
          fetch(`${API_BASE}/annual-report-destaque`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialised),
          }).catch(() => { /* silent — user can always save manually */ });
        }
      })
      .catch(() => {
        setData(DESTAQUE_DEFAULTS);
        fetch(`${API_BASE}/annual-report-destaque`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DESTAQUE_DEFAULTS),
        }).catch(() => { /* silent */ });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/annual-report-destaque`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated: DestaqueData = await res.json();
      setData(updated);
      setMsg({ type: 'success', text: 'Destaque guardado com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const updateCard = (idx: number, updated: StatCard) =>
    setData(p => ({ ...p, statCards: p.statCards.map((c, i) => (i === idx ? updated : c)) }));

  const deleteCard = (idx: number) =>
    setData(p => ({ ...p, statCards: p.statCards.filter((_, i) => i !== idx) }));

  const addCard = () =>
    setData(p => ({
      ...p,
      statCards: [
        ...p.statCards,
        { id: `card-${p.statCards.length + 1}`, label: '', value: '', trend: '', progressValue: 0, showProgress: false, note: '' },
      ],
    }));

  if (loading) return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Cartão Destaque (banner azul)
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Banner principal no topo da página <code>/ensa/relatorio-contas</code>, incluindo os cartões de métricas KPI (Prémios Brutos, Resultado Líquido, Capital Próprio, etc.).
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check size={14} />}
          disabled={saving}
          onClick={handleSave}
          sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
        >
          {saving ? 'A guardar…' : 'Guardar Destaque'}
        </Button>
      </Stack>

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      {/* Editorial content */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Conteúdo Editorial</Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label='Etiqueta do Badge (ex: "DESTAQUE 2024")'
              value={data.badgeLabel}
              onChange={e => setData(p => ({ ...p, badgeLabel: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label='Subtítulo (ex: "Relatório e Contas Consolidado")'
              value={data.subtitle}
              onChange={e => setData(p => ({ ...p, subtitle: e.target.value }))}
              size="small"
              fullWidth
            />
          </Stack>
          <TextField
            label="Título Principal (headline)"
            value={data.headline}
            onChange={e => setData(p => ({ ...p, headline: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Descrição / Corpo do texto"
            value={data.description}
            onChange={e => setData(p => ({ ...p, description: e.target.value }))}
            size="small"
            fullWidth
            multiline
            minRows={3}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="URL do PDF para Download"
              value={data.downloadUrl}
              onChange={e => setData(p => ({ ...p, downloadUrl: e.target.value }))}
              size="small"
              fullWidth
              placeholder="https://... (deixe vazio para ocultar o botão)"
            />
            <TextField
              label="Texto do Botão de Download"
              value={data.downloadLabel}
              onChange={e => setData(p => ({ ...p, downloadLabel: e.target.value }))}
              size="small"
              fullWidth
              placeholder='ex: "Baixar Relatório Completo (12.4 MB)"'
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Stat cards — visual grid with edit popup */}
      <KpiCardsGrid
        cards={data.statCards}
        onUpdate={updateCard}
        onDelete={deleteCard}
        onAdd={addCard}
        onReset={async () => {
          setData(p => ({ ...p, statCards: DESTAQUE_DEFAULTS.statCards }));
          try {
            setSaving(true);
            const res = await fetch(`${API_BASE}/annual-report-destaque`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, statCards: DESTAQUE_DEFAULTS.statCards }),
            });
            if (!res.ok) throw new Error();
            setMsg({ type: 'success', text: 'Cartões repostos para os valores padrão.' });
          } catch {
            setMsg({ type: 'info', text: 'Cartões repostos localmente (API offline).' });
          } finally {
            setSaving(false);
          }
        }}
      />
    </Box>
  );
}

// ---- Main Editor ----
export default function RelatoriosEditor() {
  const [tab, setTab] = useState(0);
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [govReports, setGovReports] = useState<GovernanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_BASE}/financial-statements`),
        fetch(`${API_BASE}/corporate-governance-reports`),
      ]);
      const data1 = await r1.json();
      setStatements(Array.isArray(data1) ? data1 : []);
      const gr = await r2.json();
      setGovReports(Array.isArray(gr) ? gr : []);
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // --- Statements CRUD ---
  const createStatement = async (i: FinancialStatement) => {
    const r = await fetch(`${API_BASE}/financial-statements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(i) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setStatements(p => [saved, ...p]);
    setShowNew(false);
    setMsg({ type: 'success', text: 'Criado.' });
  };
  const saveStatement = async (i: FinancialStatement) => {
    const r = await fetch(`${API_BASE}/financial-statements/${i.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(i) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setStatements(p => p.map(x => x.id === saved.id ? saved : x));
  };
  const deleteStatement = async (id: number) => {
    await fetch(`${API_BASE}/financial-statements/${id}`, { method: 'DELETE' });
    setStatements(p => p.filter(x => x.id !== id));
    setMsg({ type: 'success', text: 'Removido.' });
  };

  // --- Gov Reports CRUD ---
  const createGovReport = async (i: GovernanceReport) => {
    const r = await fetch(`${API_BASE}/corporate-governance-reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(i) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setGovReports(p => [saved, ...p]);
    setShowNew(false);
    setMsg({ type: 'success', text: 'Criado.' });
  };
  const saveGovReport = async (i: GovernanceReport) => {
    const r = await fetch(`${API_BASE}/corporate-governance-reports/${i.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(i) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setGovReports(p => p.map(x => x.id === saved.id ? saved : x));
  };
  const deleteGovReport = async (id: number) => {
    await fetch(`${API_BASE}/corporate-governance-reports/${id}`, { method: 'DELETE' });
    setGovReports(p => p.filter(x => x.id !== id));
    setMsg({ type: 'success', text: 'Removido.' });
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Demonstrações financeiras e relatórios de governação corporativa.</Typography>
        </Box>
        {tab !== 2 && (
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Novo Documento</Button>
        )}
      </Stack>
      <PageUrlBanner urls={[
        { label: 'Relatórios Anuais', path: '/relatorio-contas' },
        { label: 'R. Trimestral', path: '/relatorio-trimestral' },
        { label: 'R. Semestral', path: '/relatorio-semestral' },
      ]} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setShowNew(false); }} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}>
        <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>Demonstrações Financeiras</span><Chip label={statements.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }} /></Stack>} />
        <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>Relatórios de Governação</span><Chip label={govReports.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }} /></Stack>} />
        <Tab label="🔵 Destaque + Métricas KPI" />
      </Tabs>

      {tab === 2 ? (
        <DestaqueEditor />
      ) : (
        <>
          {showNew && (
            tab === 0
              ? <NewStatementForm onSubmit={createStatement} onCancel={() => setShowNew(false)} />
              : <NewGovReportForm onSubmit={createGovReport} onCancel={() => setShowNew(false)} />
          )}

          {loading
            ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
            : tab === 0
              ? statements.length === 0
                ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem documentos.</Typography></Paper>
                : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                    {statements.map(s => <StatementCard key={s.id} item={s} onSave={saveStatement} onDelete={deleteStatement} />)}
                  </Box>
              : govReports.length === 0
                ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem relatórios de governação.</Typography></Paper>
                : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                    {govReports.map(r => <GovReportCard key={r.id} item={r} onSave={saveGovReport} onDelete={deleteGovReport} />)}
                  </Box>
          }
        </>
      )}
    </Box>
  );
}
