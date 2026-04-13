import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  InputBase,
  IconButton,
  Chip,
  Avatar,
  Stack,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  Divider,
  Collapse,
  Alert,
} from '@mui/material';
import {
  LayoutDashboard,
  Search,
  Activity,
  ChevronRight,
  ChevronDown,
  Settings,
  Bell,
  Globe,
  Monitor,
  Newspaper,
  FileCode2,
  Layers,
  ShieldCheck,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  PieChart,
  Network,
  Briefcase,
  History,
  Scale,
  Building2,
  FolderOpen,
  Plus,
  PieChart as PieChartIcon,
  BarChart2,
  CalendarDays,
  Landmark,
  Building,
  Image
} from 'lucide-react';
import projectSnapshot from './data/projectSnapshot.json';
import OrganigramEditor from './components/OrganigramEditor';
import FinancialIndicatorsEditor from './components/FinancialIndicatorsEditor';
import CalendarioDivulgacoesEditor from './components/CalendarioDivulgacoesEditor';
import AssembliasEditor from './components/AssembliasEditor';
import ComunicadosEditor from './components/ComunicadosEditor';
import NoticiasEditor from './components/NoticiasEditor';
import RelatoriosEditor from './components/RelatoriosEditor';
import BusinessIndicatorsEditor from './components/BusinessIndicatorsEditor';
import ApoioInvestidorEditor from './components/ApoioInvestidorEditor';
import MarcoHistoricoEditor from './components/MarcoHistoricoEditor';
import EstatutosEditor from './components/EstatutosEditor';
import OrgaosSociaisEditor from './components/OrgaosSociaisEditor';
import AcionistasEditor from './components/AcionistasEditor';
import EventosEditor from './components/EventosEditor';
import MercadoEditor from './components/MercadoEditor';
import VisualIndicatorsEditor from './components/VisualIndicatorsEditor';
import CeoMessageEditor from './components/CeoMessageEditor';
import CarouselEditor from './components/CarouselEditor';
import SobreNosCarouselEditor from './components/SobreNosCarouselEditor';
import PlanoEstrategicoEditor from './components/PlanoEstrategicoEditor';
import CorpoDiretivoEditor from './components/CorpoDiretivoEditor';
import ParticipadasEditor from './components/ParticipadasEditor';
import MediaGalleryEditor from './components/MediaGalleryEditor';
import PoliticasEditor from './components/PoliticasEditor';
import LegislacaoEditor from './components/LegislacaoEditor';
import logoEnsaSrc from './assets/logo_ensa.png';

// --- Types ---
type CommunicationDTO = {
  id?: number;
  type: 'NEWS' | 'NOTICE' | 'EVENT';
  titlePt: string;
  contentPt: string;
  documentUrl?: string;
  publishedAt: string;
  imageUrl?: string;
};

type ViewMode = 'DASHBOARD' | 'MAP' | 'SOBRE' | 'GOVERNANCA' | 'FINANCAS' | 'ASSEMBLEIAS' | 'COMUNICADOS' | 'NOTICIAS' | 'APOIO' | 'INDICADORES' | 'ORGANOGRAMA' | 'ESTATUTOS' | 'ORGAOS_SOCIAIS' | 'EXECUTIVE' | 'ANNUAL_REPORTS' | 'RATINGS' | 'CALENDARIO' | 'ACIONISTAS' | 'PARTICIPADAS' | 'EVENTOS' | 'MERCADO' | 'VISUAL_INDICATORS' | 'CEO_MESSAGE' | 'CAROUSEL' | 'SOBRE_NOS_CAROUSEL' | 'PLANO_ESTRATEGICO' | 'MEDIA_GALLERY' | 'POLITICAS' | 'LEGISLACAO' | 'MARCO_HISTORICO';

const VIEW_PATHS: Record<ViewMode, string> = {
  DASHBOARD:     '/dashboard',
  MAP:           '/map',
  SOBRE:         '/sobre',
  GOVERNANCA:    '/governanca',
  ORGANOGRAMA:   '/governanca/organograma',
  ESTATUTOS:     '/governanca/estatutos',
  ORGAOS_SOCIAIS: '/governanca/orgaos-sociais',
  EXECUTIVE:     '/governanca/corpo-diretivo',
  FINANCAS:      '/financas',
  INDICADORES:   '/financas/indicadores',
  ANNUAL_REPORTS:'/financas/relatorios',
  RATINGS:       '/financas/ratings',
  COMUNICADOS:   '/comunicados',
  NOTICIAS:      '/noticias',
  ASSEMBLEIAS:   '/assembleias',
  CALENDARIO:    '/calendario',
  APOIO:         '/apoio',
  ACIONISTAS:    '/governanca/acionistas',
  PARTICIPADAS:  '/governanca/participadas',
  EVENTOS:       '/eventos',
  MERCADO:       '/financas/mercado',
  VISUAL_INDICATORS: '/financas/indicadores-visuais',
  MEDIA_GALLERY: '/biblioteca/galeria',
  POLITICAS:     '/governanca/politicas',
  LEGISLACAO:    '/governanca/legislacao',
  CEO_MESSAGE:   '/comunicacao/ceo',
  CAROUSEL:      '/comunicacao/carousel',
  SOBRE_NOS_CAROUSEL: '/sobre/carousel',
  PLANO_ESTRATEGICO: '/sobre/plano-estrategico',
  MARCO_HISTORICO: '/sobre/historia',
};

const PATH_TO_VIEW: Record<string, ViewMode> = Object.fromEntries(
  Object.entries(VIEW_PATHS).map(([k, v]) => [v, k as ViewMode])
) as Record<string, ViewMode>;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g. '/ct' or ''

function viewFromLocation(): ViewMode {
  const path = window.location.pathname.replace(BASE, '') || '/';
  return PATH_TO_VIEW[path] ?? 'DASHBOARD';
}

type WhoWeAreContentDTO = {
  route: string;
  title: string;
  mainText: string;
  updatedAt: string;
  statsAnosHistoria: string;
  statsMarketShare: string;
  statsColaboradores: string;
  statsTopSeguradoras: string;
};

const snapshot = projectSnapshot as any;
const drawerWidth = 280;
const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

function ContentForm({ onSave, onCancel, title }: { onSave: (d: any) => void; onCancel: () => void; title: string }) {
  const [formData, setFormData] = useState<CommunicationDTO>({
    type: 'NEWS',
    titlePt: '',
    contentPt: '',
    publishedAt: new Date().toISOString().split('T')[0],
  });

  return (
    <Box component="form" sx={{ mt: 2 }}>
      <Paper sx={{ p: 4, borderRadius: 6 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 800 }}>{title}</Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Título (PT)"
                placeholder="Ex: ENSA lança novo portal..."
                value={formData.titlePt}
                onChange={(e) => setFormData({ ...formData, titlePt: e.target.value })}
              />
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Conteúdo (PT)"
                placeholder="Escreva o conteúdo profissional aqui..."
                value={formData.contentPt}
                onChange={(e) => setFormData({ ...formData, contentPt: e.target.value })}
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <TextField
                select
                fullWidth
                label="Tipo de Conteúdo"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <MenuItem value="NEWS">Notícia (Comunicado)</MenuItem>
                <MenuItem value="NOTICE">Aviso / Edital</MenuItem>
                <MenuItem value="EVENT">Evento Corporativo</MenuItem>
              </TextField>
              <TextField
                fullWidth
                type="date"
                label="Data de Publicação"
                InputLabelProps={{ shrink: true }}
                value={formData.publishedAt}
                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
              />
              <TextField
                fullWidth
                label="URL da Imagem / Documento"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
              <Divider />
              <Button variant="contained" color="primary" fullWidth size="large" sx={{ height: 56, borderRadius: 3.5 }} onClick={() => onSave(formData)}>
                Publicar Alterações
              </Button>
              <Button variant="outlined" fullWidth sx={{ borderRadius: 3.5 }} onClick={onCancel}>
                Cancelar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

// ---- Login Screen ----
// Simple credential check — replace with a real auth endpoint when ready.
const TOWER_USER = 'admin';
const TOWER_PASS = 'ensa2025';

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (username === TOWER_USER && password === TOWER_PASS) {
        sessionStorage.setItem('tower_auth', '1');
        onLogin();
      } else {
        setError('Utilizador ou palavra-passe incorrectos.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0f172a',
        backgroundImage: 'radial-gradient(ellipse at 60% 40%, rgba(22,73,147,0.25) 0%, transparent 60%)',
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 5,
          borderRadius: 5,
          bgcolor: '#1e293b',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Stack alignItems="center" sx={{ mb: 4 }}>
          <Box
            component="img"
            src={logoEnsaSrc}
            sx={{ height: 48, mb: 2, filter: 'brightness(0) invert(1)' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>
            TOWER CMS
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5 }}>
            Portal Administrativo — ENSA Investidores
          </Typography>
        </Stack>

        <Stack spacing={2.5}>
          <TextField
            label="Utilizador"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            fullWidth
            size="small"
            autoComplete="username"
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset': { borderColor: '#4a90d9' } },
            }}
          />
          <TextField
            label="Palavra-passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            size="small"
            autoComplete="current-password"
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
            sx={{
              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' }, '&.Mui-focused fieldset': { borderColor: '#4a90d9' } },
            }}
          />
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>{error}</Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !username.trim() || !password.trim()}
            sx={{ height: 44, borderRadius: 3, fontWeight: 800, textTransform: 'none', mt: 1 }}
          >
            {loading ? 'A autenticar...' : 'Entrar'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('tower_auth') === '1'
  );

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return <AppShell onLogout={() => { sessionStorage.removeItem('tower_auth'); setAuthenticated(false); }} />;
}

function AppShell({ onLogout }: { onLogout: () => void }) {
  const [viewMode, setViewMode] = useState<ViewMode>(viewFromLocation);
  const [query, setQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [whoWeAreMainText, setWhoWeAreMainText] = useState('');
  const [whoWeAreUpdatedAt, setWhoWeAreUpdatedAt] = useState('');
  const [whoWeAreLoading, setWhoWeAreLoading] = useState(false);
  const [whoWeAreSaving, setWhoWeAreSaving] = useState(false);
  const [whoWeAreMessage, setWhoWeAreMessage] = useState('');
  const [statsAnosHistoria, setStatsAnosHistoria] = useState('46');
  const [statsMarketShare, setStatsMarketShare] = useState('27%');
  const [statsColaboradores, setStatsColaboradores] = useState('1,200+');
  const [statsTopSeguradoras, setStatsTopSeguradoras] = useState('#50');
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    'SOBRE': true,
    'GOVERNANCA': true,
    'FINANCAS': false
  });

  const theme = useTheme();

  // Sync viewMode → URL
  const navigate = (mode: ViewMode) => {
    setViewMode(mode);
    setShowEditor(false);
    window.history.pushState(null, '', BASE + VIEW_PATHS[mode]);
  };

  // Sync URL → viewMode on back/forward
  useEffect(() => {
    const onPop = () => setViewMode(viewFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const loadWhoWeAreContent = async () => {
    try {
      setWhoWeAreLoading(true);
      setWhoWeAreMessage('');
      const res = await fetch(`${API_BASE}/about/who-we-are`);
      if (!res.ok) throw new Error('Falha ao carregar conteúdo Quem Somos');
      const data: WhoWeAreContentDTO = await res.json();
      setWhoWeAreMainText(data.mainText || '');
      setWhoWeAreUpdatedAt(data.updatedAt || '');
      setStatsAnosHistoria(data.statsAnosHistoria || '46');
      setStatsMarketShare(data.statsMarketShare || '27%');
      setStatsColaboradores(data.statsColaboradores || '1,200+');
      setStatsTopSeguradoras(data.statsTopSeguradoras || '#50');
    } catch {
      setWhoWeAreMessage('Erro ao carregar conteúdo do backend.');
    } finally {
      setWhoWeAreLoading(false);
    }
  };

  const saveWhoWeAreContent = async () => {
    try {
      setWhoWeAreSaving(true);
      setWhoWeAreMessage('');
      const payload: WhoWeAreContentDTO = {
        route: '/ensa/quem-somos',
        title: 'Sobre a ENSA',
        mainText: whoWeAreMainText,
        updatedAt: whoWeAreUpdatedAt || new Date().toISOString().split('T')[0],
        statsAnosHistoria,
        statsMarketShare,
        statsColaboradores,
        statsTopSeguradoras,
      };
      const res = await fetch(`${API_BASE}/about/who-we-are`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Falha ao guardar conteúdo Quem Somos');
      const saved: WhoWeAreContentDTO = await res.json();
      setWhoWeAreMainText(saved.mainText || '');
      setWhoWeAreUpdatedAt(saved.updatedAt || '');
      setStatsAnosHistoria(saved.statsAnosHistoria || '46');
      setStatsMarketShare(saved.statsMarketShare || '27%');
      setStatsColaboradores(saved.statsColaboradores || '1,200+');
      setStatsTopSeguradoras(saved.statsTopSeguradoras || '#50');
      setWhoWeAreMessage('Conteúdo guardado com sucesso no backend.');
    } catch {
      setWhoWeAreMessage('Erro ao guardar conteúdo no backend.');
    } finally {
      setWhoWeAreSaving(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'SOBRE' && !whoWeAreMainText && !whoWeAreLoading) {
      loadWhoWeAreContent();
    }
  }, [viewMode]);

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navGroups = [
    { type: 'header', text: 'Principal' },
    { id: 'DASHBOARD', text: 'Painel de Controlo', icon: <LayoutDashboard size={20} /> },
    
    { type: 'header', text: 'Gestão Institucional' },
    { id: 'SOBRE', text: 'Sobre a ENSA', icon: <Building2 size={20} />, sub: [
        { id: 'SOBRE', text: 'Quem Somos & Stats', icon: <Building2 size={18} /> },
        { id: 'MARCO_HISTORICO', text: 'Nossa História', icon: <History size={18} /> },
        { id: 'PLANO_ESTRATEGICO', text: 'Plano Estratégico', icon: <FolderOpen size={18} /> },
        { id: 'APOIO', text: 'FAQ do Investidor', icon: <MessageSquare size={18} /> },
        { id: 'ESTATUTOS', text: 'Estatutos e Ética', icon: <Scale size={18} /> },
      ]
    },
    { 
      id: 'GOVERNANCA', 
      text: 'Governação', 
      icon: <ShieldCheck size={20} />, 
      sub: [
        { id: 'ORGANOGRAMA', text: 'Organograma Geral', icon: <Network size={18} /> },
        { id: 'ORGAOS_SOCIAIS', text: 'Órgãos Sociais', icon: <Users size={18} /> },
        { id: 'EXECUTIVE', text: 'Corpo Directivo', icon: <Briefcase size={18} /> },
        { id: 'ACIONISTAS', text: 'Estrutura Accionista', icon: <Landmark size={18} /> },
        { id: 'PARTICIPADAS', text: 'Empresas Participadas', icon: <Building size={18} /> },
        { id: 'POLITICAS', text: 'Políticas Institucionais', icon: <ShieldCheck size={18} /> },
        { id: 'LEGISLACAO', text: 'Legislação', icon: <Scale size={18} /> },
      ]
    },
    
    { type: 'header', text: 'Finanças e Reporte' },
    { 
      id: 'FINANCAS', 
      text: 'Relatórios Financeiros', 
      icon: <TrendingUp size={20} />,
      sub: [
        { id: 'INDICADORES', text: 'Indicadores Chave (KPIs)', icon: <PieChart size={18} /> },
        { id: 'ANNUAL_REPORTS', text: 'Relatórios e Contas', icon: <FileText size={18} /> },
        { id: 'RATINGS', text: 'Ratings e Notações', icon: <Activity size={18} /> },
        { id: 'MERCADO', text: 'Análise de Mercado', icon: <TrendingUp size={18} /> },
        { id: 'VISUAL_INDICATORS', text: 'Indicadores Visuais', icon: <PieChart size={18} /> },
      ]
    },
    
    { type: 'header', text: 'Comunicação' },
    { id: 'COMUNICADOS', text: 'Comunicados e Mídia', icon: <Newspaper size={20} /> },
    { id: 'NOTICIAS', text: 'Notícias (Home)', icon: <FileCode2 size={20} /> },
    { id: 'CEO_MESSAGE', text: 'Mensagem do CEO', icon: <MessageSquare size={20} /> },
    { id: 'ASSEMBLEIAS', text: 'Assembleias Gerais', icon: <Users size={20} /> },
    { id: 'CALENDARIO', text: 'Calendário de Divulgações', icon: <History size={20} /> },
    { id: 'EVENTOS', text: 'Eventos Corporativos', icon: <CalendarDays size={20} /> },

    { type: 'header', text: 'Biblioteca' },
    { id: 'MEDIA_GALLERY', text: 'Galeria de Ficheiros', icon: <Image size={20} /> },
  ];

  const stats = useMemo(() => ({
    totalFiles: snapshot.totalFiles || 0,
    sectionsCount: snapshot.sections?.length || 0,
  }), []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!snapshot.sections) return [];
    if (!normalizedQuery) return snapshot.sections;
    return snapshot.sections.filter((section: any) => 
      section.label?.toLowerCase().includes(normalizedQuery) || 
      section.relativePath?.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#0f172a',
            color: 'white',
            borderRight: 'none',
            borderRadius: 0,
          },
        }}
      >
        <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src={logoEnsaSrc}
            sx={{ height: 35, filter: 'brightness(0) invert(1)' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>TOWER CMS</Typography>
        </Box>

        <Box sx={{ px: 2, pb: 4 }}>
          <List sx={{ '& .MuiListItem-root': { px: 1 } }}>
            {navGroups.map((item, i) => {
              if (item.type === 'header') {
                return (
                  <Typography key={i} variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800, px: 2, mt: 3, mb: 1, display: 'block' }}>
                    {item.text}
                  </Typography>
                );
              }

              const hasSub = !!item.sub;
              const isOpen = openSubmenus[item.id!];

              return (
                <Box key={item.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        if (hasSub) {
                          toggleSubmenu(item.id!);
                        } else {
                          navigate(item.id as ViewMode);
                        }
                      }}
                      sx={{
                        borderRadius: 3,
                        mb: 0.5,
                        bgcolor: viewMode === item.id ? 'primary.main' : 'transparent',
                        '&:hover': { bgcolor: viewMode === item.id ? 'primary.main' : 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit', minWidth: 40, opacity: viewMode === item.id ? 1 : 0.7 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ fontSize: 13, fontWeight: viewMode === item.id ? 700 : 500 }} 
                      />
                      {hasSub && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                    </ListItemButton>
                  </ListItem>
                  
                  {hasSub && (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.sub!.map((sub) => (
                          <ListItemButton
                            key={sub.id}
                            onClick={() => { navigate(sub.id as ViewMode); }}
                            sx={{
                              pl: 6,
                              borderRadius: 3,
                              mb: 0.5,
                              color: viewMode === sub.id ? 'white' : 'rgba(255,255,255,0.6)',
                              bgcolor: viewMode === sub.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                            }}
                          >
                            <ListItemText 
                              primary={sub.text} 
                              primaryTypographyProps={{ fontSize: 12.5, fontWeight: viewMode === sub.id ? 600 : 400 }} 
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4, pt: '92px', width: `calc(100% - ${drawerWidth}px)` }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            left: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            bgcolor: 'white',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderRadius: 0,
            zIndex: (theme) => theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar sx={{ px: '32px !important', minHeight: '64px !important' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                {{
                  DASHBOARD: 'Painel de Controlo',
                  SOBRE: 'Sobre a ENSA',
                  ORGANOGRAMA: 'Organograma Geral',
                  EXECUTIVE: 'Corpo Directivo',
                  ESTATUTOS: 'Estatutos e Ética',
                  ORGAOS_SOCIAIS: 'Órgãos Sociais',
                  ACIONISTAS: 'Estrutura Accionista',
                  PARTICIPADAS: 'Empresas Participadas',
                  INDICADORES: 'Indicadores Chave (KPIs)',
                  ANNUAL_REPORTS: 'Relatórios e Contas',
                  PLANO_ESTRATEGICO: 'Plano Estratégico',
                  RATINGS: 'Ratings e Notações',
                  MERCADO: 'Análise de Mercado',
                  VISUAL_INDICATORS: 'Indicadores Visuais',
                  COMUNICADOS: 'Comunicados e Mídia',
                  NOTICIAS: 'Notícias (Home)',
                  CEO_MESSAGE: 'Mensagem do CEO',
                  CAROUSEL: 'Carrossel Principal',
                  SOBRE_NOS_CAROUSEL: 'Carrossel Sobre Nós',
                  MARCO_HISTORICO: 'Nossa História',
                  ASSEMBLEIAS: 'Assembleias Gerais',
                  CALENDARIO: 'Calendário de Divulgações',
                  EVENTOS: 'Eventos Corporativos',
                  MEDIA_GALLERY: 'Galeria de Ficheiros',
                  POLITICAS: 'Políticas Institucionais',
                  LEGISLACAO: 'Legislação',
                  APOIO: 'Apoio ao Investidor',
                  GOVERNANCA: 'Governação',
                  FINANCAS: 'Relatórios Financeiros',
                  MAP: 'Arquitectura Geral',
                }[viewMode] ?? viewMode}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.75, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', width: 280, borderRadius: 0 }}>
                <Search size={16} color="#94a3b8" />
                <InputBase
                  placeholder="Pesquisar..."
                  sx={{ ml: 1, flex: 1, fontSize: 13 }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </Paper>
              {['FINANCAS', 'ASSEMBLEIAS'].includes(viewMode) && !showEditor && (
                <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowEditor(true)} sx={{ borderRadius: 0, fontWeight: 700, px: 2.5, height: 38, fontSize: 13, boxShadow: 'none' }}>
                  Novo Registo
                </Button>
              )}
              <IconButton sx={{ border: '1px solid #e2e8f0', p: 1, borderRadius: 0 }}><Bell size={18} /></IconButton>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1, borderLeft: '1px solid #e2e8f0' }}>
                <Avatar sx={{ bgcolor: '#164993', fontWeight: 800, width: 34, height: 34, fontSize: 13 }}>AD</Avatar>
                <Button
                  variant="text"
                  size="small"
                  onClick={onLogout}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, color: '#64748b', '&:hover': { color: '#e74c3c', bgcolor: 'rgba(231,76,60,0.04)' } }}
                >
                  Sair
                </Button>
              </Stack>
            </Stack>
          </Toolbar>
        </AppBar>

        {showEditor ? (
          <ContentForm 
            title={`Novo Registo - ${viewMode}`}
            onSave={() => { alert('Conteúdo guardado com sucesso!'); setShowEditor(false); }} 
            onCancel={() => setShowEditor(false)} 
          />
        ) : (
          viewMode === 'DASHBOARD' ? (
            <Stack spacing={4}>
              {/* KPI cards */}
              <Grid container spacing={3}>
                {[
                  { label: 'Módulos Activos', value: stats.sectionsCount, icon: <Layers />, color: '#164993' },
                  { label: 'Serviços Core', value: 8, icon: <Activity />, color: '#10b981' },
                  { label: 'Relatórios Activos', value: 24, icon: <FileText />, color: '#f59e0b' },
                  { label: 'Saúde da API', value: '100%', icon: <Globe />, color: '#6366f1' },
                ].map((stat, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                    <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3, borderRadius: 5, border: '1px solid #f1f5f9', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' } }}>
                      <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha(stat.color, 0.1), color: stat.color, display: 'flex' }}>
                        {stat.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{stat.label}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>{stat.value}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Quick-access shortcuts */}
              <Grid container spacing={2}>
                {[
                  { label: 'Corpo Directivo', view: 'EXECUTIVE', icon: <Briefcase size={22} />, color: '#164993' },
                  { label: 'Mensagem do CEO', view: 'CEO_MESSAGE', icon: <MessageSquare size={22} />, color: '#10b981' },
                  { label: 'Relatórios e Contas', view: 'ANNUAL_REPORTS', icon: <FileText size={22} />, color: '#f59e0b' },
                  { label: 'Indicadores KPI', view: 'INDICADORES', icon: <PieChart size={22} />, color: '#6366f1' },
                  { label: 'Assembleias Gerais', view: 'ASSEMBLEIAS', icon: <Users size={22} />, color: '#0891b2' },
                  { label: 'Comunicados', view: 'COMUNICADOS', icon: <Newspaper size={22} />, color: '#dc2626' },
                ].map((item) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={item.view}>
                    <Paper
                      elevation={0}
                      onClick={() => navigate(item.view as ViewMode)}
                      sx={{
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
                        },
                      }}
                    >
                      {/* Coloured banner — mirrors MilestoneGridCard's header */}
                      <Box sx={{
                        height: 72,
                        bgcolor: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: '#fff',
                      }}>
                        {item.icon}
                      </Box>
                      {/* Body */}
                      <Box sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                          {item.label}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Banner / Carousel editor inline */}
              <CarouselEditor />
            </Stack>
          ) : viewMode === 'SOBRE' ? (
            <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: 5, border: '1px solid #f1f5f9', bgcolor: 'white' }}>
              <Stack spacing={2.5}>
                <Chip
                  label="/ensa/quem-somos"
                  size="small"
                  sx={{ alignSelf: 'flex-start', fontWeight: 700, bgcolor: '#eef4ff', color: '#164993' }}
                />
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>
                  Sobre a ENSA
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  label="Texto principal (consumido em /ensa/quem-somos)"
                  value={whoWeAreMainText}
                  onChange={(e) => setWhoWeAreMainText(e.target.value)}
                  disabled={whoWeAreLoading || whoWeAreSaving}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', pt: 1 }}>
                  Cards de Estatísticas
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Anos de História"
                    value={statsAnosHistoria}
                    onChange={(e) => setStatsAnosHistoria(e.target.value)}
                    disabled={whoWeAreLoading || whoWeAreSaving}
                    size="small"
                    placeholder="ex: 46"
                  />
                  <TextField
                    fullWidth
                    label="Market Share"
                    value={statsMarketShare}
                    onChange={(e) => setStatsMarketShare(e.target.value)}
                    disabled={whoWeAreLoading || whoWeAreSaving}
                    size="small"
                    placeholder="ex: 27%"
                  />
                  <TextField
                    fullWidth
                    label="Colaboradores"
                    value={statsColaboradores}
                    onChange={(e) => setStatsColaboradores(e.target.value)}
                    disabled={whoWeAreLoading || whoWeAreSaving}
                    size="small"
                    placeholder="ex: 1,200+"
                  />
                  <TextField
                    fullWidth
                    label="Top Seguradoras Africanas"
                    value={statsTopSeguradoras}
                    onChange={(e) => setStatsTopSeguradoras(e.target.value)}
                    disabled={whoWeAreLoading || whoWeAreSaving}
                    size="small"
                    placeholder="ex: #50"
                  />
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={saveWhoWeAreContent}
                    disabled={whoWeAreLoading || whoWeAreSaving || !whoWeAreMainText.trim()}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    {whoWeAreSaving ? 'A guardar...' : 'Guardar no Backend'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={loadWhoWeAreContent}
                    disabled={whoWeAreLoading || whoWeAreSaving}
                    sx={{ textTransform: 'none' }}
                  >
                    {whoWeAreLoading ? 'A carregar...' : 'Recarregar'}
                  </Button>
                  {whoWeAreUpdatedAt && (
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Última actualização: {whoWeAreUpdatedAt}
                    </Typography>
                  )}
                </Stack>
                {whoWeAreMessage && (
                  <Typography variant="body2" sx={{ color: whoWeAreMessage.includes('Erro') ? '#b91c1c' : '#166534', fontWeight: 600 }}>
                    {whoWeAreMessage}
                  </Typography>
                )}
              </Stack>
            </Paper>
          ) : viewMode === 'INDICADORES' ? (
            <FinancialIndicatorsEditor />
          ) : viewMode === 'ORGANOGRAMA' ? (
            <OrganigramEditor />
          ) : viewMode === 'CALENDARIO' ? (
            <CalendarioDivulgacoesEditor />
          ) : viewMode === 'ASSEMBLEIAS' ? (
            <AssembliasEditor />
          ) : viewMode === 'COMUNICADOS' ? (
            <ComunicadosEditor />
          ) : viewMode === 'NOTICIAS' ? (
            <NoticiasEditor />
          ) : viewMode === 'ANNUAL_REPORTS' ? (
            <RelatoriosEditor />
          ) : viewMode === 'RATINGS' ? (
            <BusinessIndicatorsEditor />
          ) : viewMode === 'APOIO' ? (
            <ApoioInvestidorEditor />
          ) : viewMode === 'ESTATUTOS' ? (
            <EstatutosEditor />
          ) : viewMode === 'ORGAOS_SOCIAIS' ? (
            <OrgaosSociaisEditor />
          ) : viewMode === 'EXECUTIVE' ? (
            <CorpoDiretivoEditor />
          ) : viewMode === 'ACIONISTAS' ? (
            <AcionistasEditor />
          ) : viewMode === 'PARTICIPADAS' ? (
            <ParticipadasEditor />
          ) : viewMode === 'EVENTOS' ? (
            <EventosEditor />
          ) : viewMode === 'MERCADO' ? (
            <MercadoEditor />
          ) : viewMode === 'VISUAL_INDICATORS' ? (
            <VisualIndicatorsEditor />
          ) : viewMode === 'MEDIA_GALLERY' ? (
            <MediaGalleryEditor />
          ) : viewMode === 'CEO_MESSAGE' ? (
            <CeoMessageEditor />
          ) : viewMode === 'CAROUSEL' ? (
            <CarouselEditor />
          ) : viewMode === 'SOBRE_NOS_CAROUSEL' ? (
            <SobreNosCarouselEditor />
          ) : viewMode === 'MARCO_HISTORICO' ? (
            <MarcoHistoricoEditor />
          ) : viewMode === 'PLANO_ESTRATEGICO' ? (
            <PlanoEstrategicoEditor />
          ) : viewMode === 'POLITICAS' ? (
            <PoliticasEditor />
          ) : viewMode === 'LEGISLACAO' ? (
            <LegislacaoEditor />
          ) : (
            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 5, border: '1px solid #f1f5f9', bgcolor: 'white' }}>
              <Box sx={{ mb: 3, opacity: 0.2 }}>
                <FolderOpen size={80} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Módulo {viewMode}</Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>Esta funcionalidade está a ser migrada para o novo sistema Tower CMS.</Typography>
              <Button variant="outlined" onClick={() => setShowEditor(true)}>Configurar este Módulo</Button>
            </Paper>
          )
        )}
      </Box>
    </Box>
  );
}

export default App;
