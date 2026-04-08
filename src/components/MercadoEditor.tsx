import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PageUrlBanner from './PageUrlBanner';
import { Check, ChevronDown, ChevronRight, FileUp, Pencil, Plus, Trash2, X } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

// Categories that map to the home-page "Análise de Mercado" section
const CAT_CARDS   = 'MERCADO_ANALISE';   // 4 key metric cards (P/E, Dividend Yield, etc.)
const CAT_TICKER  = 'MERCADO_TICKER';    // Market ticker strip (BODIVA Ind., USD/AOA, etc.)
const CAT_PERF    = 'MERCADO_PERFORMANCE'; // Historical performance (ENSA Stock price)

type Indicator = {
  id?: number;
  title: string;
  indicatorValue: string;
  numericValue: number | null;
  periodYear: number;
  periodQuarter: number | null;
  category: string;
  unit: string;
};

const DEFAULT_CARDS: Omit<Indicator, 'id'>[] = [
  { title: 'P/E Rácio',       indicatorValue: '12.5x',   numericValue: 12.5, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_CARDS, unit: 'Múltiplo de Preço' },
  { title: 'Dividend Yield',  indicatorValue: '4.2%',    numericValue: 4.2,  periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_CARDS, unit: 'Retorno Directo' },
  { title: 'Total Acções',    indicatorValue: '2.4M',    numericValue: null, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_CARDS, unit: 'Capital Emitido' },
  { title: 'Free Float',      indicatorValue: '20.0%',   numericValue: 20.0, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_CARDS, unit: 'Acções em Bolsa' },
];

const DEFAULT_TICKER: Omit<Indicator, 'id'>[] = [
  { title: 'BODIVA (Ind.)',    indicatorValue: '1.245,45', numericValue: null, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_TICKER, unit: '+1.15%' },
  { title: 'Taxa BNA',        indicatorValue: '19,50%',   numericValue: null, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_TICKER, unit: '0.00%' },
  { title: 'USD/AOA',         indicatorValue: '828,45',   numericValue: null, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_TICKER, unit: '+0.45%' },
  { title: 'EUR/AOA',         indicatorValue: '895,12',   numericValue: null, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_TICKER, unit: '+0.32%' },
  { title: 'Petróleo Brent',  indicatorValue: '$82,45',   numericValue: null, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_TICKER, unit: '+1.10%' },
  { title: 'Acções ENSA',     indicatorValue: '46.000',   numericValue: null, periodYear: new Date().getFullYear(), periodQuarter: null, category: CAT_TICKER, unit: '+0.80%' },
];

const CATEGORY_COLORS: Record<string, { border: string; chipBg: string; chipText: string }> = {
  [CAT_CARDS]:  { border: '#6366f1', chipBg: '#eef2ff', chipText: '#4338ca' },
  [CAT_TICKER]: { border: '#14b8a6', chipBg: '#f0fdfa', chipText: '#0f766e' },
  [CAT_PERF]:   { border: '#f59e0b', chipBg: '#fffbeb', chipText: '#b45309' },
};

const DEFAULT_PERF: Omit<Indicator, 'id'>[] = [
  { title: '2023-12-31', indicatorValue: '46.000', numericValue: 46000, periodYear: 2023, periodQuarter: 4, category: CAT_PERF, unit: 'AOA' },
  { title: '2024-03-31', indicatorValue: '45.000', numericValue: 45000, periodYear: 2024, periodQuarter: 1, category: CAT_PERF, unit: 'AOA' },
  { title: '2024-06-30', indicatorValue: '47.500', numericValue: 47500, periodYear: 2024, periodQuarter: 2, category: CAT_PERF, unit: 'AOA' },
  { title: '2024-09-30', indicatorValue: '46.800', numericValue: 46800, periodYear: 2024, periodQuarter: 3, category: CAT_PERF, unit: 'AOA' },
];

function emptyCard(cat: string): Indicator {
  return { title: '', indicatorValue: '', numericValue: null, periodYear: new Date().getFullYear(), periodQuarter: null, category: cat, unit: '' };
}

// ---- Indicator Card ----
function IndicatorCard({ item, onSave, onDelete }: {
  item: Indicator;
  onSave: (i: Indicator) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Indicator>(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); setMsg({ type: 'success', text: 'Guardado.' }); }
    catch { setMsg({ type: 'error', text: 'Erro ao guardar.' }); }
    finally { setSaving(false); }
  };

  const color = CATEGORY_COLORS[data.category] || CATEGORY_COLORS[CAT_CARDS];

  return (
    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', borderLeft: `4px solid ${color.border}`, mb: 2, overflow: 'hidden' }}>
      <Box onClick={() => setOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</IconButton>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{data.title || '(sem título)'}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.3, flexWrap: 'wrap' }}>
              <Chip label={data.indicatorValue || '—'} size="small" sx={{ height: 18, fontWeight: 700, fontSize: '0.65rem', bgcolor: color.chipBg, color: color.chipText }} />
              {data.unit && <Chip label={data.unit} size="small" sx={{ height: 18, fontWeight: 600, fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#475569' }} />}
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
            <TextField label="Título / Rótulo *" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} disabled={!editing} size="small" fullWidth />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Valor" value={data.indicatorValue} onChange={e => setData(p => ({ ...p, indicatorValue: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="ex: 12.5x, 4.2%, 46.000" />
              <TextField label="Unidade / Variação" value={data.unit} onChange={e => setData(p => ({ ...p, unit: e.target.value }))} disabled={!editing} size="small" fullWidth placeholder="ex: Múltiplo de Preço, +1.15%" />
            </Stack>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Para o <strong>Ticker</strong>: "Unidade" é a variação percentual (ex: +1.15%). Para os <strong>Cartões de Análise</strong>: é a descrição do indicador.
            </Typography>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}

// ---- Indicator Row for Table ----
function IndicatorRow({ item, onSave, onDelete }: {
  item: Indicator;
  onSave: (i: Indicator) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Indicator>(item);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setData(item); }, [item]);

  const handleSave = async () => {
    try { setSaving(true); await onSave(data); setEditing(false); }
    catch { alert('Erro ao guardar.'); }
    finally { setSaving(false); }
  };

  return (
    <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell sx={{ py: 1 }}>
        {editing ? (
          <TextField
            size="small"
            value={data.title}
            onChange={e => setData(p => ({ ...p, title: e.target.value }))}
            placeholder="YYYY-MM-DD"
            fullWidth
            variant="standard"
          />
        ) : data.title}
      </TableCell>
      <TableCell sx={{ py: 1 }}>
        {editing ? (
          <TextField
            size="small"
            value={data.indicatorValue}
            onChange={e => setData(p => ({ ...p, indicatorValue: e.target.value, numericValue: parseFloat(e.target.value.replace(/[^\d.-]/g, '')) }))}
            placeholder="Preço"
            fullWidth
            variant="standard"
          />
        ) : data.indicatorValue}
      </TableCell>
      <TableCell sx={{ py: 1 }}>
        {editing ? (
          <TextField
            size="small"
            value={data.unit}
            onChange={e => setData(p => ({ ...p, unit: e.target.value }))}
            placeholder="Moeda"
            fullWidth
            variant="standard"
          />
        ) : data.unit}
      </TableCell>
      <TableCell align="right" sx={{ py: 1 }}>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {editing ? (
            <>
              <IconButton size="small" color="primary" onClick={handleSave} disabled={saving}>
                {saving ? <CircularProgress size={16} /> : <Check size={18} />}
              </IconButton>
              <IconButton size="small" onClick={() => { setEditing(false); setData(item); }}>
                <X size={18} />
              </IconButton>
            </>
          ) : (
            <IconButton size="small" onClick={() => setEditing(true)}>
              <Pencil size={16} />
            </IconButton>
          )}
          {item.id && (
            confirmDelete ? (
              <Stack direction="row" spacing={0.5}>
                <Button size="small" color="error" onClick={() => onDelete(item.id!)} sx={{ minWidth: 0, p: 0.5, fontSize: 10 }}>OK</Button>
                <Button size="small" onClick={() => setConfirmDelete(false)} sx={{ minWidth: 0, p: 0.5, fontSize: 10 }}>X</Button>
              </Stack>
            ) : (
              <IconButton size="small" color="error" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} />
              </IconButton>
            )
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ---- Main Editor ----
export default function MercadoEditor() {
  const [tab, setTab] = useState(0);
  const [cards, setCards]     = useState<Indicator[]>([]);
  const [ticker, setTicker]   = useState<Indicator[]>([]);
  const [perf, setPerf]       = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedingCards,  setSeedingCards]  = useState(false);
  const [seedingTicker, setSeedingTicker] = useState(false);
  const [seedingPerf,   setSeedingPerf]   = useState(false);
  const [importingCsv, setImportingCsv]   = useState(false);
  const [globalMsg, setGlobalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getActiveList = () => {
    if (tab === 0) return cards;
    if (tab === 1) return ticker;
    return perf;
  };
  const setActiveListFn = (newList: Indicator[] | ((prev: Indicator[]) => Indicator[])) => {
    if (tab === 0) setCards(newList as any);
    else if (tab === 1) setTicker(newList as any);
    else setPerf(newList as any);
  };
  const activeList = getActiveList();
  const setActiveList = setActiveListFn;
  const activeCategory = tab === 0 ? CAT_CARDS : tab === 1 ? CAT_TICKER : CAT_PERF;

  const load = async () => {
    setLoading(true);
    try {
      const [rCards, rTicker, rPerf] = await Promise.all([
        fetch(`${API_BASE}/business-indicators?category=${CAT_CARDS}`),
        fetch(`${API_BASE}/business-indicators?category=${CAT_TICKER}`),
        fetch(`${API_BASE}/business-indicators?category=${CAT_PERF}`),
      ]);
      setCards(await rCards.json());
      setTicker(await rTicker.json());
      setPerf(await rPerf.json());
    } catch { setGlobalMsg({ type: 'error', text: 'Erro ao carregar dados.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (item: Indicator) => {
    const method = item.id ? 'PUT' : 'POST';
    const url    = item.id ? `${API_BASE}/business-indicators/${item.id}` : `${API_BASE}/business-indicators`;
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    if (!r.ok) throw new Error();
    const saved: Indicator = await r.json();
    setActiveList(prev => item.id ? prev.map(x => x.id === item.id ? saved : x) : [...prev, saved]);
  };

  const handleDelete = async (id: number) => {
    const r = await fetch(`${API_BASE}/business-indicators/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error();
    setActiveList(prev => prev.filter(x => x.id !== id));
  };

  const seedDefaults = async (defaults: Omit<Indicator, 'id'>[], setSeedingFn: (v: boolean) => void, reloadCat: 'cards' | 'ticker' | 'perf') => {
    setSeedingFn(true);
    try {
      const created = await Promise.all(
        defaults.map(d => fetch(`${API_BASE}/business-indicators`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d),
        }).then(r => r.json()))
      );
      if (reloadCat === 'cards') setCards(created);
      else if (reloadCat === 'ticker') setTicker(created);
      else setPerf(created);
      setGlobalMsg({ type: 'success', text: 'Dados de exemplo criados.' });
    } catch { setGlobalMsg({ type: 'error', text: 'Erro ao criar dados de exemplo.' }); }
    finally { setSeedingFn(false); }
  };

  const addNew = () => {
    setActiveList(prev => [{ ...emptyCard(activeCategory) }, ...prev] as any);
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingCsv(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('category'));
        const newItems: Omit<Indicator, 'id'>[] = lines.map(line => {
          const [date, price] = line.split(',').map(s => s.trim());
          const dateObj = new Date(date);
          return {
            title: date,
            indicatorValue: price,
            numericValue: parseFloat(price.replace(/[^\d.-]/g, '')),
            periodYear: dateObj.getFullYear(),
            periodQuarter: Math.floor(dateObj.getMonth() / 3) + 1,
            category: CAT_PERF,
            unit: 'AOA',
          };
        });

        const created = await Promise.all(
          newItems.map(item => fetch(`${API_BASE}/business-indicators`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
          }).then(r => r.json()))
        );

        setPerf(prev => [...created, ...prev]);
        setGlobalMsg({ type: 'success', text: `${created.length} registos importados com sucesso.` });
      } catch (err) {
        setGlobalMsg({ type: 'error', text: 'Erro ao processar ficheiro CSV.' });
      } finally {
        setImportingCsv(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Indicadores e ticker de mercado exibidos na página inicial.</Typography>
        </Box>
        {tab !== 2 && (
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={addNew} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, height: 40 }}>
            Novo Indicador
          </Button>
        )}
      </Stack>

      <PageUrlBanner urls={[{ label: 'Home (Análise de Mercado)', path: '/' }]} />

      {globalMsg && <Alert severity={globalMsg.type} onClose={() => setGlobalMsg(null)} sx={{ mb: 2, borderRadius: 3 }}>{globalMsg.text}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #e2e8f0' }}>
        <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>Cartões de Análise</span><Chip label={cards.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#eef2ff', color: '#4338ca' }} /></Stack>} />
        <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>Ticker do Mercado</span><Chip label={ticker.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f0fdfa', color: '#0f766e' }} /></Stack>} />
        <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>Desempenho (Histórico)</span><Chip label={perf.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fffbeb', color: '#b45309' }} /></Stack>} />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : activeList.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0' }}>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
            {tab === 0 ? 'Sem cartões de análise de mercado.' : tab === 1 ? 'Sem itens no ticker de mercado.' : 'Sem dados históricos de desempenho.'}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}
            disabled={tab === 0 ? seedingCards : tab === 1 ? seedingTicker : seedingPerf}
            startIcon={(tab === 0 ? seedingCards : tab === 1 ? seedingTicker : seedingPerf) ? <CircularProgress size={13} /> : undefined}
            onClick={() => {
              if (tab === 0) seedDefaults(DEFAULT_CARDS, setSeedingCards, 'cards');
              else if (tab === 1) seedDefaults(DEFAULT_TICKER, setSeedingTicker, 'ticker');
              else seedDefaults(DEFAULT_PERF, setSeedingPerf, 'perf');
            }}
          >
            Inicializar com dados de exemplo
          </Button>
        </Paper>
      ) : (
        <>
          {tab === 0 && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
              Estes cartões aparecem na secção <strong>"Análise de Mercado"</strong> da página <em>/ensa</em>.
              O <strong>Valor</strong> é o número principal exibido, a <strong>Unidade</strong> é a descrição por baixo.
            </Alert>
          )}
          {tab === 1 && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
              Estes itens aparecem no <strong>ticker de cotações</strong> da página inicial.
              O <strong>Valor</strong> é a cotação/taxa, a <strong>Unidade</strong> é a variação (ex: +1.15%).
            </Alert>
          )}
          {tab === 2 ? (
            <Stack spacing={2} sx={{ mb: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Introduza o histórico de cotações anualmente ou via CSV. Estes dados sobrepõem-se à API se disponíveis.
                O formato do CSV deve ser: <code>category,Preço de Fecho</code> (Ex: 2026-03-31, 46000).
              </Alert>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <input type="file" accept=".csv" hidden ref={fileInputRef} onChange={handleCsvImport} />
                <Button
                  variant="outlined"
                  startIcon={importingCsv ? <CircularProgress size={16} /> : <FileUp size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importingCsv}
                  sx={{ borderRadius: 3, textTransform: 'none' }}
                >
                  Importar CSV (Histórico)
                </Button>
                <Button variant="contained" startIcon={<Plus size={16} />} onClick={addNew} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>
                  Nova Cotação
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Data / Título</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Preço</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Unidade / Moeda</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Acções</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {perf.map((item, idx) => (
                      <IndicatorRow
                        key={item.id ?? `new-perf-${idx}`}
                        item={item}
                        onSave={handleSave}
                        onDelete={handleDelete}
                      />
                    ))}
                    {perf.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                          Sem dados históricos. Use o botão de importação ou carregue exemplos.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          ) : (
            activeList.map((item, idx) => (
              <IndicatorCard
                key={item.id ?? `new-${idx}`}
                item={item}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))
          )}
        </>
      )}
    </Box>
  );
}
