import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Upload, Save } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';
import MarkdownRenderer from './MarkdownRenderer';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type CeoMessage = {
  executiveName: string;
  executiveTitle: string;
  quoteText: string;
  bodyText: string;
  photoUrl: string | null;
  updatedAt: string;
};

const DEFAULTS: CeoMessage = {
  executiveName: 'Mário Mota Lemos',
  executiveTitle: 'Presidente da Comissão Executiva',
  quoteText:
    'Em 2024, a ENSA celebrou 46 anos e concluiu com sucesso a sua privatização, tornando-se uma das principais cotadas na BODIVA. Mantivemos a liderança de mercado com uma quota de 27% e um Lucro Líquido de 8,05 mil milhões de Kwanzas, um crescimento expressivo face ao ano anterior.',
  bodyText:
    'Este desempenho reflete o nosso compromisso com a eficiência e inovação, incluindo o lançamento de novos produtos digitais. Agradecemos a confiança dos nossos novos acionistas e o empenho dos nossos colaboradores, fundamentais para estes resultados históricos.',
  photoUrl: null,
  updatedAt: '',
};

export default function CeoMessageEditor() {
  const [data, setData] = useState<CeoMessage>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- Load current message ----
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/ceo-message`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((d: CeoMessage) => setData(d))
      .catch(() => setData(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ---- Save text fields ----
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/ceo-message`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated: CeoMessage = await res.json();
      setData(updated);
      showMsg('success', 'Mensagem guardada com sucesso.');
    } catch {
      showMsg('error', 'Erro ao guardar a mensagem.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Upload photo ----
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/ceo-message/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error();
      const { url }: { url: string } = await res.json();
      setData(prev => ({ ...prev, photoUrl: url }));
      showMsg('success', 'Foto carregada com sucesso.');
    } catch {
      showMsg('error', 'Erro ao carregar a foto.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handle = (field: keyof CeoMessage) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setData(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageUrlBanner urls={{ path: '/', label: 'Home — Mensagem do CEO' }} />

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Edite o texto e a foto do CEO exibidos na página inicial.
      </Typography>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        {/* Photo section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Foto de Perfil
        </Typography>
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Box
            sx={{
              p: '4px',
              borderRadius: '50%',
              border: '1px solid #cbd5e1',
              flexShrink: 0,
            }}
          >
            <Avatar
              src={data.photoUrl || undefined}
              sx={{ width: 120, height: 120, border: '3px solid #fff' }}
              imgProps={{ style: { objectPosition: 'center 10%' } }}
            />
          </Box>
          <Box>
            <Button
              variant="outlined"
              onClick={() => setImageLibraryOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Biblioteca de imagens
            </Button>
            {data.photoUrl && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360, wordBreak: 'break-all' }}>
                {data.photoUrl}
              </Typography>
            )}
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Text fields */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Informação do Executivo
        </Typography>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Nome do Executivo"
            value={data.executiveName}
            onChange={handle('executiveName')}
            fullWidth
          />
          <TextField
            label="Cargo / Título"
            value={data.executiveTitle}
            onChange={handle('executiveTitle')}
            fullWidth
          />
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Texto da Mensagem
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Citação em Destaque (itálico)"
            value={data.quoteText}
            onChange={handle('quoteText')}
            multiline
            minRows={4}
            fullWidth
            helperText='Aparece em itálico entre aspas. Não inclua as aspas — são adicionadas automaticamente.'
          />
          <TextField
            label="Corpo da Mensagem"
            value={data.bodyText}
            onChange={handle('bodyText')}
            multiline
            minRows={4}
            fullWidth
            helperText='Parágrafo principal que aparece abaixo da citação.'
          />
        </Stack>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            onClick={handleSave}
            disabled={saving}
            sx={{ textTransform: 'none', px: 4 }}
          >
            {saving ? 'A guardar…' : 'Guardar Alterações'}
          </Button>
        </Box>
      </Paper>

      {data.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          Última actualização: {data.updatedAt}
        </Typography>
      )}

      <SharedFilePicker
        open={imageLibraryOpen}
        onClose={() => setImageLibraryOpen(false)}
        onSelect={(f) => setData(prev => ({ ...prev, photoUrl: f.url }))}
        title="Biblioteca de imagens do CEO"
      />
    </Box>
  );
}
