import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { GripVertical, X } from 'lucide-react';
import InsightsIcon from '@mui/icons-material/Insights';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import {
  AreaChart,
  Area,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Pencil, Save } from 'lucide-react';


const PRIMARY_MAIN = '#164993';
const SECONDARY_MAIN = '#e63c2e';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

interface CardVisualDTO {
  key: string;
  label: string;
  bgColor: string;
  backdropBlur: string;
  accentColor: string;
  iconBgColor: string;
  borderColor: string;
  valueTextColor: string;
  labelTextColor: string;
}

interface CardVisualsDTO {
  updatedAt: string;
  cards: CardVisualDTO[];
}

const CARD_DEFAULTS: CardVisualDTO[] = [
  {
    key: 'preco-accao',
    label: 'Preço da Acção (Live)',
    bgColor: 'rgba(255,255,255,0.65)',
    backdropBlur: '16px',
    accentColor: '#0b3a82',
    iconBgColor: 'rgba(11,58,130,0.10)',
    borderColor: 'rgba(0,0,0,0.06)',
    valueTextColor: '#1e293b',
    labelTextColor: '#64748b',
  },
  {
    key: 'variacao-dia',
    label: 'Variação do Dia (%)',
    bgColor: 'rgba(255,255,255,0.65)',
    backdropBlur: '16px',
    accentColor: '#0b3a82',
    iconBgColor: 'rgba(11,58,130,0.10)',
    borderColor: 'rgba(0,0,0,0.06)',
    valueTextColor: '#1e293b',
    labelTextColor: '#64748b',
  },
  {
    key: 'valorizacao-ipo',
    label: 'Valorização desde o IPO',
    bgColor: 'rgba(255,255,255,0.65)',
    backdropBlur: '16px',
    accentColor: '#0b3a82',
    iconBgColor: 'rgba(11,58,130,0.10)',
    borderColor: 'rgba(0,0,0,0.06)',
    valueTextColor: '#1e293b',
    labelTextColor: '#64748b',
  },
  {
    key: 'capitalizacao-bolsista',
    label: 'Capitalização Bolsista(kzs)',
    bgColor: 'rgba(255,255,255,0.65)',
    backdropBlur: '16px',
    accentColor: '#0b3a82',
    iconBgColor: 'rgba(11,58,130,0.10)',
    borderColor: 'rgba(0,0,0,0.06)',
    valueTextColor: '#1e293b',
    labelTextColor: '#64748b',
  },
];

function blurPx(val: string): number {
  return parseFloat(val) || 0;
}

/** Extract alpha (0‒100) from rgba(r,g,b,a) or any color string */
function bgAlpha(val: string): number {
  const m = val.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
  if (m) return Math.round(parseFloat(m[1]) * 100);
  return 100; // solid color → 100%
}

/** Replace alpha in an rgba string, or convert hex/rgb to rgba with new alpha */
function setAlpha(val: string, pct: number): string {
  const a = (pct / 100).toFixed(2);
  // Already rgba
  const rgbaMatch = val.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbaMatch) return `rgba(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]},${a})`;
  // Hex #rrggbb or #rgb
  const hexMatch = val.match(/^#([0-9a-f]{3,6})$/i);
  if (hexMatch) {
    const h = hexMatch[1].length === 3
      ? hexMatch[1].split('').map(c => c + c).join('')
      : hexMatch[1];
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return val;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Try to extract a hex from the value to drive the color input preview
  const hexMatch = value.match(/#[0-9a-fA-F]{3,8}/);
  const hexForInput = hexMatch ? hexMatch[0].slice(0, 7) : '#ffffff';

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title="Clique para escolher cor base (hex)">
        <Box
          component="label"
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            border: '2px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            cursor: 'pointer',
            flexShrink: 0,
            backgroundColor: value,
          }}
        >
          <input
            type="color"
            value={hexForInput}
            onChange={(e) => {
              // Preserve rgba alpha if the original was rgba, else just use hex
              const rgbaMatch = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
              if (rgbaMatch) {
                const alpha = rgbaMatch[4];
                const r = parseInt(e.target.value.slice(1, 3), 16);
                const g = parseInt(e.target.value.slice(3, 5), 16);
                const b = parseInt(e.target.value.slice(5, 7), 16);
                onChange(`rgba(${r},${g},${b},${alpha})`);
              } else {
                onChange(e.target.value);
              }
            }}
            style={{ opacity: 0, width: '1px', height: '1px' }}
          />
        </Box>
      </Tooltip>
      <TextField
        size="small"
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 12 } }}
      />
    </Box>
  );
}

// ── Exact copies from src/App.tsx ────────────────────────────────────────────

const CountUp = ({ value, duration = 1500 }: { value: string | number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setIsVisible(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp: number | null = null;
    let target = 0;
    const valueString = value.toString();
    const numMatch = valueString.match(/[\d.]+/);
    if (numMatch) { target = parseFloat(numMatch[0]); }
    else if (typeof value === 'number') { target = value; }
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(easeProgress * target);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [isVisible, value, duration]);

  const valueString = value.toString();
  const numMatch = valueString.match(/[\d.]+/);
  const suffix = numMatch ? valueString.split(numMatch[0])[1] || '' : '';
  const prefix = numMatch ? valueString.split(numMatch[0])[0] || '' : '';
  return (
    <span ref={elementRef}>
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: valueString.includes('.') ? 1 : 0,
        maximumFractionDigits: 2,
      })}
      {suffix}
    </span>
  );
};

function Sparkline({ color = '#0a84ff', data, trend = 'up' }: { color?: string; data?: number[]; trend?: 'up' | 'down' }) {
  const values = useMemo(() => {
    if (data) return data;
    const isUp = trend === 'up';
    const start = isUp ? (30 + Math.random() * 20) : (70 + Math.random() * 20);
    const points = [start];
    for (let i = 1; i < 20; i++) {
      const prev = points[i - 1];
      const drift = isUp ? 0.4 : 0.6;
      const change = (Math.random() - drift) * 16;
      points.push(Math.max(10, prev + change));
    }
    return points;
  }, [data, trend]);

  const chartData = values.map((val, i) => ({ i, val }));
  const gradientId = `grad-${color.replace('#', '')}-${Math.random()}`;

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={true}
            animationDuration={1500}
          />
          <ReferenceLine
            segment={[
              { x: chartData.length - 1, y: chartData[chartData.length - 1].val },
              { x: chartData.length - 1.01, y: chartData[chartData.length - 1].val },
            ]}
            stroke={color}
            strokeWidth={0}
            label={(props: any) => (
              <circle cx={props.viewBox.x} cy={props.viewBox.y} r={3} fill={color} />
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

/** Exact MetricCard from src/App.tsx — only superUser forced false, icon fixed to InsightsIcon */
function MetricCardPreview({ card }: { card: CardVisualDTO }) {
  const label = card.label;
  const value = '46.000 Kzs';
  const change = '+0.80%';
  const trimmedChange = change.trim();
  const positive = trimmedChange.startsWith('+');
  const negative = trimmedChange.startsWith('-');
  const displayIcon = <InsightsIcon />;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2.5 },
        position: 'relative',
        height: '100%',
        minHeight: { xs: 110, md: 190 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        bgcolor: card.bgColor,
        backdropFilter: `blur(${card.backdropBlur})`,
        borderRadius: { xs: 1, md: 1.5 },
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.03)',
        border: `1px solid ${card.borderColor}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '2px',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '60%',
          borderRadius: '4px',
          bgcolor: card.accentColor,
          boxShadow: `0 0 8px ${card.accentColor}66`,
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            p: 1,
            borderRadius: '12px',
            bgcolor: alpha(card.accentColor ?? PRIMARY_MAIN, 0.1),
            color: card.accentColor ?? 'primary.main',
            display: 'flex',
          }}>
            {React.cloneElement(displayIcon as React.ReactElement, { fontSize: 'small' })}
          </Box>
          <Typography variant="body2" sx={{ color: card.labelTextColor ?? 'text.secondary', fontWeight: 600, letterSpacing: '0.01em' }}>
            {label}
          </Typography>
        </Stack>

        <Box>
          <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 700, fontSize: { xs: '1.1rem', md: '2.125rem' }, color: card.valueTextColor ?? 'inherit' }}>
            <CountUp value={value} duration={2500} />
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{
              height: 20, fontSize: '0.75rem', fontWeight: 700, px: 1,
              display: 'flex', alignItems: 'center', borderRadius: '10px',
              bgcolor: positive ? alpha('#10b981', 0.1) : negative ? alpha(SECONDARY_MAIN, 0.1) : alpha('#64748b', 0.1),
              color: positive ? 'success.dark' : negative ? SECONDARY_MAIN : 'text.secondary',
              border: 'none',
            }}>
              <CountUp value={change} duration={2000} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
              vs sessão anterior
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Box sx={{ mt: { xs: 0, md: 2 }, height: { xs: 0, md: 50 }, display: { xs: 'none', md: 'block' } }}>
        <Sparkline color={card.accentColor ?? '#0a84ff'} trend="up" />
      </Box>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/** Dialog with preview at top + controls below — saves only this card */
function CardEditDialog({
  card,
  open,
  onClose,
  onSave,
}: {
  card: CardVisualDTO;
  open: boolean;
  onClose: () => void;
  onSave: (updated: CardVisualDTO) => Promise<void>;
}) {
  const [draft, setDraft] = useState<CardVisualDTO>(card);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset draft whenever the dialog opens for a (possibly different) card
  useEffect(() => { setDraft(card); setSuccess(false); setError(null); }, [open, card.key]);

  const set = (field: keyof CardVisualDTO) => (val: string) =>
    setDraft((prev) => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await onSave(draft);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{card.label}</Typography>
          <Typography variant="caption" color="text.secondary">
            A pré-visualização actualiza em tempo real conforme edita.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* ── PREVIEW STRIP ── */}
        <Box
          sx={{
            position: 'relative',
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            // Rich background so backdrop-blur is actually visible
            background: [
              'linear-gradient(135deg, #0b3a82 0%, #164993 30%, #1e6abf 55%, #0b3a82 80%, #061e4a 100%)',
            ].join(','),
          }}
        >
          {/* Decorative blobs behind the card — give the blur something to blur */}
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', bgcolor: '#f59e0b', opacity: 0.35, top: -40, left: '15%', filter: 'blur(2px)' }} />
            <Box sx={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', bgcolor: '#10b981', opacity: 0.3, bottom: -30, right: '10%', filter: 'blur(2px)' }} />
            <Box sx={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', bgcolor: '#e63c2e', opacity: 0.25, top: '20%', right: '30%', filter: 'blur(1px)' }} />
            <Box sx={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', bgcolor: '#ffffff', opacity: 0.12, bottom: 10, left: '5%' }} />
          </Box>

          {/* Label */}
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', display: 'block', mb: 2, position: 'relative', zIndex: 1 }}>
            Pré-visualização — o desfoque é visível sobre esta imagem
          </Typography>

          {/* Card floated over the background */}
          <Box sx={{ maxWidth: 280, position: 'relative', zIndex: 1 }}>
            <MetricCardPreview card={draft} />
          </Box>
        </Box>

        {/* ── CONTROLS ── */}
        <Box sx={{ p: 3 }}>
          {success && <Alert severity="success" sx={{ mb: 2 }}>Guardado com sucesso.</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField label="Cor de fundo" value={draft.bgColor} onChange={set('bgColor')} />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField label="Cor de destaque" value={draft.accentColor} onChange={set('accentColor')} />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField label="Cor de fundo do ícone" value={draft.iconBgColor} onChange={set('iconBgColor')} />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField label="Cor da borda" value={draft.borderColor} onChange={set('borderColor')} />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField label="Cor do valor" value={draft.valueTextColor} onChange={set('valueTextColor')} />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField label="Cor do rótulo" value={draft.labelTextColor} onChange={set('labelTextColor')} />
              </Box>
            </Box>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Desfoque (backdrop blur): <strong>{draft.backdropBlur}</strong>
                </Typography>
                <Slider
                  value={blurPx(draft.backdropBlur)}
                  min={0}
                  max={40}
                  step={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}px`}
                  onChange={(_, v) => set('backdropBlur')(`${v}px`)}
                  sx={{ color: draft.accentColor }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Transparência do fundo: <strong>{bgAlpha(draft.bgColor)}%</strong>
                </Typography>
                <Slider
                  value={bgAlpha(draft.bgColor)}
                  min={0}
                  max={100}
                  step={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}%`}
                  onChange={(_, v) => set('bgColor')(setAlpha(draft.bgColor, v as number))}
                  sx={{ color: draft.accentColor }}
                />
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={onClose} variant="outlined" disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={14} />}
              >
                Guardar cartão
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function VisualIndicatorsEditor() {
  const [cards, setCards] = useState<CardVisualDTO[]>(CARD_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragJustFinished = useRef(false);

  useEffect(() => {
    fetch(`${API_BASE}/card-visuals`)
      .then((r) => r.json())
      .then((data: CardVisualsDTO) => {
        if (data?.cards?.length) setCards(data.cards);
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, []);

  const putCards = async (newCards: CardVisualDTO[]) => {
    const token = localStorage.getItem('ct_token') || sessionStorage.getItem('ct_token') || '';
    const res = await fetch(`${API_BASE}/card-visuals`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ updatedAt: new Date().toISOString(), cards: newCards }),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
  };

  const handleDrop = async (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) return;
    const reordered = [...cards];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setCards(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
    dragJustFinished.current = true;
    setTimeout(() => { dragJustFinished.current = false; }, 200);
    try { await putCards(reordered); } catch { /* non-critical */ }
  };

  /** Save a single card: optimistically update state, then PUT the full array */
  const handleSaveCard = async (updated: CardVisualDTO) => {
    const newCards = cards.map((c) => (c.key === updated.key ? updated : c));
    await putCards(newCards);
    setCards(newCards);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Indicadores Visuais</Typography>
          <Typography variant="body2" color="text.secondary">
            Clique num cartão para editar as suas cores e estilos. Arraste para reordenar.
          </Typography>
        </Box>
      </Stack>

      {/* Card grid */}
      <Grid container spacing={2}>
        {cards.map((card, idx) => (
          <Grid key={card.key} size={{ xs: 12, sm: 6 }}>
            <Box
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              onClick={() => { if (dragJustFinished.current) return; setEditingIdx(idx); }}
              sx={{
                cursor: 'grab',
                position: 'relative',
                borderRadius: 1.5,
                transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
                opacity: dragIdx === idx ? 0.45 : 1,
                outline: dragOverIdx === idx && dragIdx !== idx ? '2px dashed #164993' : 'none',
                outlineOffset: 2,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
                },
                '&:hover .edit-badge': { opacity: 1 },
                '&:hover .drag-grip': { opacity: 1 },
              }}
            >
              <MetricCardPreview card={card} />
              {/* Drag grip */}
              <Box
                className="drag-grip"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  opacity: 0,
                  transition: 'opacity 0.15s',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  borderRadius: 1,
                  p: 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  pointerEvents: 'none',
                }}
              >
                <GripVertical size={14} color="#555" />
              </Box>
              {/* Edit badge overlay */}
              <Box
                className="edit-badge"
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  opacity: 0,
                  transition: 'opacity 0.15s',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  borderRadius: 2,
                  px: 1,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                <Pencil size={12} />
                <Typography variant="caption" fontWeight={700} fontSize={11}>Editar</Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Edit dialog */}
      {editingIdx !== null && (
        <CardEditDialog
          open={editingIdx !== null}
          card={cards[editingIdx!]}
          onClose={() => setEditingIdx(null)}
          onSave={handleSaveCard}
        />
      )}
    </Box>
  );
}
