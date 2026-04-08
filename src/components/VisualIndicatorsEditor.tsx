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

function CardMiniPreview({ card }: { card: CardVisualDTO }) {
  return (
    <Box
      sx={{
        borderRadius: 1.5,
        p: 1.5,
        background: card.bgColor,
        backdropFilter: `blur(${card.backdropBlur})`,
        border: `1.5px solid ${card.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 220,
      }}
    >
      {/* Accent pill */}
      <Box
        sx={{
          width: 5,
          height: 44,
          borderRadius: 8,
          background: card.accentColor,
          flexShrink: 0,
        }}
      />
      {/* Icon circle */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: card.iconBgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: card.accentColor,
            opacity: 0.7,
          }}
        />
      </Box>
      <Box flexGrow={1}>
        <Typography
          variant="caption"
          sx={{ color: card.labelTextColor, fontSize: 9, display: 'block' }}
        >
          {card.label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: card.valueTextColor, fontWeight: 700, fontSize: 13 }}
        >
          123.45
        </Typography>
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
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700} color="primary">
          {card.label}
        </Typography>

        <CardMiniPreview card={card} />

        <Divider />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 240px' }}>
            <ColorField
              label="Cor de fundo (bgColor)"
              value={card.bgColor}
              onChange={set('bgColor')}
            />
          </Box>
          <Box sx={{ flex: '1 1 240px' }}>
            <ColorField
              label="Cor de destaque (accentColor)"
              value={card.accentColor}
              onChange={set('accentColor')}
            />
          </Box>
          <Box sx={{ flex: '1 1 240px' }}>
            <ColorField
              label="Cor de fundo do ícone"
              value={card.iconBgColor}
              onChange={set('iconBgColor')}
            />
          </Box>
          <Box sx={{ flex: '1 1 240px' }}>
            <ColorField
              label="Cor da borda"
              value={card.borderColor}
              onChange={set('borderColor')}
            />
          </Box>
          <Box sx={{ flex: '1 1 240px' }}>
            <ColorField
              label="Cor do valor (valueTextColor)"
              value={card.valueTextColor}
              onChange={set('valueTextColor')}
            />
          </Box>
          <Box sx={{ flex: '1 1 240px' }}>
            <ColorField
              label="Cor do rótulo (labelTextColor)"
              value={card.labelTextColor}
              onChange={set('labelTextColor')}
            />
          </Box>
          <Box sx={{ flex: '1 1 100%' }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Desfoque do fundo (backdrop blur): {card.backdropBlur}
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
        </Box>
      </Stack>
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
