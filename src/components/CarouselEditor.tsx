import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
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
  buttonText: '',
  buttonLink: '',
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

      <Stack spacing={3}>
        {data.slides.map((slide, index) => (
          <Paper
            key={slide.id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 5,
              border: '1px solid',
              borderColor: slide.active ? '#e2e8f0' : '#f1f5f9',
              bgcolor: slide.active ? 'white' : '#f8fafc',
              opacity: slide.active ? 1 : 0.75,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                borderColor: slide.active ? '#cbd5e1' : '#e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {/* Background accent for index */}
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                left: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: slide.active ? alpha('#0b3a82', 0.03) : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 0
              }}
            />

            <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              {/* Header row */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 3,
                    bgcolor: slide.active ? '#0b3a82' : '#94a3b8',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    flexShrink: 0,
                    boxShadow: slide.active ? '0 4px 8px rgba(11, 58, 130, 0.2)' : 'none'
                  }}
                >
                  {index + 1}
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, color: '#1e293b' }} noWrap>
                  {slide.title || '(Slide sem título)'}
                </Typography>
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title={slide.active ? "Desactivar Slide" : "Activar Slide"}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 2 }}>
                      <Typography variant="caption" fontWeight={700} color={slide.active ? "primary" : "text.secondary"}>
                        {slide.active ? "ACTIVO" : "INACTIVO"}
                      </Typography>
                      <Switch
                        size="small"
                        checked={slide.active}
                        onChange={(e) => updateSlide(index, { active: e.target.checked })}
                      />
                    </Stack>
                  </Tooltip>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 20, my: 'auto' }} />
                  
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

              <Grid container spacing={3}>
                {/* Image Preview & Upload */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '16/9',
                        borderRadius: 4,
                        overflow: 'hidden',
                        bgcolor: '#f1f5f9',
                        border: '2px dashed #cbd5e1',
                        backgroundImage: slide.imageUrl ? `url(${slide.imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#164993' }
                      }}
                    >
                      {!slide.imageUrl && <Image size={32} color="#94a3b8" />}
                      {slide.imageUrl && (
                        <Box sx={{ width: '100%', height: '100%', bgcolor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }}>
                           <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>PREVIEW</Typography>
                        </Box>
                      )}
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => triggerUpload(index)}
                      disabled={uploadingIndex === index}
                      startIcon={uploadingIndex === index ? <CircularProgress size={14} /> : <Upload size={14} />}
                      sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1 }}
                    >
                      {uploadingIndex === index ? 'A carregar…' : 'Alterar Imagem'}
                    </Button>
                  </Stack>
                </Grid>

                {/* Content Fields */}
                <Grid size={{ xs: 12, md: 9 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Título Principal"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={slide.title}
                        onChange={(e) => updateSlide(index, { title: e.target.value })}
                        slotProps={{ input: { sx: { fontWeight: 600 } } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Subtítulo / Descrição"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        value={slide.subtitle}
                        onChange={(e) => updateSlide(index, { subtitle: e.target.value })}
                      />
                    </Grid>
                    
                    {/* CTA Section */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Texto do Botão (CTA)"
                        placeholder="Ex: Saiba Mais"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={slide.buttonText || ''}
                        onChange={(e) => updateSlide(index, { buttonText: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Link de Destino"
                        placeholder="Ex: /sobre-nos ou https://..."
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={slide.buttonLink || ''}
                        onChange={(e) => updateSlide(index, { buttonLink: e.target.value })}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="URL Directa da Imagem"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={slide.imageUrl}
                        onChange={(e) => updateSlide(index, { imageUrl: e.target.value })}
                        InputProps={{
                          startAdornment: <Image size={16} style={{ marginRight: 8, color: '#94a3b8' }} />,
                        }}
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        ))}
      </Stack>

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
