import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Check } from 'lucide-react';
import PageUrlBanner from './PageUrlBanner';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

type InvestorRelations = {
  id?: number;
  email: string;
  phone: string;
  address: string;
  otherContacts: string;
  updatedAt?: string;
};

export default function ApoioInvestidorEditor() {
  const [data, setData] = useState<InvestorRelations>({ email: '', phone: '', address: '', otherContacts: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE}/investor-relations`);
      if (!r.ok) throw new Error();
      const list = await r.json();
      // API returns array; use first record
      if (Array.isArray(list) && list.length > 0) setData(list[0]);
    } catch {
      setMsg({ type: 'error', text: 'Erro ao carregar dados de contacto.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      const url = data.id
        ? `${API_BASE}/investor-relations/${data.id}`
        : `${API_BASE}/investor-relations`;
      const r = await fetch(url, {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      const saved = await r.json();
      setData(saved);
      setMsg({ type: 'success', text: 'Dados de contacto guardados com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
        <Typography variant="caption" sx={{ mt: 2, color: '#94a3b8' }}>A carregar...</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <PageUrlBanner urls={{ label: 'Apoio ao Investidor', path: '/apoio-investidor' }} />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Contactos e informações do Departamento de Relações com Investidores.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <Check size={16} />}
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
        >
          {saving ? 'A guardar...' : 'Guardar'}
        </Button>
      </Stack>

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 3, borderRadius: 2 }}>{msg.text}</Alert>}

      <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={data.email}
              onChange={e => setData(p => ({ ...p, email: e.target.value }))}
              size="small"
              fullWidth
              placeholder="ri@ensa.co.ao"
            />
            <TextField
              label="Telefone"
              value={data.phone}
              onChange={e => setData(p => ({ ...p, phone: e.target.value }))}
              size="small"
              fullWidth
              placeholder="+244 222 ..."
            />
          </Stack>
          <TextField
            label="Endereço"
            value={data.address}
            onChange={e => setData(p => ({ ...p, address: e.target.value }))}
            size="small"
            fullWidth
            multiline
            minRows={2}
            placeholder="Rua..., Luanda, Angola"
          />
          <TextField
            label="Outros Contactos / Informações Adicionais"
            value={data.otherContacts}
            onChange={e => setData(p => ({ ...p, otherContacts: e.target.value }))}
            size="small"
            fullWidth
            multiline
            minRows={4}
            placeholder="Horário de atendimento, LinkedIn, outros meios de contacto..."
          />
          {data.updatedAt && (
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Última actualização: {data.updatedAt}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
