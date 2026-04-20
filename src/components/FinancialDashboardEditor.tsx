import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, Paper, Button, TextField, IconButton,
  Divider, Alert, CircularProgress, Tooltip, Chip, Grid,
} from '@mui/material';
import { Plus, Trash2, Check, RefreshCw, ExternalLink } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE_URL
  ? `${process.env.REACT_APP_API_BASE_URL}/investor-content`
  : 'http://localhost:8080/api/investor-content';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiCard {
  label: string;
  value: string;
  suffix: string;
  growth: string;
  isNegativeGood: boolean;
  color: string;
}

interface ChartRow {
  year: string;
  premiums: number;
  claims: number;
  profit: number;
}

interface SegmentRow {
  name: string;
  value: number;
  color: string;
}

interface DashboardData {
  headerTitle: string;
  headerDescription: string;
  powerBiUrl: string;
  kpis: KpiCard[];
  chartData: ChartRow[];
  segments: SegmentRow[];
  marketShareNote: string;
}

const DEFAULTS: DashboardData = {
  headerTitle: 'Performance Financeira Interactiva',
  headerDescription: 'Acompanhe semanalmente a evolução dos principais indicadores de performance (KPIs) e rácios estratégicos da ENSA Seguros.',
  powerBiUrl: '',
  kpis: [
    { label: 'Prémios Brutos Emitidos', value: '473,1 mM', suffix: 'AOA', growth: '+12.5%', isNegativeGood: false, color: '#164993' },
    { label: 'Lucro Líquido do Exercício', value: '18,4 mM', suffix: 'AOA', growth: '+8.2%', isNegativeGood: false, color: '#10b981' },
    { label: 'Rácio Combinado', value: '94.2%', suffix: '', growth: '-2.1%', isNegativeGood: true, color: '#e63c2e' },
    { label: 'Rácio de Solvência', value: '185%', suffix: '', growth: '+5.4%', isNegativeGood: false, color: '#6366f1' },
  ],
  chartData: [
    { year: '2019', premiums: 210, claims: 145, profit: 12 },
    { year: '2020', premiums: 245, claims: 160, profit: 14 },
    { year: '2021', premiums: 278, claims: 185, profit: 15 },
    { year: '2022', premiums: 312, claims: 198, profit: 17 },
    { year: '2023', premiums: 379, claims: 235, profit: 18 },
    { year: '2024', premiums: 473, claims: 282, profit: 21 },
  ],
  segments: [
    { name: 'Não-Vida', value: 72, color: '#164993' },
    { name: 'Vida', value: 28, color: '#e63c2e' },
  ],
  marketShareNote: 'Liderança consolidada com 37% de quota de mercado GERAL em Angola.',
};

// ─── KPI Card Editor ──────────────────────────────────────────────────────────
function KpiEditor({ kpis, onChange }: { kpis: KpiCard[]; onChange: (k: KpiCard[]) => void }) {
  const update = (idx: number, patch: Partial<KpiCard>) =>
    onChange(kpis.map((k, i) => (i === idx ? { ...k, ...patch } : k)));
  const remove = (idx: number) => onChange(kpis.filter((_, i) => i !== idx));
  const add = () => onChange([...kpis, { label: '', value: '', suffix: '', growth: '', isNegativeGood: false, color: '#164993' }]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Indicadores KPI ({kpis.length})</Typography>
        <Button size="small" startIcon={<Plus size={14} />} onClick={add} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Adicionar KPI
        </Button>
      </Stack>
      <Stack spacing={2}>
        {kpis.map((kpi, idx) => (
          <Paper key={idx} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `2px solid ${kpi.color}22`, bgcolor: '#fafafa' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Chip label={`KPI ${idx + 1}`} size="small" sx={{ bgcolor: kpi.color, color: 'white', fontWeight: 800, fontSize: '0.65rem' }} />
              <IconButton size="small" color="error" onClick={() => remove(idx)}>
                <Trash2 size={15} />
              </IconButton>
            </Stack>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Etiqueta" value={kpi.label} onChange={e => update(idx, { label: e.target.value })} size="small" fullWidth />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Valor" value={kpi.value} onChange={e => update(idx, { value: e.target.value })} size="small" fullWidth placeholder="473,1 mM" />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Sufixo" value={kpi.suffix} onChange={e => update(idx, { suffix: e.target.value })} size="small" fullWidth placeholder="AOA" />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Variação" value={kpi.growth} onChange={e => update(idx, { growth: e.target.value })} size="small" fullWidth placeholder="+12.5%" />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField label="Cor (hex)" value={kpi.color} onChange={e => update(idx, { color: e.target.value })} size="small" fullWidth
                  InputProps={{ startAdornment: <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: kpi.color, mr: 1, flexShrink: 0 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Negativo é bom? (ex: Rácio Combinado)</Typography>
                  <Button size="small" variant={kpi.isNegativeGood ? 'contained' : 'outlined'} onClick={() => update(idx, { isNegativeGood: !kpi.isNegativeGood })}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', minWidth: 60 }}>
                    {kpi.isNegativeGood ? 'Sim' : 'Não'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

// ─── Chart Data Editor ────────────────────────────────────────────────────────
function ChartEditor({ rows, onChange }: { rows: ChartRow[]; onChange: (r: ChartRow[]) => void }) {
  const update = (idx: number, patch: Partial<ChartRow>) =>
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  const add = () => onChange([...rows, { year: String(new Date().getFullYear()), premiums: 0, claims: 0, profit: 0 }]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Dados do Gráfico — Prémios & Sinistros</Typography>
        <Button size="small" startIcon={<Plus size={14} />} onClick={add} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Adicionar Ano
        </Button>
      </Stack>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Header Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 40px', gap: 0, bgcolor: '#164993', color: 'white', px: 2, py: 1.5 }}>
          {['Ano', 'Prémios (mM)', 'Sinistros (mM)', 'Lucro (mM)', ''].map((h, i) => (
            <Typography key={i} variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{h}</Typography>
          ))}
        </Box>
        {rows.map((row, idx) => (
          <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 40px', gap: 1, px: 2, py: 1, bgcolor: idx % 2 === 0 ? 'white' : '#f8fafc', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
            <TextField value={row.year} onChange={e => update(idx, { year: e.target.value })} size="small" sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }} />
            <TextField type="number" value={row.premiums} onChange={e => update(idx, { premiums: Number(e.target.value) })} size="small" />
            <TextField type="number" value={row.claims} onChange={e => update(idx, { claims: Number(e.target.value) })} size="small" />
            <TextField type="number" value={row.profit} onChange={e => update(idx, { profit: Number(e.target.value) })} size="small" />
            <Tooltip title="Remover"><IconButton size="small" color="error" onClick={() => remove(idx)}><Trash2 size={14} /></IconButton></Tooltip>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

// ─── Segment Editor ───────────────────────────────────────────────────────────
function SegmentEditor({ segments, onChange }: { segments: SegmentRow[]; onChange: (s: SegmentRow[]) => void }) {
  const update = (idx: number, patch: Partial<SegmentRow>) =>
    onChange(segments.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const remove = (idx: number) => onChange(segments.filter((_, i) => i !== idx));
  const add = () => onChange([...segments, { name: '', value: 0, color: '#6366f1' }]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Mix de Negócio — Segmentos</Typography>
        <Button size="small" startIcon={<Plus size={14} />} onClick={add} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Adicionar Segmento
        </Button>
      </Stack>
      <Stack spacing={1.5}>
        {segments.map((seg, idx) => (
          <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: seg.color, flexShrink: 0 }} />
            <TextField label="Nome" value={seg.name} onChange={e => update(idx, { name: e.target.value })} size="small" sx={{ flex: 2 }} />
            <TextField label="%" type="number" value={seg.value} onChange={e => update(idx, { value: Number(e.target.value) })} size="small" sx={{ width: 90 }} inputProps={{ min: 0, max: 100 }} />
            <TextField label="Cor" value={seg.color} onChange={e => update(idx, { color: e.target.value })} size="small" sx={{ width: 110 }} />
            <IconButton size="small" color="error" onClick={() => remove(idx)}><Trash2 size={14} /></IconButton>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
export default function FinancialDashboardEditor() {
  const [data, setData] = useState<DashboardData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/financial-dashboard`);
      if (res.ok) {
        const json = await res.json();
        setData({ ...DEFAULTS, ...json });
      }
    } catch {
      // Use defaults silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/financial-dashboard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setData({ ...DEFAULTS, ...saved });
      setMsg({ type: 'success', text: 'Dashboard guardado com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar. Verifique o servidor.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress /></Stack>;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Top bar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Edite os indicadores, gráficos e segmentos exibidos em{' '}
            <Box component="a" href="/dashboard-financeiro" target="_blank" sx={{ color: '#164993', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              /dashboard-financeiro <ExternalLink size={12} />
            </Box>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<RefreshCw size={15} />} onClick={load} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>
            Recarregar
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <Check size={15} />}
            disabled={saving}
            onClick={save}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
          >
            {saving ? 'A guardar…' : 'Guardar Tudo'}
          </Button>
        </Stack>
      </Stack>

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 3, borderRadius: 3 }}>{msg.text}</Alert>}

      {/* Section 1: Header */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Cabeçalho da Página</Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>Título, descrição e URL do PowerBI exibidos no topo da página.</Typography>
        <Stack spacing={2}>
          <TextField label="Título Principal" value={data.headerTitle} onChange={e => setData(p => ({ ...p, headerTitle: e.target.value }))} size="small" fullWidth />
          <TextField label="Descrição" value={data.headerDescription} onChange={e => setData(p => ({ ...p, headerDescription: e.target.value }))} size="small" fullWidth multiline minRows={2} />
          <TextField
            label="URL do PowerBI"
            value={data.powerBiUrl}
            onChange={e => setData(p => ({ ...p, powerBiUrl: e.target.value }))}
            size="small"
            fullWidth
            placeholder="https://app.powerbi.com/view?r=..."
            helperText="Colar o URL de incorporação do relatório PowerBI"
          />
        </Stack>
      </Paper>

      {/* Section 2: KPIs */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <KpiEditor kpis={data.kpis} onChange={kpis => setData(p => ({ ...p, kpis }))} />
      </Paper>

      {/* Section 3: Chart data */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <ChartEditor rows={data.chartData} onChange={chartData => setData(p => ({ ...p, chartData }))} />
      </Paper>

      {/* Section 4: Business mix */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <SegmentEditor segments={data.segments} onChange={segments => setData(p => ({ ...p, segments }))} />
        <Divider sx={{ my: 3 }} />
        <TextField
          label="Nota de Quota de Mercado"
          value={data.marketShareNote}
          onChange={e => setData(p => ({ ...p, marketShareNote: e.target.value }))}
          size="small"
          fullWidth
          placeholder="Liderança consolidada com 37% de quota de mercado GERAL em Angola."
        />
      </Paper>
    </Box>
  );
}
