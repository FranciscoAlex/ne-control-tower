import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Upload, X } from 'lucide-react';

type AssetItem = {
  name: string;
  url: string;
  path: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
};

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

export default function SharedImagePickerDialog({
  open,
  onClose,
  onSelect,
  title = 'Biblioteca de imagens',
}: Props) {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((item) =>
      item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)
    );
  }, [assets, search]);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/media-assets/images`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as AssetItem[];
      setAssets(Array.isArray(data) ? data : []);
    } catch {
      setError('Erro ao carregar biblioteca de imagens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadAssets();
  }, [open]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`${API_BASE}/media-assets/images/upload`, {
        method: 'POST',
        body: form,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { url?: string };
      if (payload.url) {
        onSelect(payload.url);
      }
      await loadAssets();
      onClose();
    } catch {
      setError('Erro ao carregar nova imagem para a biblioteca.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>{title}</Typography>
          <Button onClick={onClose} size="small" sx={{ minWidth: 'auto', p: 1 }}>
            <X size={16} />
          </Button>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '70vh' }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label="Pesquisar imagem"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              component="label"
              variant="contained"
              startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <Upload size={14} />}
              disabled={uploading}
              sx={{ textTransform: 'none', fontWeight: 700, minWidth: { sm: 210 } }}
            >
              {uploading ? 'A carregar…' : 'Carregar nova imagem'}
              <input type="file" accept="image/*" hidden onChange={handleUpload} />
            </Button>
          </Stack>

          {error && (
            <Typography variant="body2" sx={{ color: '#b91c1c', fontWeight: 600 }}>
              {error}
            </Typography>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredAssets.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc' }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Nenhuma imagem disponível na biblioteca.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={1.5}>
              {filteredAssets.map((asset) => (
                <Grid key={asset.url} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper
                    onClick={() => {
                      onSelect(asset.url);
                      onClose();
                    }}
                    elevation={0}
                    sx={{
                      p: 1,
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#0b3a82', boxShadow: '0 8px 16px rgba(15, 23, 42, 0.08)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '16/10',
                        borderRadius: 2,
                        backgroundImage: `url(${asset.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        bgcolor: '#e2e8f0',
                      }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#334155' }} noWrap>
                      {asset.name}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
