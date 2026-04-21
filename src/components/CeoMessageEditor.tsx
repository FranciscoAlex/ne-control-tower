import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Save } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';
import SharedFilePicker from './SharedFilePicker';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type CeoMessage = {
  executiveName: string;
  executiveTitle: string;
  executiveName2: string;
  executiveTitle2: string;
  quoteText: string;
  bodyText: string;
  photoUrl: string | null;
  photoUrl2: string | null;
  updatedAt: string;
};

const DEFAULTS: CeoMessage = {
  executiveName: 'Helena Francisco',
  executiveTitle: 'Presidente do Conselho de Administração',
  executiveName2: 'Mário Mota Lemos',
  executiveTitle2: 'Presidente da Comissão Executiva',
  quoteText:
    'Em 2024, a ENSA celebrou 46 anos e concluiu com sucesso a sua privatização, tornando-se uma das principais cotadas na BODIVA. Mantivemos a liderança de mercado com uma quota de 27% e um Lucro Líquido de 8,05 mil milhões de Kwanzas, um crescimento expressivo face ao ano anterior.',
  bodyText:
    'Este desempenho reflete o nosso compromisso com a eficiência e inovação, incluindo o lançamento de novos produtos digitais. Agradecemos a confiança dos nossos novos acionistas e o empenho dos nossos colaboradores, fundamentais para estes resultados históricos.',
  photoUrl: null,
  photoUrl2: null,
  updatedAt: '',
};

export default function CeoMessageEditor() {
  const [data, setData] = useState<CeoMessage>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerField, setPickerField] = useState<'photoUrl' | 'photoUrl2' | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ---- Load ----
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/ceo-message`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((d: CeoMessage) => setData({ ...DEFAULTS, ...d }))
      .catch(() => setData(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ---- Save ----
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
      setData({ ...DEFAULTS, ...updated });
      showMsg('success', 'Mensagem guardada com sucesso.');
    } catch {
      showMsg('error', 'Erro ao guardar a mensagem.');
    } finally {
      setSaving(false);
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

  const execSections: Array<{
    label: string;
    nameField: 'executiveName' | 'executiveName2';
    titleField: 'executiveTitle' | 'executiveTitle2';
    photoField: 'photoUrl' | 'photoUrl2';
    accent: string;
  }> = [
    { label: 'Presidente do CA (1.º)', nameField: 'executiveName', titleField: 'executiveTitle', photoField: 'photoUrl', accent: '#164993' },
    { label: 'Presidente da CE (2.º)', nameField: 'executiveName2', titleField: 'executiveTitle2', photoField: 'photoUrl2', accent: '#e63c2e' },
  ];

  return (
    <Box>
      <PageUrlBanner urls={[
        { path: '/', label: 'Home — Mensagem dos Presidentes' },
        { path: '/mensagem-ceo', label: 'Página Mensagem dos Presidentes' },
      ]} />

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Edite os dados dos dois presidentes e o texto da mensagem conjunta.
      </Typography>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      {/* Executive sections */}
      {execSections.map((sec) => (
        <Paper key={sec.photoField} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: sec.accent }}>
            {sec.label}
          </Typography>

          {/* Photo */}
          <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
            {data[sec.photoField] ? (
              <Box
                component="img"
                src={data[sec.photoField]!}
                alt={data[sec.nameField]}
                sx={{
                  width: 80,
                  height: 100,
                  objectFit: 'cover',
                  objectPosition: 'center 10%',
                  borderRadius: 1.5,
                  border: `2px solid ${sec.accent}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 80, height: 100, borderRadius: 1.5,
                  border: '2px dashed #cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 1 }}>
                  Sem foto
                </Typography>
              </Box>
            )}
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPickerField(sec.photoField)}
                sx={{ textTransform: 'none' }}
              >
                {data[sec.photoField] ? 'Alterar foto' : 'Escolher foto'}
              </Button>
              {data[sec.photoField] && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320, wordBreak: 'break-all' }}>
                  {data[sec.photoField]}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="Nome"
              value={data[sec.nameField]}
              onChange={handle(sec.nameField)}
              fullWidth
            />
            <TextField
              label="Cargo / Título"
              value={data[sec.titleField]}
              onChange={handle(sec.titleField)}
              fullWidth
            />
          </Stack>
        </Paper>
      ))}

      {/* Shared message text */}
      <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
          Texto da Mensagem (partilhado)
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
            helperText='Parágrafo principal exibido abaixo da citação.'
          />
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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

      {data.updatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
          Última actualização: {data.updatedAt}
        </Typography>
      )}

      {/* Shared image picker for both fields */}
      <SharedFilePicker
        open={pickerField !== null}
        onClose={() => setPickerField(null)}
        onSelect={(f) => {
          if (pickerField) setData(prev => ({ ...prev, [pickerField]: f.url }));
        }}
        title="Biblioteca de imagens"
      />
    </Box>
  );
}
