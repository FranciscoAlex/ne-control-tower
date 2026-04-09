import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Check, ChevronDown, ChevronRight, ChevronUp, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

const iconOptions = [
  'People', 'Store', 'Assignment', 'Autorenew', 'Payments', 'LocalHospital',
  'PieChart', 'AccountBalanceWallet', 'Group', 'AccountBalance',
  'BusinessCenter', 'Insights', 'TrendingUp', 'Security', 'VerifiedUser',
];

type MainIndicator = {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconKey: string;
};

type ValuePoint = {
  year: string;
  value: number;
  growth: string;
};

type RiskPoint = {
  year: string;
  rate: number;
  change: string;
};

type FinancialIndicatorsPageDTO = {
  route: string;
  title: string;
  year: number;
  updatedAt: string;
  mainIndicators: MainIndicator[];
  highlightSection: {
    eyebrow: string;
    title: string;
    description: string;
    annualGrowthValue: string;
    annualGrowthLabel: string;
    cornerLabel: string;
    cornerValue: string;
    chartData: ValuePoint[];
  };
  premiumsChart: {
    title: string;
    footnote: string;
    accentText: string;
    data: ValuePoint[];
  };
  claimsChart: {
    title: string;
    footnote: string;
    accentText: string;
    data: ValuePoint[];
  };
  riskSection: {
    title: string;
    panelTitle: string;
    data: RiskPoint[];
  };
};

const emptyPayload: FinancialIndicatorsPageDTO = {
  route: '/ensa/indicadores-financeiros',
  title: 'Principais Indicadores da Companhia em 2025',
  year: 2025,
  updatedAt: '',
  mainIndicators: [],
  highlightSection: { eyebrow: '', title: '', description: '', annualGrowthValue: '', annualGrowthLabel: '', cornerLabel: '', cornerValue: '', chartData: [] },
  premiumsChart: { title: '', footnote: '', accentText: '', data: [] },
  claimsChart: { title: '', footnote: '', accentText: '', data: [] },
  riskSection: { title: '', panelTitle: '', data: [] },
};

/* ── Collapsible section wrapper ── */
function SectionCard({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#f8fafc' } }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{title}</Typography>
        <IconButton size="small" tabIndex={-1}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Stack spacing={2}>{children}</Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}

/* ── Main indicator read/edit card ── */
function MainIndicatorCard({ item, index, onChange, onDelete }: {
  item: MainIndicator;
  index: number;
  onChange: (patch: Partial<MainIndicator>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setDraft(item); }, [item]);

  const set = (patch: Partial<MainIndicator>) => setDraft(p => ({ ...p, ...patch }));
  const save = () => { onChange(draft); setEditing(false); setShowAdvanced(false); };
  const cancel = () => { setDraft(item); setEditing(false); setShowAdvanced(false); };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: editing ? '1.5px solid #164993' : '1px solid #e2e8f0',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        '&:hover .ind-edit-btn': { opacity: 1 },
      }}
    >
      {/* Read row */}
      {!editing && (
        <Box
          onClick={() => setEditing(true)}
          sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', gap: 2, '&:hover': { bgcolor: '#f8fafc' } }}
        >
          <Box sx={{ minWidth: 80, bgcolor: alpha('#164993', 0.08), borderRadius: 1.5, px: 1.25, py: 0.6, textAlign: 'center', flexShrink: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#164993', lineHeight: 1 }}>{item.value || '—'}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }} noWrap>{item.label || '(sem rótulo)'}</Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 0.3 }}>
              <Chip label={item.change || '—'} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 700, bgcolor: item.isPositive ? alpha('#16a34a', 0.1) : alpha('#ef4444', 0.1), color: item.isPositive ? '#166534' : '#b91c1c' }} />
              <Chip label={item.iconKey} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569' }} />
            </Stack>
          </Box>
          <Stack direction="row" spacing={0.5} onClick={e => e.stopPropagation()} sx={{ flexShrink: 0 }}>
            <Tooltip title="Editar">
              <IconButton className="ind-edit-btn" size="small" onClick={() => setEditing(true)}
                sx={{ opacity: 0, transition: 'opacity 0.15s', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
                <Pencil size={13} />
              </IconButton>
            </Tooltip>
            {!confirmDelete
              ? <Tooltip title="Remover"><IconButton size="small" color="error" onClick={() => setConfirmDelete(true)}
                  sx={{ bgcolor: alpha('#ef4444', 0.08), '&:hover': { bgcolor: alpha('#ef4444', 0.18) } }}>
                  <Trash2 size={13} />
                </IconButton></Tooltip>
              : <>
                  <Button size="small" color="error" variant="contained" onClick={onDelete} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 11, height: 28 }}>Remover</Button>
                  <Button size="small" onClick={() => setConfirmDelete(false)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 11, height: 28 }}>Cancelar</Button>
                </>
            }
          </Stack>
        </Box>
      )}

      {/* Edit form */}
      {editing && (
        <Box sx={{ px: 2, py: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField label="Rótulo *" value={draft.label} onChange={e => set({ label: e.target.value })} size="small" fullWidth autoFocus />
              <TextField label="Valor" value={draft.value} onChange={e => set({ value: e.target.value })} size="small" sx={{ minWidth: 120 }} placeholder="ex: 18.4%" />
              <TextField label="Variação" value={draft.change} onChange={e => set({ change: e.target.value })} size="small" sx={{ minWidth: 130 }} placeholder="ex: +5.2%" />
            </Stack>

            <Box>
              <Button size="small" onClick={() => setShowAdvanced(v => !v)}
                endIcon={showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                sx={{ textTransform: 'none', color: '#64748b', fontSize: 12, px: 0 }}>
                {showAdvanced ? 'Ocultar avançado' : 'Mais opções'}
              </Button>
              <Collapse in={showAdvanced}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
                  <TextField select label="Tendência" value={draft.isPositive ? 'positive' : 'negative'} onChange={e => set({ isPositive: e.target.value === 'positive' })} size="small" sx={{ minWidth: 130 }}>
                    <MenuItem value="positive">Positiva ↑</MenuItem>
                    <MenuItem value="negative">Negativa ↓</MenuItem>
                  </TextField>
                  <TextField select label="Ícone" value={draft.iconKey} onChange={e => set({ iconKey: e.target.value })} size="small" fullWidth>
                    {iconOptions.map(ic => <MenuItem key={ic} value={ic}>{ic}</MenuItem>)}
                  </TextField>
                  <TextField label="ID (técnico)" value={draft.id} onChange={e => set({ id: e.target.value })} size="small" sx={{ minWidth: 140 }} />
                </Stack>
              </Collapse>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={save} disabled={!draft.label.trim()}
                startIcon={<Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Guardar</Button>
              <Button size="small" onClick={cancel} startIcon={<X size={13} />}
                sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}>Cancelar</Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

/* ── Compact chart data row ── */
function ValueRow({ item, index, label1, label2, label3, onChange, onDelete }: {
  item: ValuePoint; index: number; label1?: string; label2?: string; label3?: string;
  onChange: (patch: Partial<ValuePoint>) => void; onDelete: () => void;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
      <TextField label={label1 ?? 'Ano'} value={item.year} onChange={e => onChange({ year: e.target.value })} size="small" sx={{ minWidth: 80 }} />
      <TextField label={label2 ?? 'Valor'} type="number" value={item.value} onChange={e => onChange({ value: Number(e.target.value) || 0 })} size="small" sx={{ minWidth: 100 }} />
      <TextField label={label3 ?? 'Crescimento'} value={item.growth} onChange={e => onChange({ growth: e.target.value })} size="small" fullWidth placeholder="ex: +12%" />
      <Tooltip title="Remover linha">
        <IconButton size="small" color="error" onClick={onDelete} sx={{ flexShrink: 0 }}>
          <Trash2 size={14} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function RiskRow({ item, onChange, onDelete }: {
  item: RiskPoint; onChange: (patch: Partial<RiskPoint>) => void; onDelete: () => void;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
      <TextField label="Ano" value={item.year} onChange={e => onChange({ year: e.target.value })} size="small" sx={{ minWidth: 80 }} />
      <TextField label="Taxa" type="number" value={item.rate} onChange={e => onChange({ rate: Number(e.target.value) || 0 })} size="small" sx={{ minWidth: 100 }} />
      <TextField label="Variação" value={item.change} onChange={e => onChange({ change: e.target.value })} size="small" fullWidth />
      <Tooltip title="Remover linha">
        <IconButton size="small" color="error" onClick={onDelete} sx={{ flexShrink: 0 }}>
          <Trash2 size={14} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default function FinancialIndicatorsEditor() {
  const [data, setData] = useState<FinancialIndicatorsPageDTO>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch(`${API_BASE}/financial-indicators-page`);
      if (!res.ok) throw new Error('Falha ao carregar indicadores');
      const json: FinancialIndicatorsPageDTO = await res.json();
      setData(json);
    } catch {
      setMessage({ type: 'error', text: 'Erro ao carregar os indicadores financeiros.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const saveData = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch(`${API_BASE}/financial-indicators-page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Falha ao guardar indicadores');
      const saved: FinancialIndicatorsPageDTO = await res.json();
      setData(saved);
      setMessage({ type: 'success', text: 'Indicadores guardados com sucesso.' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao guardar os indicadores financeiros.' });
    } finally {
      setSaving(false);
    }
  };

  const updateVP = (section: 'chartData' | 'premiums' | 'claims', index: number, patch: Partial<ValuePoint>) => {
    setData((prev) => {
      if (section === 'chartData') return { ...prev, highlightSection: { ...prev.highlightSection, chartData: prev.highlightSection.chartData.map((item, i) => i === index ? { ...item, ...patch } : item) } };
      if (section === 'premiums') return { ...prev, premiumsChart: { ...prev.premiumsChart, data: prev.premiumsChart.data.map((item, i) => i === index ? { ...item, ...patch } : item) } };
      return { ...prev, claimsChart: { ...prev.claimsChart, data: prev.claimsChart.data.map((item, i) => i === index ? { ...item, ...patch } : item) } };
    });
  };

  const deleteVP = (section: 'chartData' | 'premiums' | 'claims', index: number) => {
    setData((prev) => {
      if (section === 'chartData') return { ...prev, highlightSection: { ...prev.highlightSection, chartData: prev.highlightSection.chartData.filter((_, i) => i !== index) } };
      if (section === 'premiums') return { ...prev, premiumsChart: { ...prev.premiumsChart, data: prev.premiumsChart.data.filter((_, i) => i !== index) } };
      return { ...prev, claimsChart: { ...prev.claimsChart, data: prev.claimsChart.data.filter((_, i) => i !== index) } };
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
        <Typography variant="body2" color="text.secondary">
          Conteúdo da rota /ensa/indicadores-financeiros no frontend principal.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<RefreshCw size={15} />} onClick={loadData} sx={{ textTransform: 'none', borderRadius: 3 }}>
            Recarregar
          </Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <Save size={15} />} onClick={saveData} disabled={saving} sx={{ textTransform: 'none', borderRadius: 3, fontWeight: 700 }}>
            {saving ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </Stack>
      </Stack>

      <PageUrlBanner urls={{ label: 'Indicadores Financeiros', path: '/indicadores-financeiros' }} />

      {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ borderRadius: 3 }}>{message.text}</Alert>}

      {/* ── Dados gerais ── */}
      <SectionCard title="Dados Gerais da Página">
        <TextField label="Título da Página" value={data.title} onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))} fullWidth size="small" />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Rota" value={data.route} onChange={(e) => setData((prev) => ({ ...prev, route: e.target.value }))} fullWidth size="small" />
          <TextField label="Ano de Referência" type="number" value={data.year} onChange={(e) => setData((prev) => ({ ...prev, year: parseInt(e.target.value, 10) || 0 }))} size="small" sx={{ minWidth: 160 }} />
          <TextField label="Actualizado em" value={data.updatedAt || ''} size="small" disabled sx={{ minWidth: 180 }} />
        </Stack>
      </SectionCard>

      {/* ── Principais indicadores ── */}
      <SectionCard title="Principais Indicadores" defaultOpen>
        {data.mainIndicators.map((item, index) => (
          <MainIndicatorCard
            key={item.id || index}
            item={item}
            index={index}
            onChange={(patch) => setData((prev) => ({ ...prev, mainIndicators: prev.mainIndicators.map((mi, i) => i === index ? { ...mi, ...patch } : mi) }))}
            onDelete={() => setData((prev) => ({ ...prev, mainIndicators: prev.mainIndicators.filter((_, i) => i !== index) }))}
          />
        ))}
        <Button variant="outlined" size="small" startIcon={<Plus size={14} />}
          onClick={() => setData((prev) => ({ ...prev, mainIndicators: [...prev.mainIndicators, { id: `kpi-${Date.now()}`, label: '', value: '', change: '', isPositive: true, iconKey: 'Insights' }] }))}
          sx={{ textTransform: 'none', borderRadius: 2, alignSelf: 'flex-start' }}>
          Adicionar Indicador
        </Button>
      </SectionCard>

      {/* ── Bloco destaque ── */}
      <SectionCard title="Bloco de Destaque: Resultado Líquido">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Etiqueta superior (eyebrow)" value={data.highlightSection.eyebrow} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, eyebrow: e.target.value } }))} fullWidth size="small" />
          <TextField label="Título" value={data.highlightSection.title} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, title: e.target.value } }))} fullWidth size="small" />
        </Stack>
        <TextField label="Descrição" value={data.highlightSection.description} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, description: e.target.value } }))} fullWidth size="small" multiline minRows={2} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Valor do crescimento anual" value={data.highlightSection.annualGrowthValue} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, annualGrowthValue: e.target.value } }))} fullWidth size="small" />
          <TextField label="Legenda do crescimento" value={data.highlightSection.annualGrowthLabel} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, annualGrowthLabel: e.target.value } }))} fullWidth size="small" />
          <TextField label="Rótulo lateral" value={data.highlightSection.cornerLabel} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, cornerLabel: e.target.value } }))} size="small" sx={{ minWidth: 150 }} />
          <TextField label="Valor lateral" value={data.highlightSection.cornerValue} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, cornerValue: e.target.value } }))} size="small" sx={{ minWidth: 150 }} />
        </Stack>
        <Divider />
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Dados do gráfico</Typography>
        {data.highlightSection.chartData.map((item, index) => (
          <ValueRow key={`hl-${index}`} item={item} index={index}
            onChange={(patch) => updateVP('chartData', index, patch)}
            onDelete={() => deleteVP('chartData', index)} />
        ))}
        <Button variant="outlined" size="small" startIcon={<Plus size={14} />}
          onClick={() => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, chartData: [...prev.highlightSection.chartData, { year: '', value: 0, growth: '' }] } }))}
          sx={{ textTransform: 'none', borderRadius: 2, alignSelf: 'flex-start' }}>
          Adicionar Ponto
        </Button>
      </SectionCard>

      {/* ── Prémios ── */}
      <SectionCard title="Gráfico: Prémios Brutos Emitidos">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Título" value={data.premiumsChart.title} onChange={(e) => setData((prev) => ({ ...prev, premiumsChart: { ...prev.premiumsChart, title: e.target.value } }))} fullWidth size="small" />
          <TextField label="Nota de rodapé" value={data.premiumsChart.footnote} onChange={(e) => setData((prev) => ({ ...prev, premiumsChart: { ...prev.premiumsChart, footnote: e.target.value } }))} fullWidth size="small" />
          <TextField label="Texto de destaque" value={data.premiumsChart.accentText} onChange={(e) => setData((prev) => ({ ...prev, premiumsChart: { ...prev.premiumsChart, accentText: e.target.value } }))} fullWidth size="small" />
        </Stack>
        {data.premiumsChart.data.map((item, index) => (
          <ValueRow key={`pm-${index}`} item={item} index={index}
            onChange={(patch) => updateVP('premiums', index, patch)}
            onDelete={() => deleteVP('premiums', index)} />
        ))}
        <Button variant="outlined" size="small" startIcon={<Plus size={14} />}
          onClick={() => setData((prev) => ({ ...prev, premiumsChart: { ...prev.premiumsChart, data: [...prev.premiumsChart.data, { year: '', value: 0, growth: '' }] } }))}
          sx={{ textTransform: 'none', borderRadius: 2, alignSelf: 'flex-start' }}>
          Adicionar Linha
        </Button>
      </SectionCard>

      {/* ── Sinistros ── */}
      <SectionCard title="Gráfico: Custos com Sinistros">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Título" value={data.claimsChart.title} onChange={(e) => setData((prev) => ({ ...prev, claimsChart: { ...prev.claimsChart, title: e.target.value } }))} fullWidth size="small" />
          <TextField label="Nota de rodapé" value={data.claimsChart.footnote} onChange={(e) => setData((prev) => ({ ...prev, claimsChart: { ...prev.claimsChart, footnote: e.target.value } }))} fullWidth size="small" />
          <TextField label="Texto de destaque" value={data.claimsChart.accentText} onChange={(e) => setData((prev) => ({ ...prev, claimsChart: { ...prev.claimsChart, accentText: e.target.value } }))} fullWidth size="small" />
        </Stack>
        {data.claimsChart.data.map((item, index) => (
          <ValueRow key={`cl-${index}`} item={item} index={index}
            onChange={(patch) => updateVP('claims', index, patch)}
            onDelete={() => deleteVP('claims', index)} />
        ))}
        <Button variant="outlined" size="small" startIcon={<Plus size={14} />}
          onClick={() => setData((prev) => ({ ...prev, claimsChart: { ...prev.claimsChart, data: [...prev.claimsChart.data, { year: '', value: 0, growth: '' }] } }))}
          sx={{ textTransform: 'none', borderRadius: 2, alignSelf: 'flex-start' }}>
          Adicionar Linha
        </Button>
      </SectionCard>

      {/* ── Risco ── */}
      <SectionCard title="Secção de Risco / Taxa de Sinistralidade">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Título do gráfico" value={data.riskSection.title} onChange={(e) => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, title: e.target.value } }))} fullWidth size="small" />
          <TextField label="Título do painel lateral" value={data.riskSection.panelTitle} onChange={(e) => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, panelTitle: e.target.value } }))} fullWidth size="small" />
        </Stack>
        {data.riskSection.data.map((item, index) => (
          <RiskRow key={`rk-${index}`} item={item}
            onChange={(patch) => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, data: prev.riskSection.data.map((r, i) => i === index ? { ...r, ...patch } : r) } }))}
            onDelete={() => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, data: prev.riskSection.data.filter((_, i) => i !== index) } }))} />
        ))}
        <Button variant="outlined" size="small" startIcon={<Plus size={14} />}
          onClick={() => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, data: [...prev.riskSection.data, { year: '', rate: 0, change: '' }] } }))}
          sx={{ textTransform: 'none', borderRadius: 2, alignSelf: 'flex-start' }}>
          Adicionar Linha
        </Button>
      </SectionCard>
    </Stack>
  );
}
