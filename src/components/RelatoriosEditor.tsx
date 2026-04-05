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
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import { Check, ChevronDown, ChevronRight, FileText, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

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

// ---- Financial Statement Card ----
function StatementCard({ item, onSave, onDelete }: {
  item: FinancialStatement;
  onSave: (i: FinancialStatement) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<FinancialStatement>(item);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item.id) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      setUploading(true);
      const r = await fetch(`${API_BASE}/financial-statements/${item.id}/upload`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error();
      const saved = await r.json();
      setData(p => ({ ...p, documentUrl: saved.url }));
      setMsg({ type: 'success', text: `"${file.name}" carregado.` });
    } catch { setMsg({ type: 'error', text: 'Erro no upload.' }); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const typeColor = STATEMENT_TYPE_COLORS[data.statementType] || STATEMENT_TYPE_COLORS['Outro'];

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', borderLeft: `4px solid ${typeColor.border}`, mb: 2, overflow: 'hidden' }}>
      <Box onClick={() => setOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.title || '(sem título)'}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.3, flexWrap: 'wrap' }}>
              <Chip label={String(data.year)} size="small" sx={{ height: 18, fontWeight: 700, fontSize: '0.65rem', bgcolor: '#eef4ff', color: '#164993' }} />
              <Chip label={data.statementType} size="small" sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: typeColor.chipBg, color: typeColor.chipText }} />
              <Chip label={data.language} size="small" sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#166534' }} />
            </Stack>
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
            <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} disabled={!editing} size="small" fullWidth />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Ano" type="number" value={data.year} onChange={e => setData(p => ({ ...p, year: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 110 }} />
              <TextField select label="Tipo" value={data.statementType} onChange={e => setData(p => ({ ...p, statementType: e.target.value }))} disabled={!editing} size="small" sx={{ minWidth: 200 }} SelectProps={{ native: true }}>
                {STATEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </TextField>
              <TextField select label="Idioma" value={data.language} onChange={e => setData(p => ({ ...p, language: e.target.value }))} disabled={!editing} size="small" sx={{ minWidth: 100 }} SelectProps={{ native: true }}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
              <TextField label="URL do Documento" value={data.documentUrl} onChange={e => setData(p => ({ ...p, documentUrl: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="https://..." />
              {editing && item.id && (
                <><Button size="small" variant="outlined" startIcon={uploading ? <CircularProgress size={13} /> : <Upload size={13} />} onClick={() => fileRef.current?.click()} disabled={uploading} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>Upload PDF</Button>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} /></>
              )}
              {editing && !item.id && <Typography variant="caption" sx={{ color: '#f59e0b', whiteSpace: 'nowrap' }}>⚠ Guarde primeiro</Typography>}
            </Stack>
            {data.documentUrl && <DocRow label="Ver Documento" url={data.documentUrl} />}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}

// ---- Governance Report Card ----
function GovReportCard({ item, onSave, onDelete }: {
  item: GovernanceReport;
  onSave: (i: GovernanceReport) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<GovernanceReport>(item);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item.id) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      setUploading(true);
      const r = await fetch(`${API_BASE}/corporate-governance-reports/${item.id}/upload`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error();
      const saved = await r.json();
      setData(p => ({ ...p, documentUrl: saved.url }));
      setMsg({ type: 'success', text: `"${file.name}" carregado.` });
    } catch { setMsg({ type: 'error', text: 'Erro no upload.' }); }
    finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', borderLeft: `4px solid ${GOV_REPORT_COLOR.border}`, mb: 2, overflow: 'hidden' }}>
      <Box onClick={() => setOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.title || '(sem título)'}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.3 }}>
              <Chip label={String(data.reportYear)} size="small" sx={{ height: 18, fontWeight: 700, fontSize: '0.65rem', bgcolor: GOV_REPORT_COLOR.chipBg, color: GOV_REPORT_COLOR.chipText }} />
              <Chip label={data.language} size="small" sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#166534' }} />
            </Stack>
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
            <TextField label="Título *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} disabled={!editing} size="small" fullWidth />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Ano" type="number" value={data.reportYear} onChange={e => setData(p => ({ ...p, reportYear: Number(e.target.value) }))} disabled={!editing} size="small" sx={{ minWidth: 110 }} />
              <TextField select label="Idioma" value={data.language} onChange={e => setData(p => ({ ...p, language: e.target.value }))} disabled={!editing} size="small" sx={{ minWidth: 100 }} SelectProps={{ native: true }}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
              <TextField label="URL do Documento" value={data.documentUrl} onChange={e => setData(p => ({ ...p, documentUrl: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="https://..." />
              {editing && item.id && (
                <><Button size="small" variant="outlined" startIcon={uploading ? <CircularProgress size={13} /> : <Upload size={13} />} onClick={() => fileRef.current?.click()} disabled={uploading} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>Upload PDF</Button>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} /></>
              )}
            </Stack>
            {data.documentUrl && <DocRow label="Ver Relatório" url={data.documentUrl} />}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
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
  statCards: [],
};

function DestaqueEditor() {
  const [data, setData] = useState<DestaqueData>(DESTAQUE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/annual-report-destaque`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: DestaqueData) => setData(d))
      .catch(() => setData(DESTAQUE_DEFAULTS))
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
            Banner principal no topo da página <code>/ensa/relatorio-contas</code>.
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

      {/* Stat cards */}
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Cartões de Métricas (lado direito do banner)
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Plus size={13} />}
            onClick={addCard}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Adicionar Métrica
          </Button>
        </Stack>

        {data.statCards.length === 0 && (
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Sem cartões de métricas. Clique em "Adicionar Métrica" para criar um.
          </Typography>
        )}

        <Stack spacing={2}>
          {data.statCards.map((card, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fafafa' }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                  Métrica #{idx + 1}
                </Typography>
                <IconButton size="small" color="error" onClick={() => deleteCard(idx)}>
                  <Trash2 size={13} />
                </IconButton>
              </Stack>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    label="Etiqueta / Título da Métrica"
                    value={card.label}
                    onChange={e => updateCard(idx, { ...card, label: e.target.value })}
                    size="small"
                    fullWidth
                    placeholder='ex: "ROE (Rentabilidade do Capital)"'
                  />
                  <TextField
                    label="Valor"
                    value={card.value}
                    onChange={e => updateCard(idx, { ...card, value: e.target.value })}
                    size="small"
                    sx={{ maxWidth: 140 }}
                    placeholder='ex: "13%"'
                  />
                  <TextField
                    label="Tendência"
                    value={card.trend}
                    onChange={e => updateCard(idx, { ...card, trend: e.target.value })}
                    size="small"
                    sx={{ maxWidth: 160 }}
                    placeholder='ex: "+4% vs 2023"'
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                  <TextField
                    label="Nota (texto secundário)"
                    value={card.note}
                    onChange={e => updateCard(idx, { ...card, note: e.target.value })}
                    size="small"
                    fullWidth
                    placeholder='ex: "Transparência e Governação de padrão mundial."'
                  />
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                      Barra de progresso
                    </Typography>
                    <Button
                      size="small"
                      variant={card.showProgress ? 'contained' : 'outlined'}
                      onClick={() => updateCard(idx, { ...card, showProgress: !card.showProgress })}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: 11 }}
                    >
                      {card.showProgress ? 'Ligada' : 'Desligada'}
                    </Button>
                    {card.showProgress && (
                      <TextField
                        label="Valor %"
                        type="number"
                        value={card.progressValue}
                        onChange={e => updateCard(idx, { ...card, progressValue: Math.min(100, Math.max(0, Number(e.target.value))) })}
                        size="small"
                        sx={{ width: 80 }}
                        inputProps={{ min: 0, max: 100 }}
                      />
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>
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
        <Tab label="🔵 Cartão Destaque" />
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
                : statements.map(s => <StatementCard key={s.id} item={s} onSave={saveStatement} onDelete={deleteStatement} />)
              : govReports.length === 0
                ? <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}><Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem relatórios de governação.</Typography></Paper>
                : govReports.map(r => <GovReportCard key={r.id} item={r} onSave={saveGovReport} onDelete={deleteGovReport} />)
          }
        </>
      )}
    </Box>
  );
}
