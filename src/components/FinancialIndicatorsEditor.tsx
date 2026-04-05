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
  Typography,
} from '@mui/material';
import { ChevronDown, ChevronRight, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

const iconOptions = [
  'People',
  'Store',
  'Assignment',
  'Autorenew',
  'Payments',
  'LocalHospital',
  'PieChart',
  'AccountBalanceWallet',
  'Group',
  'AccountBalance',
  'BusinessCenter',
  'Insights',
  'TrendingUp',
  'Security',
  'VerifiedUser',
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
  highlightSection: {
    eyebrow: '',
    title: '',
    description: '',
    annualGrowthValue: '',
    annualGrowthLabel: '',
    cornerLabel: '',
    cornerValue: '',
    chartData: [],
  },
  premiumsChart: {
    title: '',
    footnote: '',
    accentText: '',
    data: [],
  },
  claimsChart: {
    title: '',
    footnote: '',
    accentText: '',
    data: [],
  },
  riskSection: {
    title: '',
    panelTitle: '',
    data: [],
  },
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: '#f8fafc' } }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
        <IconButton size="small" tabIndex={-1}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2}>{children}</Stack>
        </Box>
      </Collapse>
    </Paper>
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

  useEffect(() => {
    loadData();
  }, []);

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

  const updateMainIndicator = (index: number, key: keyof MainIndicator, value: string | boolean) => {
    setData((prev) => ({
      ...prev,
      mainIndicators: prev.mainIndicators.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }));
  };

  const updateValuePoint = (section: 'chartData' | 'premiums' | 'claims', index: number, key: keyof ValuePoint, value: string | number) => {
    setData((prev) => {
      if (section === 'chartData') {
        return {
          ...prev,
          highlightSection: {
            ...prev.highlightSection,
            chartData: prev.highlightSection.chartData.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
          },
        };
      }
      if (section === 'premiums') {
        return {
          ...prev,
          premiumsChart: {
            ...prev.premiumsChart,
            data: prev.premiumsChart.data.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
          },
        };
      }
      return {
        ...prev,
        claimsChart: {
          ...prev.claimsChart,
          data: prev.claimsChart.data.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
        },
      };
    });
  };

  const updateRiskPoint = (index: number, key: keyof RiskPoint, value: string | number) => {
    setData((prev) => ({
      ...prev,
      riskSection: {
        ...prev.riskSection,
        data: prev.riskSection.data.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
      },
    }));
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
        <Box>
          <Typography variant="body2" color="text.secondary">
            Este conteúdo alimenta directamente a rota /ensa/indicadores-financeiros no frontend principal.
          </Typography>
        </Box>
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

      {message && <Alert severity={message.type} sx={{ borderRadius: 3 }}>{message.text}</Alert>}

      <SectionCard title="Dados Gerais da Página">
        <TextField label="Título da Página" value={data.title} onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))} fullWidth />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Rota" value={data.route} fullWidth onChange={(e) => setData((prev) => ({ ...prev, route: e.target.value }))} />
          <TextField label="Ano de Referência" type="number" value={data.year} fullWidth onChange={(e) => setData((prev) => ({ ...prev, year: parseInt(e.target.value, 10) || 0 }))} />
          <TextField label="Actualizado em" value={data.updatedAt || ''} fullWidth disabled />
        </Stack>
      </SectionCard>

      <SectionCard title="Principais Indicadores da Companhia">
        {data.mainIndicators.map((item, index) => (
          <Paper key={item.id || index} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip label={`Indicador ${index + 1}`} size="small" sx={{ fontWeight: 700 }} />
                <Button color="error" size="small" startIcon={<Trash2 size={14} />} onClick={() => setData((prev) => ({ ...prev, mainIndicators: prev.mainIndicators.filter((_, itemIndex) => itemIndex !== index) }))} sx={{ textTransform: 'none' }}>
                  Remover
                </Button>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="ID" value={item.id} onChange={(e) => updateMainIndicator(index, 'id', e.target.value)} fullWidth />
                <TextField label="Rótulo" value={item.label} onChange={(e) => updateMainIndicator(index, 'label', e.target.value)} fullWidth />
                <TextField label="Valor" value={item.value} onChange={(e) => updateMainIndicator(index, 'value', e.target.value)} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Comparação / Variação" value={item.change} onChange={(e) => updateMainIndicator(index, 'change', e.target.value)} fullWidth />
                <TextField select label="Ícone" value={item.iconKey} onChange={(e) => updateMainIndicator(index, 'iconKey', e.target.value)} fullWidth>
                  {iconOptions.map((icon) => <MenuItem key={icon} value={icon}>{icon}</MenuItem>)}
                </TextField>
                <TextField select label="Tendência" value={item.isPositive ? 'positive' : 'negative'} onChange={(e) => updateMainIndicator(index, 'isPositive', e.target.value === 'positive')} fullWidth>
                  <MenuItem value="positive">Positiva</MenuItem>
                  <MenuItem value="negative">Negativa</MenuItem>
                </TextField>
              </Stack>
            </Stack>
          </Paper>
        ))}
        <Button variant="outlined" startIcon={<Plus size={15} />} onClick={() => setData((prev) => ({
          ...prev,
          mainIndicators: [
            ...prev.mainIndicators,
            { id: `kpi-${Date.now()}`, label: '', value: '', change: '', isPositive: true, iconKey: 'Insights' },
          ],
        }))} sx={{ textTransform: 'none', borderRadius: 3 }}>
          Adicionar Indicador
        </Button>
      </SectionCard>

      <SectionCard title="Bloco de Destaque: Resultado Líquido">
        <TextField label="Etiqueta superior" value={data.highlightSection.eyebrow} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, eyebrow: e.target.value } }))} fullWidth />
        <TextField label="Título" value={data.highlightSection.title} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, title: e.target.value } }))} fullWidth />
        <TextField label="Descrição" value={data.highlightSection.description} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, description: e.target.value } }))} fullWidth multiline minRows={3} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Valor do crescimento" value={data.highlightSection.annualGrowthValue} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, annualGrowthValue: e.target.value } }))} fullWidth />
          <TextField label="Legenda do crescimento" value={data.highlightSection.annualGrowthLabel} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, annualGrowthLabel: e.target.value } }))} fullWidth />
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Rótulo do cartão lateral" value={data.highlightSection.cornerLabel} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, cornerLabel: e.target.value } }))} fullWidth />
          <TextField label="Valor do cartão lateral" value={data.highlightSection.cornerValue} onChange={(e) => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, cornerValue: e.target.value } }))} fullWidth />
        </Stack>
        <Divider />
        {data.highlightSection.chartData.map((item, index) => (
          <Stack key={`${item.year}-${index}`} direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField label="Ano" value={item.year} onChange={(e) => updateValuePoint('chartData', index, 'year', e.target.value)} fullWidth />
            <TextField label="Valor" type="number" value={item.value} onChange={(e) => updateValuePoint('chartData', index, 'value', Number(e.target.value) || 0)} fullWidth />
            <TextField label="Crescimento" value={item.growth} onChange={(e) => updateValuePoint('chartData', index, 'growth', e.target.value)} fullWidth />
            <Button color="error" onClick={() => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, chartData: prev.highlightSection.chartData.filter((_, itemIndex) => itemIndex !== index) } }))}>
              <Trash2 size={14} />
            </Button>
          </Stack>
        ))}
        <Button variant="outlined" startIcon={<Plus size={15} />} onClick={() => setData((prev) => ({ ...prev, highlightSection: { ...prev.highlightSection, chartData: [...prev.highlightSection.chartData, { year: '', value: 0, growth: '' }] } }))} sx={{ textTransform: 'none', borderRadius: 3 }}>
          Adicionar Ponto do Gráfico
        </Button>
      </SectionCard>

      <SectionCard title="Gráfico: Prémios Brutos Emitidos">
        <TextField label="Título" value={data.premiumsChart.title} onChange={(e) => setData((prev) => ({ ...prev, premiumsChart: { ...prev.premiumsChart, title: e.target.value } }))} fullWidth />
        <TextField label="Nota de rodapé" value={data.premiumsChart.footnote} onChange={(e) => setData((prev) => ({ ...prev, premiumsChart: { ...prev.premiumsChart, footnote: e.target.value } }))} fullWidth />
        {data.premiumsChart.data.map((item, index) => (
          <Stack key={`${item.year}-${index}`} direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField label="Ano" value={item.year} onChange={(e) => updateValuePoint('premiums', index, 'year', e.target.value)} fullWidth />
            <TextField label="Valor" type="number" value={item.value} onChange={(e) => updateValuePoint('premiums', index, 'value', Number(e.target.value) || 0)} fullWidth />
            <TextField label="Crescimento" value={item.growth} onChange={(e) => updateValuePoint('premiums', index, 'growth', e.target.value)} fullWidth />
            <Button color="error" onClick={() => setData((prev) => ({ ...prev, premiumsChart: { ...prev.premiumsChart, data: prev.premiumsChart.data.filter((_, itemIndex) => itemIndex !== index) } }))}>
              <Trash2 size={14} />
            </Button>
          </Stack>
        ))}
        <Button variant="outlined" startIcon={<Plus size={15} />} onClick={() => setData((prev) => ({ ...prev, premiumsChart: { ...prev.premiumsChart, data: [...prev.premiumsChart.data, { year: '', value: 0, growth: '' }] } }))} sx={{ textTransform: 'none', borderRadius: 3 }}>
          Adicionar Linha
        </Button>
      </SectionCard>

      <SectionCard title="Gráfico: Custos com Sinistros">
        <TextField label="Título" value={data.claimsChart.title} onChange={(e) => setData((prev) => ({ ...prev, claimsChart: { ...prev.claimsChart, title: e.target.value } }))} fullWidth />
        <TextField label="Texto de destaque" value={data.claimsChart.accentText} onChange={(e) => setData((prev) => ({ ...prev, claimsChart: { ...prev.claimsChart, accentText: e.target.value } }))} fullWidth />
        {data.claimsChart.data.map((item, index) => (
          <Stack key={`${item.year}-${index}`} direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField label="Ano" value={item.year} onChange={(e) => updateValuePoint('claims', index, 'year', e.target.value)} fullWidth />
            <TextField label="Valor" type="number" value={item.value} onChange={(e) => updateValuePoint('claims', index, 'value', Number(e.target.value) || 0)} fullWidth />
            <TextField label="Crescimento" value={item.growth} onChange={(e) => updateValuePoint('claims', index, 'growth', e.target.value)} fullWidth />
            <Button color="error" onClick={() => setData((prev) => ({ ...prev, claimsChart: { ...prev.claimsChart, data: prev.claimsChart.data.filter((_, itemIndex) => itemIndex !== index) } }))}>
              <Trash2 size={14} />
            </Button>
          </Stack>
        ))}
        <Button variant="outlined" startIcon={<Plus size={15} />} onClick={() => setData((prev) => ({ ...prev, claimsChart: { ...prev.claimsChart, data: [...prev.claimsChart.data, { year: '', value: 0, growth: '' }] } }))} sx={{ textTransform: 'none', borderRadius: 3 }}>
          Adicionar Linha
        </Button>
      </SectionCard>

      <SectionCard title="Secção de Risco / Taxa de Sinistralidade">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Título do gráfico" value={data.riskSection.title} onChange={(e) => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, title: e.target.value } }))} fullWidth />
          <TextField label="Título do painel lateral" value={data.riskSection.panelTitle} onChange={(e) => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, panelTitle: e.target.value } }))} fullWidth />
        </Stack>
        {data.riskSection.data.map((item, index) => (
          <Stack key={`${item.year}-${index}`} direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField label="Ano" value={item.year} onChange={(e) => updateRiskPoint(index, 'year', e.target.value)} fullWidth />
            <TextField label="Taxa" type="number" value={item.rate} onChange={(e) => updateRiskPoint(index, 'rate', Number(e.target.value) || 0)} fullWidth />
            <TextField label="Variação" value={item.change} onChange={(e) => updateRiskPoint(index, 'change', e.target.value)} fullWidth />
            <Button color="error" onClick={() => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, data: prev.riskSection.data.filter((_, itemIndex) => itemIndex !== index) } }))}>
              <Trash2 size={14} />
            </Button>
          </Stack>
        ))}
        <Button variant="outlined" startIcon={<Plus size={15} />} onClick={() => setData((prev) => ({ ...prev, riskSection: { ...prev.riskSection, data: [...prev.riskSection.data, { year: '', rate: 0, change: '' }] } }))} sx={{ textTransform: 'none', borderRadius: 3 }}>
          Adicionar Linha
        </Button>
      </SectionCard>
    </Stack>
  );
}
