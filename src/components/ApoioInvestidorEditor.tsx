import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Check, ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
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

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

type InvestorFaq = {
  updatedAt: string;
  items: FaqItem[];
};

const FAQ_DEFAULTS: FaqItem[] = [
  { id: 'faq-1', sortOrder: 1, question: 'Como posso adquirir acções da ENSA?', answer: 'As acções da ENSA são negociadas na BODIVA. Para investir, deve contactar um intermediário financeiro autorizado (Banco ou Corretora) para abrir uma conta de custódia e emitir ordens de compra.' },
  { id: 'faq-2', sortOrder: 2, question: 'Onde encontro os resultados financeiros anuais?', answer: 'Todos os Relatórios e Contas anuais, auditados externamente, estão disponíveis na secção "Reporte Financeiro" deste Portal do Investidor para consulta e download.' },
  { id: 'faq-3', sortOrder: 3, question: 'Qual é a política de dividendos da ENSA?', answer: 'A distribuição de dividendos é deliberada anualmente em Assembleia Geral, baseando-se nos lucros líquidos consolidados e na estratégia de reinvestimento para o crescimento sustentável da companhia.' },
  { id: 'faq-4', sortOrder: 4, question: 'Quem é o responsável pela auditoria externa da ENSA?', answer: 'Actualmente, a Ernst & Young (EY) é a entidade responsável pela auditoria e certificação das contas da ENSA, garantindo a transparência e rigor exigidos pelo mercado.' },
  { id: 'faq-5', sortOrder: 5, question: 'Como posso contactar o Gabinete de Apoio ao Investidor?', answer: 'Pode contactar-nos directamente através do email apoioaoinvestidor@ensa.co.ao ou visitar-nos no Loanda Towers, Torres A e B, Luanda.' },
];

// ---- Contacts tab ----
function ContactsEditor() {
  const [data, setData] = useState<InvestorRelations>({ email: '', phone: '', address: '', otherContacts: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/investor-relations`);
        if (!r.ok) throw new Error();
        const list = await r.json();
        if (Array.isArray(list) && list.length > 0) setData(list[0]);
      } catch {
        setMsg({ type: 'error', text: 'Erro ao carregar dados de contacto.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      const url = data.id ? `${API_BASE}/investor-relations/${data.id}` : `${API_BASE}/investor-relations`;
      const r = await fetch(url, {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      setData(await r.json());
      setMsg({ type: 'success', text: 'Dados de contacto guardados com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;

  return (
    <Box>
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 3, borderRadius: 2 }}>{msg.text}</Alert>}
      <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Email" type="email" value={data.email} onChange={e => setData(p => ({ ...p, email: e.target.value }))} size="small" fullWidth placeholder="ri@ensa.co.ao" />
            <TextField label="Telefone" value={data.phone} onChange={e => setData(p => ({ ...p, phone: e.target.value }))} size="small" fullWidth placeholder="+244 222 ..." />
          </Stack>
          <TextField label="Endereço" value={data.address} onChange={e => setData(p => ({ ...p, address: e.target.value }))} size="small" fullWidth multiline minRows={2} placeholder="Rua..., Luanda, Angola" />
          <TextField label="Outros Contactos / Informações Adicionais" value={data.otherContacts} onChange={e => setData(p => ({ ...p, otherContacts: e.target.value }))} size="small" fullWidth multiline minRows={4} placeholder="Horário de atendimento, LinkedIn, outros meios de contacto..." />
          {data.updatedAt && <Typography variant="caption" sx={{ color: '#94a3b8' }}>Última actualização: {data.updatedAt}</Typography>}
          <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check size={14} />} onClick={handleSave} disabled={saving} sx={{ alignSelf: 'flex-end', borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>
            {saving ? 'A guardar...' : 'Guardar Contactos'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

// ---- FAQ item row card ----
function FaqCard({ item, idx, onChange, onDelete }: {
  item: FaqItem;
  idx: number;
  onChange: (updated: FaqItem) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6', mb: 2, overflow: 'hidden' }}>
      <Box onClick={() => setOpen(v => !v)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, cursor: 'pointer', bgcolor: open ? '#f8fafc' : 'white', '&:hover': { bgcolor: '#f8fafc' } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton size="small" tabIndex={-1}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</IconButton>
          <Chip label={`#${idx + 1}`} size="small" sx={{ height: 18, fontWeight: 700, fontSize: '0.65rem', bgcolor: '#eff6ff', color: '#1d4ed8' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>{item.question || '(sem pergunta)'}</Typography>
        </Stack>
        <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); onDelete(); }}><Trash2 size={14} /></IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Pergunta" value={item.question} onChange={e => onChange({ ...item, question: e.target.value })} size="small" fullWidth placeholder='ex: "Como posso adquirir acções da ENSA?"' />
            <TextField label="Resposta" value={item.answer} onChange={e => onChange({ ...item, answer: e.target.value })} size="small" fullWidth multiline minRows={3} placeholder="Resposta detalhada..." />
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}

// ---- FAQ tab ----
function FaqEditor() {
  const [faq, setFaq] = useState<InvestorFaq>({ updatedAt: '', items: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/investor-faq`);
        if (!r.ok) throw new Error();
        const d: InvestorFaq = await r.json();
        const items = d.items && d.items.length > 0 ? d.items : FAQ_DEFAULTS;
        const initialised = { ...d, items };
        setFaq(initialised);
        if (!d.items || d.items.length === 0) {
          // auto-seed defaults into backend silently
          fetch(`${API_BASE}/investor-faq`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialised),
          }).catch(() => {});
        }
      } catch {
        const initialised = { updatedAt: '', items: FAQ_DEFAULTS };
        setFaq(initialised);
        fetch(`${API_BASE}/investor-faq`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialised),
        }).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      const r = await fetch(`${API_BASE}/investor-faq`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });
      if (!r.ok) throw new Error();
      setFaq(await r.json());
      setMsg({ type: 'success', text: 'FAQ guardado com sucesso.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao guardar FAQ.' });
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => setFaq(p => ({
    ...p,
    items: [...p.items, { id: `faq-${Date.now()}`, sortOrder: p.items.length + 1, question: '', answer: '' }],
  }));

  const updateItem = (idx: number, updated: FaqItem) =>
    setFaq(p => ({ ...p, items: p.items.map((it, i) => (i === idx ? updated : it)) }));

  const deleteItem = (idx: number) =>
    setFaq(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  if (loading) return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;

  return (
    <Box>
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 3, borderRadius: 2 }}>{msg.text}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {faq.items.length} {faq.items.length === 1 ? 'pergunta' : 'perguntas'} configuradas
          {faq.updatedAt && ` · actualizado em ${faq.updatedAt}`}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<Plus size={14} />} onClick={addItem} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Nova Pergunta
          </Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Check size={14} />} onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
            {saving ? 'A guardar…' : 'Guardar FAQ'}
          </Button>
        </Stack>
      </Stack>

      {faq.items.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0' }}>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>Sem perguntas. Clique em "Nova Pergunta" para adicionar.</Typography>
        </Paper>
      ) : (
        faq.items.map((item, idx) => (
          <FaqCard key={item.id} item={item} idx={idx} onChange={updated => updateItem(idx, updated)} onDelete={() => deleteItem(idx)} />
        ))
      )}
    </Box>
  );
}

// ---- Main Editor ----
export default function ApoioInvestidorEditor() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 3 }}>
        <PageUrlBanner urls={{ label: 'Apoio ao Investidor', path: '/apoio-investidor' }} />
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Contactos, informações e FAQ do Departamento de Relações com Investidores.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}>
        <Tab label="Contactos" />
        <Tab label="❓ FAQ do Investidor" />
      </Tabs>

      {tab === 0 && <ContactsEditor />}
      {tab === 1 && <FaqEditor />}
    </Box>
  );
}
