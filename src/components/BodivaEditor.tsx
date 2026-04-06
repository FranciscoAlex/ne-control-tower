import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
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
import { Check, Download, Plus, Trash2, X } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;
const BODIVA_PUBLIC_API = 'https://www.bodiva.ao/website/api/GetAllDaillyTradeAmountVariation_no.php?securityCode=ENSAAAAA&timeline=0';
const MAX_SEED_RECORDS = 180;

type BodivaTradeRecord = {
  Data: string;
  Preco: number;
  Quantidade: number;
};

type ShareEntry = {
  id?: number;
  date: string;
  openPrice: number;
  closePrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  change?: number;
  changePercent?: number;
};

function emptyEntry(): ShareEntry {
  return {
    date: new Date().toISOString().split('T')[0],
    openPrice: 0,
    closePrice: 0,
    highPrice: 0,
    lowPrice: 0,
    volume: 0,
    change: 0,
    changePercent: 0,
  };
}

function fmt(n: number | undefined, dec = 2) {
  if (n === undefined || n === null) return '—';
  return n.toFixed(dec);
}

function toDateOnly(raw: string): string | null {
  const datePart = raw?.split(' ')[0];
  if (!datePart) return null;
  const d = new Date(datePart);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function aggregateBodivaTradesToShareEntries(trades: BodivaTradeRecord[]): ShareEntry[] {
  const grouped = new Map<string, BodivaTradeRecord[]>();
  const sortedTrades = [...trades].sort((a, b) => {
    const da = new Date(a.Data).getTime();
    const db = new Date(b.Data).getTime();
    return da - db;
  });

  for (const trade of sortedTrades) {
    const day = toDateOnly(trade.Data);
    if (!day) continue;
    if (!grouped.has(day)) {
      grouped.set(day, []);
    }
    grouped.get(day)!.push(trade);
  }

  return Array.from(grouped.entries())
    .map(([date, dayTrades]) => {
      const prices = dayTrades
        .map(t => Number(t.Preco))
        .filter(v => Number.isFinite(v));

      if (prices.length === 0) return null;

      const openPrice = prices[0];
      const closePrice = prices[prices.length - 1];
      const highPrice = Math.max(...prices);
      const lowPrice = Math.min(...prices);
      const volume = dayTrades.reduce((sum, t) => sum + (Number(t.Quantidade) || 0), 0);

      return {
        date,
        openPrice,
        closePrice,
        highPrice,
        lowPrice,
        volume,
      } as ShareEntry;
    })
    .filter((entry): entry is ShareEntry => Boolean(entry))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function NewEntryForm({ onSubmit, onCancel }: { onSubmit: (e: ShareEntry) => Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<ShareEntry>(emptyEntry());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (field: keyof ShareEntry) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(p => ({ ...p, [field]: field === 'date' ? e.target.value : Number(e.target.value) }));

  const submit = async () => {
    if (!data.date) { setErr('Data obrigatória.'); return; }
    try { setSaving(true); await onSubmit(data); } catch { setErr('Erro ao criar.'); } finally { setSaving(false); }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '2px dashed #164993', bgcolor: '#f9fbff' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#164993', mb: 2 }}>Nova Entrada BODIVA</Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <TextField label="Data *" type="date" value={data.date} onChange={set('date')} size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} autoFocus />
          <TextField label="Abertura (AOA)" type="number" value={data.openPrice} onChange={set('openPrice')} size="small" sx={{ minWidth: 140 }} inputProps={{ step: 0.01 }} />
          <TextField label="Fecho (AOA)" type="number" value={data.closePrice} onChange={set('closePrice')} size="small" sx={{ minWidth: 140 }} inputProps={{ step: 0.01 }} />
          <TextField label="Máximo" type="number" value={data.highPrice} onChange={set('highPrice')} size="small" sx={{ minWidth: 120 }} inputProps={{ step: 0.01 }} />
          <TextField label="Mínimo" type="number" value={data.lowPrice} onChange={set('lowPrice')} size="small" sx={{ minWidth: 120 }} inputProps={{ step: 0.01 }} />
          <TextField label="Volume" type="number" value={data.volume} onChange={set('volume')} size="small" sx={{ minWidth: 120 }} />
          <TextField label="Variação (AOA)" type="number" value={data.change || 0} onChange={set('change')} size="small" sx={{ minWidth: 130 }} inputProps={{ step: 0.01 }} />
          <TextField label="Variação (%)" type="number" value={data.changePercent || 0} onChange={set('changePercent')} size="small" sx={{ minWidth: 120 }} inputProps={{ step: 0.01 }} />
        </Stack>
        {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={submit} disabled={saving} startIcon={saving ? <CircularProgress size={13} /> : <Check size={13} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Registar</Button>
          <Button onClick={onCancel} startIcon={<X size={13} />} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancelar</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function BodivaEditor() {
  const [entries, setEntries] = useState<ShareEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [autoSeedAttempted, setAutoSeedAttempted] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE}/bodiva-share-history`);
      const d = await r.json();
      setEntries(Array.isArray(d) ? d.sort((a: ShareEntry, b: ShareEntry) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []);
    } catch { setMsg({ type: 'error', text: 'Erro ao carregar.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const seedInitialData = async () => {
    try {
      setSeeding(true);

      const publicResponse = await fetch(BODIVA_PUBLIC_API);
      if (!publicResponse.ok) {
        throw new Error('Falha ao obter dados públicos da BODIVA.');
      }

      const tradeData = (await publicResponse.json()) as BodivaTradeRecord[];
      const aggregated = aggregateBodivaTradesToShareEntries(Array.isArray(tradeData) ? tradeData : []);
      if (aggregated.length === 0) {
        throw new Error('Sem dados válidos para importação.');
      }

      const existingDates = new Set(entries.map(e => e.date));
      const candidates = aggregated
        .filter(entry => !existingDates.has(entry.date))
        .slice(0, MAX_SEED_RECORDS);

      if (candidates.length === 0) {
        setMsg({ type: 'success', text: 'Dados iniciais já estão carregados.' });
        return;
      }

      let imported = 0;
      for (const item of candidates) {
        const response = await fetch(`${API_BASE}/bodiva-share-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          imported += 1;
        }
      }

      await load();
      setMsg({ type: imported > 0 ? 'success' : 'error', text: imported > 0 ? `Importação concluída: ${imported} registos BODIVA.` : 'Não foi possível importar novos registos.' });
    } catch {
      setMsg({ type: 'error', text: 'Falha ao inicializar dados BODIVA.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleCreate = async (e: ShareEntry) => {
    const r = await fetch(`${API_BASE}/bodiva-share-history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
    if (!r.ok) throw new Error();
    const saved = await r.json();
    setEntries(p => [saved, ...p].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowNew(false);
    setMsg({ type: 'success', text: 'Entrada registada.' });
  };
  const handleDelete = async (id: number) => {
    await fetch(`${API_BASE}/bodiva-share-history/${id}`, { method: 'DELETE' });
    setEntries(p => p.filter(x => x.id !== id));
    setConfirmDelete(null);
    setMsg({ type: 'success', text: 'Removido.' });
  };

  const latest = entries[0];

  useEffect(() => {
    if (loading || seeding || autoSeedAttempted || entries.length > 0) return;
    setAutoSeedAttempted(true);
    seedInitialData();
  }, [loading, seeding, autoSeedAttempted, entries.length]);

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Cotações históricas da acção ENSA na Bolsa de Dívida e Valores de Angola.</Typography>
        </Box>
        <Stack direction="row" spacing={1.2}>
          <Button
            variant="outlined"
            startIcon={seeding ? <CircularProgress size={14} /> : <Download size={16} />}
            onClick={seedInitialData}
            disabled={loading || seeding}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
          >
            {seeding ? 'A importar...' : 'Inicializar Dados'}
          </Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowNew(v => !v)} sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>Nova Cotação</Button>
        </Stack>
      </Stack>
      <PageUrlBanner urls={{ label: 'Dashboard Financeiro', path: '/dashboard-financeiro' }} />
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      {latest && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 1.5 }}>Última Cotação — {new Date(latest.date).toLocaleDateString('pt-AO')}</Typography>
          <Stack direction="row" spacing={4} sx={{ mt: 1 }} flexWrap="wrap">
            {[
              { label: 'Fecho', value: `${fmt(latest.closePrice)} AOA` },
              { label: 'Abertura', value: `${fmt(latest.openPrice)} AOA` },
              { label: 'Máximo', value: `${fmt(latest.highPrice)} AOA` },
              { label: 'Mínimo', value: `${fmt(latest.lowPrice)} AOA` },
              { label: 'Volume', value: latest.volume?.toLocaleString('pt-AO') ?? '—' },
              { label: 'Variação', value: latest.changePercent != null ? `${latest.changePercent > 0 ? '+' : ''}${fmt(latest.changePercent)}%` : '—', color: (latest.changePercent ?? 0) > 0 ? '#16a34a' : (latest.changePercent ?? 0) < 0 ? '#dc2626' : '#475569' },
            ].map(kv => (
              <Box key={kv.label}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>{kv.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: kv.color || '#1e293b', fontSize: '1.05rem' }}>{kv.value}</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {showNew && <NewEntryForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}
      {loading
        ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
        : (
          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Data', 'Abertura', 'Fecho', 'Máximo', 'Mínimo', 'Volume', 'Var. %', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: 11, letterSpacing: 0.5, py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length === 0
                  ? <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>Sem dados BODIVA registados. Clique em "Inicializar Dados" para importar o histórico inicial.</TableCell></TableRow>
                  : entries.map(e => (
                    <TableRow key={e.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{new Date(e.date).toLocaleDateString('pt-AO')}</TableCell>
                      <TableCell>{fmt(e.openPrice)}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{fmt(e.closePrice)}</TableCell>
                      <TableCell>{fmt(e.highPrice)}</TableCell>
                      <TableCell>{fmt(e.lowPrice)}</TableCell>
                      <TableCell>{e.volume?.toLocaleString('pt-AO')}</TableCell>
                      <TableCell sx={{ color: (e.changePercent ?? 0) > 0 ? '#16a34a' : (e.changePercent ?? 0) < 0 ? '#dc2626' : '#475569', fontWeight: 700 }}>
                        {e.changePercent != null ? `${e.changePercent > 0 ? '+' : ''}${fmt(e.changePercent)}%` : '—'}
                      </TableCell>
                      <TableCell>
                        {confirmDelete === e.id
                          ? <Stack direction="row" spacing={0.5}>
                              <Button size="small" color="error" variant="contained" onClick={() => handleDelete(e.id!)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 11 }}>Confirmar</Button>
                              <Button size="small" onClick={() => setConfirmDelete(null)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 11 }}>Cancelar</Button>
                            </Stack>
                          : <Button size="small" color="error" startIcon={<Trash2 size={12} />} onClick={() => setConfirmDelete(e.id!)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 11 }}>Remover</Button>
                        }
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        )
      }
    </Box>
  );
}
