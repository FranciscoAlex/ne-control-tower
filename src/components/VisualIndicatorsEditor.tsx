import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Save } from 'lucide-react';

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

/** Realistic full-size card preview matching the MetricCard in App.tsx */
function CardFullPreview({ card }: { card: CardVisualDTO }) {
  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2.5 },
        position: 'relative',
        minHeight: 190,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        bgcolor: card.bgColor,
        backdropFilter: `blur(${card.backdropBlur})`,
        borderRadius: 1.5,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        border: `1px solid ${card.borderColor}`,
        // Left accent pill identical to App.tsx ::before
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
        {/* Icon + Label row */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: '12px',
              bgcolor: card.iconBgColor,
              color: card.accentColor,
              display: 'flex',
            }}
          >
            {/* Placeholder icon square */}
            <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: card.accentColor, opacity: 0.75 }} />
          </Box>
          <Typography
            variant="body2"
            sx={{ color: card.labelTextColor, fontWeight: 600, letterSpacing: '0.01em' }}
          >
            {card.label}
          </Typography>
        </Stack>

        {/* Value + change row */}
        <Box>
          <Typography
            variant="h4"
            sx={{ mb: 0.5, fontWeight: 700, fontSize: '2.125rem', color: card.valueTextColor }}
          >
            123.45
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                height: 20,
                fontSize: '0.75rem',
                fontWeight: 700,
                px: 1,
                display: 'flex',
                alignItems: 'center',
                borderRadius: '10px',
                bgcolor: 'rgba(16,185,129,0.10)',
                color: '#059669',
              }}
            >
              +2.30%
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              vs sessão anterior
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* Sparkline placeholder */}
      <Box
        sx={{
          mt: 2,
          height: 40,
          borderRadius: 1,
          bgcolor: `${card.accentColor}18`,
          display: 'flex',
          alignItems: 'flex-end',
          px: 1,
          gap: '3px',
          overflow: 'hidden',
        }}
      >
        {[30, 45, 38, 55, 48, 60, 52, 65, 58, 72].map((h, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: `${h}%`,
              borderRadius: '3px 3px 0 0',
              bgcolor: card.accentColor,
              opacity: 0.35 + i * 0.06,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

function CardEditor({
  card,
  onChange,
}: {
  card: CardVisualDTO;
  onChange: (c: CardVisualDTO) => void;
}) {
  const set = (field: keyof CardVisualDTO) => (val: string) =>
    onChange({ ...card, [field]: val });

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700} color="primary">
          {card.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Pré-visualização em tempo real à esquerda · altere qualquer campo para ver o efeito imediato
        </Typography>
      </Box>

      {/* Body: preview + controls side-by-side */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 0,
        }}
      >
        {/* LEFT – live card preview */}
        <Box
          sx={{
            flex: '0 0 auto',
            width: { xs: '100%', md: 300 },
            p: 3,
            bgcolor: '#f1f5f9',
            borderRight: { md: '1px solid' },
            borderColor: { md: 'divider' },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={1} sx={{ textTransform: 'uppercase', alignSelf: 'flex-start' }}>
            Pré-visualização
          </Typography>
          <Box sx={{ width: '100%' }}>
            <CardFullPreview card={card} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Este é o aspecto real do cartão no portal de investidores.
          </Typography>
        </Box>

        {/* RIGHT – controls */}
        <Box sx={{ flex: 1, p: 3 }}>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField
                  label="Cor de fundo (bgColor)"
                  value={card.bgColor}
                  onChange={set('bgColor')}
                />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField
                  label="Cor de destaque (accentColor)"
                  value={card.accentColor}
                  onChange={set('accentColor')}
                />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField
                  label="Cor de fundo do ícone"
                  value={card.iconBgColor}
                  onChange={set('iconBgColor')}
                />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField
                  label="Cor da borda"
                  value={card.borderColor}
                  onChange={set('borderColor')}
                />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField
                  label="Cor do valor"
                  value={card.valueTextColor}
                  onChange={set('valueTextColor')}
                />
              </Box>
              <Box sx={{ flex: '1 1 220px' }}>
                <ColorField
                  label="Cor do rótulo"
                  value={card.labelTextColor}
                  onChange={set('labelTextColor')}
                />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Desfoque do fundo (backdrop blur): <strong>{card.backdropBlur}</strong>
              </Typography>
              <Slider
                value={blurPx(card.backdropBlur)}
                min={0}
                max={40}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}px`}
                onChange={(_, v) => set('backdropBlur')(`${v}px`)}
                sx={{ color: card.accentColor }}
              />
            </Box>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

export default function VisualIndicatorsEditor() {
  const [cards, setCards] = useState<CardVisualDTO[]>(CARD_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/card-visuals`)
      .then((r) => r.json())
      .then((data: CardVisualsDTO) => {
        if (data?.cards?.length) setCards(data.cards);
      })
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, []);

  const handleCardChange = (idx: number, updated: CardVisualDTO) => {
    setCards((prev) => prev.map((c, i) => (i === idx ? updated : c)));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const token = localStorage.getItem('ct_token') || sessionStorage.getItem('ct_token') || '';
      const res = await fetch(`${API_BASE}/card-visuals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          updatedAt: new Date().toISOString(),
          cards,
        }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Indicadores Visuais
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personalize as cores e o desfoque dos 4 cartões de métricas na página inicial.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
          onClick={handleSave}
          disabled={saving}
        >
          Guardar
        </Button>
      </Stack>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Configuração guardada com sucesso.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {cards.map((card, idx) => (
          <CardEditor
            key={card.key}
            card={card}
            onChange={(updated) => handleCardChange(idx, updated)}
          />
        ))}
      </Stack>
    </Box>
  );
}
