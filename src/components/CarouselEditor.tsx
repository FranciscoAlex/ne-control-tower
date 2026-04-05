import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowDown, ArrowUp, Image, Plus, Save, Trash2, Upload } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type CarouselSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
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
  order: 0,
  active: true,
});

export default function CarouselEditor() {
  const [data, setData] = useState<CarouselSlidesData>({ updatedAt: '', slides: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadIndex = useRef<number>(-1);

  useEffect(() => {
    fetch(`${API_BASE}/carousel-slides`)
      .then((r) => r.json())
      .then((d: CarouselSlidesData) => {
        const sorted = [...(d.slides || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
    setData((prev) => ({ ...prev, slides: reorder(prev.slides.filter((_, i) => i !== index)) }));
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
      setData(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar slides.');
    } finally {
      setSaving(false);
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
    <Stack spacing={3}>
      <PageUrlBanner urls={{ path: '/', label: 'Página Principal — Carrossel de Destaque' }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerir slides do banner hero. Arraste com as setas para reordenar.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          {saving ? 'A guardar…' : 'Guardar Tudo'}
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Slides guardados com sucesso! O carrossel será atualizado.</Alert>}

      <Stack spacing={2}>
        {data.slides.map((slide, index) => (
          <Paper
            key={slide.id}
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              borderColor: slide.active ? '#e2e8f0' : '#f1f5f9',
              opacity: slide.active ? 1 : 0.55,
              transition: 'opacity .2s',
            }}
          >
            <Stack spacing={2}>
              {/* Header row */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: slide.active ? '#0b3a82' : '#94a3b8',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography fontWeight={600} sx={{ flex: 1 }} noWrap>
                  {slide.title || '(sem título)'}
                </Typography>
                <Tooltip title="Ativo / Inativo">
                  <Switch
                    size="small"
                    checked={slide.active}
                    onChange={(e) => updateSlide(index, { active: e.target.checked })}
                  />
                </Tooltip>
                <Tooltip title="Mover acima">
                  <span>
                    <IconButton size="small" onClick={() => moveUp(index)} disabled={index === 0}>
                      <ArrowUp size={16} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Mover abaixo">
                  <span>
                    <IconButton size="small" onClick={() => moveDown(index)} disabled={index === data.slides.length - 1}>
                      <ArrowDown size={16} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Eliminar slide">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => deleteSlide(index)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Fields */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {/* Slide preview thumbnail + upload */}
                <Stack spacing={1} sx={{ width: { xs: '100%', md: 140 }, flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 80,
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: '#f1f5f9',
                      backgroundImage: slide.imageUrl ? `linear-gradient(rgba(11,58,130,.4),rgba(11,58,130,.8)), url(${slide.imageUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                    }}
                  >
                    {!slide.imageUrl && <Image size={28} />}
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => triggerUpload(index)}
                    disabled={uploadingIndex === index}
                    startIcon={uploadingIndex === index ? <CircularProgress size={12} /> : <Upload size={13} />}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
                  >
                    {uploadingIndex === index ? 'A carregar…' : 'Upload'}
                  </Button>
                </Stack>

                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  <TextField
                    label="Título"
                    size="small"
                    fullWidth
                    value={slide.title}
                    onChange={(e) => updateSlide(index, { title: e.target.value })}
                  />
                  <TextField
                    label="Subtítulo"
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(index, { subtitle: e.target.value })}
                  />
                  <TextField
                    label="URL da Imagem de Fundo"
                    size="small"
                    fullWidth
                    placeholder="https://..."
                    value={slide.imageUrl}
                    onChange={(e) => updateSlide(index, { imageUrl: e.target.value })}
                    InputProps={{
                      startAdornment: <Image size={14} style={{ marginRight: 6, color: '#94a3b8', flexShrink: 0 }} />,
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Button
        variant="outlined"
        startIcon={<Plus size={16} />}
        onClick={addSlide}
        sx={{ alignSelf: 'flex-start', borderRadius: 2, textTransform: 'none' }}
      >
        Adicionar Slide
      </Button>

      {/* Hidden file input shared across all slides */}
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
