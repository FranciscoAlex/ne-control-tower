import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowDown, ArrowUp, Image, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;
const DEFAULT_OVERLAY_START = '#0b3a82';
const DEFAULT_OVERLAY_END = '#0b3a82';
const DEFAULT_OVERLAY_START_OPACITY = 40;
const DEFAULT_OVERLAY_END_OPACITY = 80;
const CUSTOM_OVERLAY_PRESET = 'custom';

const OVERLAY_PRESETS = [
  {
    id: 'ensa-classic',
    label: 'Azul ENSA',
    description: 'O azul institucional actual.',
    start: '#0b3a82',
    end: '#0b3a82',
    startOpacity: 40,
    endOpacity: 80,
  },
  {
    id: 'ensa-soft',
    label: 'Azul Suave',
    description: 'Mais leve e suave sobre a imagem.',
    start: '#3b82c4',
    end: '#164993',
    startOpacity: 28,
    endOpacity: 68,
  },
  {
    id: 'deep-navy',
    label: 'Azul Profundo',
    description: 'Mais intenso, com maior contraste.',
    start: '#081f4d',
    end: '#0b3a82',
    startOpacity: 48,
    endOpacity: 88,
  },
  {
    id: 'dark-neutral',
    label: 'Escuro Neutro',
    description: 'Tom mais neutro para imagens muito coloridas.',
    start: '#1e293b',
    end: '#0f172a',
    startOpacity: 38,
    endOpacity: 78,
  },
];

const hexToRgba = (hex: string, opacity: number) => {
  const safeHex = (hex || DEFAULT_OVERLAY_START).replace('#', '');
  const normalized = safeHex.length === 3
    ? safeHex.split('').map((char) => char + char).join('')
    : safeHex.padEnd(6, '0').slice(0, 6);
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(100, opacity)) / 100})`;
};

type CarouselSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  overlayStartColor?: string;
  overlayEndColor?: string;
  overlayStartOpacity?: number;
  overlayEndOpacity?: number;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  active: boolean;
};

type CarouselSlidesData = {
  updatedAt: string;
  slides: CarouselSlide[];
};

const EMPTY_SLIDE = (): CarouselSlide => ({
  id: `slide-${Date.now()}`,
  title: '',
  subtitle: '',
  imageUrl: '',
  overlayStartColor: DEFAULT_OVERLAY_START,
  overlayEndColor: DEFAULT_OVERLAY_END,
  overlayStartOpacity: DEFAULT_OVERLAY_START_OPACITY,
  overlayEndOpacity: DEFAULT_OVERLAY_END_OPACITY,
  buttonText: '',
  buttonLink: '',
  order: 0,
  active: true,
});

const normalizeSlide = (slide: CarouselSlide): CarouselSlide => ({
  ...slide,
  overlayStartColor: slide.overlayStartColor || DEFAULT_OVERLAY_START,
  overlayEndColor: slide.overlayEndColor || DEFAULT_OVERLAY_END,
  overlayStartOpacity: slide.overlayStartOpacity ?? DEFAULT_OVERLAY_START_OPACITY,
  overlayEndOpacity: slide.overlayEndOpacity ?? DEFAULT_OVERLAY_END_OPACITY,
});

const getOverlayPresetId = (slide: CarouselSlide): string => {
  const normalized = normalizeSlide(slide);
  const preset = OVERLAY_PRESETS.find(
    (item) =>
      item.start.toLowerCase() === normalized.overlayStartColor?.toLowerCase() &&
      item.end.toLowerCase() === normalized.overlayEndColor?.toLowerCase() &&
      item.startOpacity === normalized.overlayStartOpacity &&
      item.endOpacity === normalized.overlayEndOpacity
  );
  return preset?.id || CUSTOM_OVERLAY_PRESET;
};

export default function CarouselEditor() {
  const [data, setData] = useState<CarouselSlidesData>({ updatedAt: '', slides: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSlideId, setSavingSlideId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customGradientOpen, setCustomGradientOpen] = useState(false);
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadIndex = useRef<number>(-1);
  const editingSlide = editingIndex !== null ? data.slides[editingIndex] : null;

  useEffect(() => {
    fetch(`${API_BASE}/carousel-slides`)
      .then((r) => r.json())
      .then((d: CarouselSlidesData) => {
        const sorted = [...(d.slides || [])]
          .map(normalizeSlide)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setData({ ...d, slides: sorted });
      })
      .catch(() => setError('Erro ao carregar slides do carrossel.'))
      .finally(() => setLoading(false));
  }, []);

  const reorder = (slides: CarouselSlide[]) =>
    slides.map((s, i) => ({ ...s, order: i }));

  const moveUp = (index: number) => {
    if (index === 0) return;
    setData((prev) => {
      const next = [...prev.slides];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return { ...prev, slides: reorder(next) };
    });
  };

  const moveDown = (index: number) => {
    setData((prev) => {
      if (index >= prev.slides.length - 1) return prev;
      const next = [...prev.slides];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return { ...prev, slides: reorder(next) };
    });
  };

  const updateSlide = (index: number, patch: Partial<CarouselSlide>) => {
    setData((prev) => {
      const next = [...prev.slides];
      next[index] = { ...next[index], ...patch };
      return { ...prev, slides: next };
    });
  };

  const addSlide = () => {
    setData((prev) => {
      const newSlide = { ...EMPTY_SLIDE(), order: prev.slides.length };
      return { ...prev, slides: [...prev.slides, newSlide] };
    });
  };

  const deleteSlide = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    setData((prev) => ({ ...prev, slides: reorder(prev.slides.filter((_, i) => i !== index)) }));
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
  };

  const closeEditDialog = () => {
    setEditingIndex(null);
    setCustomGradientOpen(false);
    setImageLibraryOpen(false);
  };

  const openCustomGradientDialog = () => {
    setCustomGradientOpen(true);
  };

  const closeCustomGradientDialog = () => {
    setCustomGradientOpen(false);
  };

  const openImageLibraryDialog = () => {
    setImageLibraryOpen(true);
  };

  const closeImageLibraryDialog = () => {
    setImageLibraryOpen(false);
  };

  const handleImageLibrarySelect = (f: { url: string }) => {
    if (editingIndex === null) return;
    updateSlide(editingIndex, { imageUrl: f.url });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/carousel-slides`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: CarouselSlidesData = await res.json();
      setData({ ...updated, slides: (updated.slides || []).map(normalizeSlide) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar slides.');
    } finally {
      setSaving(false);
    }
  };

  const handleApplySlide = async (slideId: string) => {
    setSavingSlideId(slideId);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/carousel-slides`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: CarouselSlidesData = await res.json();
      setData({ ...updated, slides: (updated.slides || []).map(normalizeSlide) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao aplicar alterações do slide.');
    } finally {
      setSavingSlideId(null);
    }
  };

  const triggerUpload = (index: number) => {
    pendingUploadIndex.current = index;
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const index = pendingUploadIndex.current;
    const slide = data.slides[index];
    if (!slide) return;

    setUploadingIndex(index);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/carousel-slides/upload/${encodeURIComponent(slide.id)}`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json() as { url: string };
      updateSlide(index, { imageUrl: url });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer upload da imagem.');
    } finally {
      setUploadingIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <PageUrlBanner urls={{ path: '/', label: 'Página Principal — Carrossel de Destaque' }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b' }}>
            Slides do Carrossel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerir os banners principais da página inicial. Adicione botões e links para direcionar os utilizadores.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
          onClick={handleSave}
          disabled={saving}
          sx={{ 
            borderRadius: 3, 
            textTransform: 'none', 
            fontWeight: 700,
            px: 3,
            height: 48,
            boxShadow: '0 4px 12px rgba(11, 58, 130, 0.25)',
            '&:hover': { boxShadow: '0 6px 16px rgba(11, 58, 130, 0.35)' }
          }}
        >
          {saving ? 'A guardar…' : 'Guardar Alterações'}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ borderRadius: 3 }}>Mudanças aplicadas com sucesso!</Alert>}

      <Grid container spacing={3}>
        {data.slides.map((slide, index) => (
          <Grid key={slide.id} size={{ xs: 12, md: 6, xl: 4 }}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                p: 2.5,
                borderRadius: 5,
                border: '1px solid',
                borderColor: slide.active ? '#dbe3f0' : '#eef2f7',
                bgcolor: slide.active ? '#fff' : '#f8fafc',
                opacity: slide.active ? 1 : 0.82,
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 14px 28px rgba(15, 23, 42, 0.08)',
                  borderColor: '#c7d5ea',
                },
              }}
            >
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 3,
                        bgcolor: '#0b3a82',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Banner {index + 1}
                      </Typography>
                      <Chip
                        size="small"
                        label={slide.active ? 'Activo' : 'Inactivo'}
                        sx={{
                          mt: 0.5,
                          bgcolor: slide.active ? alpha('#16a34a', 0.12) : alpha('#94a3b8', 0.14),
                          color: slide.active ? '#166534' : '#475569',
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                    >
                      <ArrowUp size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => moveDown(index)}
                      disabled={index === data.slides.length - 1}
                      sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                    >
                      <ArrowDown size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteSlide(index)}
                      sx={{ bgcolor: alpha('#ef4444', 0.1), '&:hover': { bgcolor: alpha('#ef4444', 0.2) } }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                </Stack>

                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/10',
                    borderRadius: 4,
                    overflow: 'hidden',
                    backgroundColor: '#e2e8f0',
                    backgroundImage: slide.imageUrl
                      ? `linear-gradient(${hexToRgba(slide.overlayStartColor || DEFAULT_OVERLAY_START, slide.overlayStartOpacity ?? DEFAULT_OVERLAY_START_OPACITY)}, ${hexToRgba(slide.overlayEndColor || DEFAULT_OVERLAY_END, slide.overlayEndOpacity ?? DEFAULT_OVERLAY_END_OPACITY)}), url(${slide.imageUrl})`
                      : 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 2,
                  }}
                >
                  <Box sx={{ color: '#fff' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, textShadow: '0 3px 10px rgba(0,0,0,0.35)' }}>
                      {slide.title || 'Sem título'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        opacity: 0.95,
                        textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                      }}
                    >
                      {slide.subtitle || 'Sem descrição definida.'}
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={1.25} sx={{ mt: 'auto' }}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => openEditDialog(index)}
                      sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
                    >
                      Editar
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleApplySlide(slide.id)}
                      disabled={savingSlideId === slide.id}
                      startIcon={savingSlideId === slide.id ? <CircularProgress size={14} color="inherit" /> : <Save size={14} />}
                      sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
                    >
                      {savingSlideId === slide.id ? 'A aplicar…' : 'Aplicar alterações'}
                    </Button>
                  </Stack>

                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.25 }}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {slide.imageUrl ? 'Imagem definida' : 'Sem imagem'}
                    </Typography>
                    <Tooltip title={slide.active ? 'Desactivar banner' : 'Activar banner'}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                          {slide.active ? 'Activo' : 'Inactivo'}
                        </Typography>
                        <Switch
                          size="small"
                          checked={slide.active}
                          onChange={(e) => updateSlide(index, { active: e.target.checked })}
                        />
                      </Stack>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={editingSlide !== null}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="md"
      >
        {editingSlide && editingIndex !== null && (
          <>
            <DialogTitle sx={{ pb: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Editar Banner {editingIndex + 1}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Ajuste imagem, texto, overlay e estado deste banner.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={editingSlide.active ? 'Activo' : 'Inactivo'}
                    sx={{
                      bgcolor: editingSlide.active ? alpha('#16a34a', 0.12) : alpha('#94a3b8', 0.14),
                      color: editingSlide.active ? '#166534' : '#475569',
                      fontWeight: 700,
                    }}
                  />
                  <IconButton onClick={closeEditDialog} size="small" sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
                    <X size={16} />
                  </IconButton>
                </Stack>
              </Stack>
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                maxHeight: '78vh',
                overflowY: 'auto',
              }}
            >
              <Grid container spacing={3}>
                <Grid
                  size={{ xs: 12, md: 4 }}
                  sx={{
                    alignSelf: 'flex-start',
                    position: { md: 'sticky' },
                    top: { md: 0 },
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '16/10',
                        borderRadius: 4,
                        overflow: 'hidden',
                        bgcolor: '#f1f5f9',
                        border: '2px dashed #cbd5e1',
                        backgroundImage: editingSlide.imageUrl
                          ? `linear-gradient(${hexToRgba(editingSlide.overlayStartColor || DEFAULT_OVERLAY_START, Math.max(12, (editingSlide.overlayStartOpacity ?? DEFAULT_OVERLAY_START_OPACITY) - 10))}, ${hexToRgba(editingSlide.overlayEndColor || DEFAULT_OVERLAY_END, Math.max(24, (editingSlide.overlayEndOpacity ?? DEFAULT_OVERLAY_END_OPACITY) - 10))}), url(${editingSlide.imageUrl})`
                          : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!editingSlide.imageUrl && <Image size={32} color="#94a3b8" />}
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={openImageLibraryDialog}
                      sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1 }}
                    >
                      Escolher da biblioteca
                    </Button>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                        Mostrar banner
                      </Typography>
                      <Switch
                        size="small"
                        checked={editingSlide.active}
                        onChange={(e) => updateSlide(editingIndex, { active: e.target.checked })}
                      />
                    </Stack>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Título Principal"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={editingSlide.title}
                        onChange={(e) => updateSlide(editingIndex, { title: e.target.value })}
                        slotProps={{ input: { sx: { fontWeight: 600 } } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Subtítulo / Descrição"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        value={editingSlide.subtitle}
                        onChange={(e) => updateSlide(editingIndex, { subtitle: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Texto do Botão (CTA)"
                        placeholder="Ex: Saiba Mais"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={editingSlide.buttonText || ''}
                        onChange={(e) => updateSlide(editingIndex, { buttonText: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Link de Destino"
                        placeholder="Ex: /sobre-nos ou https://..."
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={editingSlide.buttonLink || ''}
                        onChange={(e) => updateSlide(editingIndex, { buttonLink: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="URL Directa da Imagem"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={editingSlide.imageUrl}
                        onChange={(e) => updateSlide(editingIndex, { imageUrl: e.target.value })}
                        InputProps={{
                          startAdornment: <Image size={16} style={{ marginRight: 8, color: '#94a3b8' }} />,
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 1 }}>
                        Escolha rápida do overlay
                      </Typography>
                      <Grid container spacing={1.5}>
                        {OVERLAY_PRESETS.map((preset) => {
                          const selected = getOverlayPresetId(editingSlide) === preset.id;
                          return (
                            <Grid key={preset.id} size={{ xs: 12, sm: 6 }}>
                              <Paper
                                onClick={() => updateSlide(editingIndex, {
                                  overlayStartColor: preset.start,
                                  overlayEndColor: preset.end,
                                  overlayStartOpacity: preset.startOpacity,
                                  overlayEndOpacity: preset.endOpacity,
                                })}
                                elevation={0}
                                sx={{
                                  p: 1.25,
                                  borderRadius: 3,
                                  border: '2px solid',
                                  borderColor: selected ? '#0b3a82' : '#e2e8f0',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  bgcolor: selected ? alpha('#0b3a82', 0.04) : '#fff',
                                  '&:hover': {
                                    borderColor: '#0b3a82',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
                                  },
                                }}
                              >
                                <Stack spacing={1}>
                                  <Box
                                    sx={{
                                      height: 52,
                                      borderRadius: 2,
                                      background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                                      border: '1px solid rgba(255,255,255,0.25)',
                                    }}
                                  />
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                      {preset.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4 }}>
                                      {preset.description}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Paper>
                            </Grid>
                          );
                        })}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper
                            onClick={openCustomGradientDialog}
                            elevation={0}
                            sx={{
                              p: 1.25,
                              borderRadius: 3,
                              border: '2px dashed',
                              borderColor: getOverlayPresetId(editingSlide) === CUSTOM_OVERLAY_PRESET ? '#0b3a82' : '#cbd5e1',
                              bgcolor: getOverlayPresetId(editingSlide) === CUSTOM_OVERLAY_PRESET ? alpha('#0b3a82', 0.04) : '#f8fafc',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: '#0b3a82',
                                boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
                              },
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                              Personalizado
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4 }}>
                              Clique para abrir a configuração do gradiente com transparência.
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleApplySlide(editingSlide.id)}
                disabled={savingSlideId === editingSlide.id}
                startIcon={savingSlideId === editingSlide.id ? <CircularProgress size={14} color="inherit" /> : <Save size={14} />}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {savingSlideId === editingSlide.id ? 'A aplicar…' : 'Aplicar alterações'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={customGradientOpen && editingSlide !== null}
        onClose={closeCustomGradientDialog}
        fullWidth
        maxWidth="sm"
      >
        {editingSlide && editingIndex !== null && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Gradiente personalizado
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                    Ajuste as cores e a transparência do overlay deste banner.
                  </Typography>
                </Box>
                <IconButton onClick={closeCustomGradientDialog} size="small" sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
                  <X size={16} />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: 4,
                    backgroundImage: editingSlide.imageUrl
                      ? `linear-gradient(${hexToRgba(editingSlide.overlayStartColor || DEFAULT_OVERLAY_START, editingSlide.overlayStartOpacity ?? DEFAULT_OVERLAY_START_OPACITY)}, ${hexToRgba(editingSlide.overlayEndColor || DEFAULT_OVERLAY_END, editingSlide.overlayEndOpacity ?? DEFAULT_OVERLAY_END_OPACITY)}), url(${editingSlide.imageUrl})`
                      : `linear-gradient(135deg, ${hexToRgba(editingSlide.overlayStartColor || DEFAULT_OVERLAY_START, editingSlide.overlayStartOpacity ?? DEFAULT_OVERLAY_START_OPACITY)}, ${hexToRgba(editingSlide.overlayEndColor || DEFAULT_OVERLAY_END, editingSlide.overlayEndOpacity ?? DEFAULT_OVERLAY_END_OPACITY)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid #dbe3f0',
                  }}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Cor do início"
                      type="color"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={editingSlide.overlayStartColor || DEFAULT_OVERLAY_START}
                      onChange={(e) => updateSlide(editingIndex, { overlayStartColor: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Cor do fim"
                      type="color"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={editingSlide.overlayEndColor || DEFAULT_OVERLAY_END}
                      onChange={(e) => updateSlide(editingIndex, { overlayEndColor: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, mb: 1 }}>
                      Transparência do início: {editingSlide.overlayStartOpacity ?? DEFAULT_OVERLAY_START_OPACITY}%
                    </Typography>
                    <Slider
                      value={editingSlide.overlayStartOpacity ?? DEFAULT_OVERLAY_START_OPACITY}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(_, value) => updateSlide(editingIndex, { overlayStartOpacity: value as number })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, mb: 1 }}>
                      Transparência do fim: {editingSlide.overlayEndOpacity ?? DEFAULT_OVERLAY_END_OPACITY}%
                    </Typography>
                    <Slider
                      value={editingSlide.overlayEndOpacity ?? DEFAULT_OVERLAY_END_OPACITY}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(_, value) => updateSlide(editingIndex, { overlayEndOpacity: value as number })}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }} />
          </>
        )}
      </Dialog>

      <SharedFilePicker
        open={imageLibraryOpen && editingSlide !== null}
        onClose={closeImageLibraryDialog}
        onSelect={handleImageLibrarySelect}
        title="Biblioteca de imagens do banner"
      />

      <Button
        variant="outlined"
        startIcon={<Plus size={20} />}
        onClick={addSlide}
        sx={{ 
          py: 3, 
          borderRadius: 4, 
          border: '2px dashed #cbd5e1', 
          color: '#64748b',
          transition: 'all 0.2s',
          '&:hover': { border: '2px dashed #0b3a82', bgcolor: alpha('#0b3a82', 0.04), color: '#0b3a82' },
          textTransform: 'none',
          fontWeight: 700
        }}
      >
        Adicionar Novo Slide ao Carrossel
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />
    </Stack>
  );
}
