import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Avatar,
  Chip,
  Divider,
  alpha,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Plus,
  Trash2,
  Edit3,
  GripVertical,
  Upload,
  X,
  Network,
  User,
  Building,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ==================== Types ====================

interface DepartmentDTO {
  id: string;
  label: string;
  titles?: string[];
  titlesBgColor?: string;
  bgColor?: string;
  textColor?: string;
}

interface DirectorDTO {
  id: string;
  topNodeId?: string;
  personLabel: string;
  name: string;
  title: string;
  initials: string;
  photoUrl?: string | null;
  bio?: string;
  isCEO?: boolean;
  isVisible?: boolean;
  cardBgColor?: string;
  cardTextColor?: string;
  displayOrder: number;
  departments: DepartmentDTO[];
}

interface TopNodeDTO {
  id: string;
  label: string;
  type: 'governing' | 'support';
  isVisible?: boolean;
  bgColor?: string;
  textColor?: string;
  parentId?: string;
}

interface OrganigramDTO {
  meta: {
    version: string;
    updatedAt: string;
    description: string;
  };
  settings?: {
    showHierarchy?: boolean;
  };
  topNodes: TopNodeDTO[];
  directors: DirectorDTO[];
}

type Column = { id: string; topNode: TopNodeDTO | null; directors: DirectorDTO[] };
type ColumnTree = { column: Column; children: ColumnTree[] };

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/investor-content`;

// ==================== Color Picker ====================

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, overflow: 'hidden' }}>
      <Typography variant="caption" sx={{ fontWeight: 600, flexShrink: 0 }}>{label}</Typography>
      <Box
        component="input"
        type="color"
        value={value || '#11448b'}
        onChange={(e: any) => onChange(e.target.value)}
        sx={{ width: 32, height: 32, flexShrink: 0, border: '2px solid #e2e8f0', borderRadius: 1.5, cursor: 'pointer', p: 0.3 }}
      />
      <TextField
        size="small"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        sx={{ flex: 1, minWidth: 0 }}
        placeholder="#hex"
      />
    </Stack>
  );
}

// ==================== Canvas Director Card ====================

function CanvasDirectorCard({
  director,
  onEdit,
}: {
  director: DirectorDTO;
  onEdit: () => void;
}) {
  const colId = director.topNodeId || 'unassigned';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: director.id,
    data: { type: 'director', columnId: colId },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 6 : 0}
      sx={{
        p: 1.5, borderRadius: 2.5,
        border: `1.5px solid ${alpha(director.cardTextColor || '#11448b', 0.15)}`,
        bgcolor: director.cardBgColor || '#fff',
        mb: 1,
        '& .card-actions': { opacity: 0, transition: 'opacity 0.15s' },
        '&:hover .card-actions': { opacity: 1 },
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.09)' },
        transition: 'box-shadow 0.2s',
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        {/* Drag handle */}
        <Box
          {...attributes}
          {...listeners}
          sx={{ cursor: 'grab', color: '#94a3b8', pt: 0.5, flexShrink: 0, '&:active': { cursor: 'grabbing' } }}
      >
        <GripVertical size={16} />
      </Box>

      {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
            <Typography sx={{ fontWeight: 800, fontSize: 12, color: director.cardTextColor || '#11448b', lineHeight: 1.3 }}>
              {director.name}
            </Typography>
            {director.isCEO && <Chip label="CEO" size="small" color="error" sx={{ height: 15, fontSize: 9, fontWeight: 800 }} />}
          </Stack>
          <Typography sx={{ fontSize: 10, color: alpha(director.cardTextColor || '#11448b', 0.65), mb: 0.5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {director.title}
          </Typography>
          {director.departments.length > 0 && (
            <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.3 }}>
              {director.departments.slice(0, 3).map((dept) => (
                <Chip key={dept.id} label={dept.label} size="small" sx={{ height: 15, fontSize: 9, fontWeight: 700, bgcolor: dept.bgColor || '#11448b', color: dept.textColor || '#fff' }} />
              ))}
              {director.departments.length > 3 && <Chip label={`+${director.departments.length - 3}`} size="small" sx={{ height: 15, fontSize: 9, bgcolor: '#e2e8f0' }} />}
            </Stack>
          )}
        </Box>

        {/* Actions on hover */}
        <Stack direction="row" className="card-actions" sx={{ flexShrink: 0, mt: -0.25 }}>
          <IconButton size="small" onClick={onEdit} sx={{ color: '#3b82f6', p: 0.4 }}><Edit3 size={12} /></IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ==================== Canvas Column ====================

function CanvasColumn({
  columnId,
  topNode,
  directors,
  onEditTopNode,
  onDeleteTopNode,
  onUnNest,
  onAddDirector,
  onAddChildNode,
  onEditDirector,
  onDeleteDirector,
  childTrees = [],
  depth = 0,
  renderChildColumn,
  isDraggingColumn = false,
}: {
  columnId: string;
  topNode: TopNodeDTO | null;
  directors: DirectorDTO[];
  onEditTopNode?: () => void;
  onDeleteTopNode?: () => void;
  onUnNest?: () => void;
  onAddDirector: () => void;
  onAddChildNode?: () => void;
  onEditDirector: (dir: DirectorDTO) => void;
  onDeleteDirector: (id: string) => void;
  childTrees?: ColumnTree[];
  depth?: number;
  renderChildColumn?: (tree: ColumnTree, depth: number) => ReactNode;
  isDraggingColumn?: boolean;
}) {
  const {
    attributes: colAttr,
    listeners: colListeners,
    setNodeRef: colRef,
    transform: colTransform,
    transition: colTransition,
    isDragging: colDragging,
  } = useSortable({ id: columnId, data: { type: 'column' }, disabled: !topNode || !!topNode?.parentId });

  // Nest-drop zone on the header — receives OTHER columns being dragged onto this column
  const { setNodeRef: nestRef, isOver: isNestOver } = useDroppable({
    id: `nest-target::${columnId}`,
    data: { type: 'nest-target', forNodeId: columnId },
    disabled: !topNode,
  });

  const nodeHidden = topNode?.isVisible === false;
  const headerBg = nodeHidden ? '#9e9e9e' : (topNode ? topNode.bgColor || (topNode.type === 'governing' ? '#d3161c' : '#11448b') : '#475569');
  const headerText = nodeHidden ? '#fff' : (topNode?.textColor || '#fff');
  const showNestHighlight = isDraggingColumn && isNestOver && !!topNode;

  return (
    <Box
      ref={colRef}
      style={{ transform: CSS.Transform.toString(colTransform), transition: colTransition, opacity: colDragging ? 0.45 : 1 }}
      sx={{ flex: '1 1 0', minWidth: 180, maxWidth: 280, display: 'flex', flexDirection: 'column' }}
    >
      {/* Column header — also acts as nest-drop zone */}
      <Box
        ref={nestRef}
        sx={{
          p: 1.5, borderRadius: 2.5, bgcolor: showNestHighlight ? alpha(headerBg, 0.55) : headerBg, color: headerText,
          mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75,
          outline: showNestHighlight ? `3px dashed ${headerText}` : 'none',
          outlineOffset: 2,
          boxShadow: showNestHighlight ? `0 0 0 4px ${alpha(headerBg, 0.3)}, 0 2px 8px rgba(0,0,0,0.14)` : '0 2px 8px rgba(0,0,0,0.14)',
          transition: 'all 0.15s',
          userSelect: 'none',
          '& .col-actions': { opacity: 0, transition: 'opacity 0.15s' },
          '&:hover .col-actions': { opacity: 1 },
        }}
      >
        {topNode && !topNode.parentId && (
          <Box {...colAttr} {...colListeners} sx={{ cursor: 'grab', color: 'inherit', opacity: 0.65, display: 'flex', flexShrink: 0, '&:active': { cursor: 'grabbing' } }}>
            <GripVertical size={16} />
          </Box>
        )}
        {topNode && (
          <Chip label={topNode.type === 'governing' ? 'Gov.' : 'Apoio'} size="small"
            sx={{ height: 18, fontSize: 9, fontWeight: 800, bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit', flexShrink: 0 }} />
        )}
        {showNestHighlight && (
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'inherit', opacity: 0.9, mr: 0.5 }}>Encaixar aqui</Typography>
        )}
        <Typography sx={{ fontWeight: 800, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'inherit', lineHeight: 1.2 }}>
          {topNode ? topNode.label : 'Sem Hierarquia'}
        </Typography>
        {nodeHidden && (
          <Tooltip title="Oculto na página pública">
            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.85, flexShrink: 0 }}>
              <EyeOff size={13} />
            </Box>
          </Tooltip>
        )}
        {topNode && (
          <Stack direction="row" className="col-actions" spacing={0} sx={{ flexShrink: 0 }}>
            {topNode.parentId && onUnNest && (
              <Tooltip title="Mover para raiz">
                <IconButton size="small" onClick={onUnNest} sx={{ color: 'inherit', p: 0.3 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Editar nó"><IconButton size="small" onClick={onEditTopNode} sx={{ color: 'inherit', p: 0.3 }}><Edit3 size={12} /></IconButton></Tooltip>
          </Stack>
        )}
      </Box>

      {/* Drop zone */}
      <Box sx={{ flex: 1, minHeight: 80, p: directors.length === 0 ? 1.5 : 0, borderRadius: 2,
        bgcolor: directors.length === 0 ? alpha(headerBg, 0.04) : 'transparent',
        border: directors.length === 0 ? `2px dashed ${alpha(headerBg, 0.22)}` : 'none', transition: 'background 0.2s' }}>
        <SortableContext items={directors.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {directors.map((dir) => (
            <CanvasDirectorCard key={dir.id} director={dir} onEdit={() => onEditDirector(dir)} />
          ))}
        </SortableContext>
        {directors.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 0.5 }}>
            <Typography variant="caption" sx={{ color: alpha(headerBg, 0.45), fontStyle: 'italic' }}>Arraste membros aqui</Typography>
          </Box>
        )}
      </Box>

      {/* Bottom action buttons */}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" startIcon={<Plus size={12} />} onClick={onAddDirector}
          sx={{ flex: 1, fontSize: 11, textTransform: 'none', color: headerBg, border: `1px dashed ${alpha(headerBg, 0.32)}`, borderRadius: 2, '&:hover': { bgcolor: alpha(headerBg, 0.06) } }}>
          Membro
        </Button>
        {topNode && onAddChildNode && (
          <Button size="small" startIcon={<Network size={12} />} onClick={onAddChildNode}
            sx={{ flex: 1, fontSize: 11, textTransform: 'none', color: headerBg, border: `1px dashed ${alpha(headerBg, 0.32)}`, borderRadius: 2, '&:hover': { bgcolor: alpha(headerBg, 0.06) } }}>
            Nó filho
          </Button>
        )}
      </Stack>

      {/* ===== Child nodes ===== */}
      {childTrees.length > 0 && (
        <Box sx={{ mt: 2.5, pt: 2, borderTop: `2px dashed ${alpha(headerBg, 0.2)}` }}>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: alpha(headerBg, 0.55), fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
            <Network size={10} /> Nós subordinados ({childTrees.length})
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="flex-start">
            {childTrees.map((tree) => renderChildColumn?.(tree, depth + 1))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

// ==================== Director Form Dialog ====================

function DirectorFormDialog({
  open,
  director,
  topNodes,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  director: DirectorDTO | null;
  topNodes: TopNodeDTO[];
  onClose: () => void;
  onSave: (d: DirectorDTO) => void;
  onDelete?: () => void;
}) {
  const isNew = !director;
  const [form, setForm] = useState<DirectorDTO>({
    id: '',
    topNodeId: '',
    personLabel: '',
    name: '',
    title: '',
    initials: '',
    photoUrl: null,
    bio: '',
    isCEO: false,
    isVisible: true,
    cardBgColor: '#ffffff',
    cardTextColor: '#11448b',
    displayOrder: 99,
    departments: [],
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (director) {
      setForm({ ...director, isVisible: director.isVisible !== false });
      setImagePreview(director.photoUrl || null);
    } else {
      setForm({
        id: `dir-${Date.now().toString(36)}`,
        topNodeId: '',
        personLabel: '',
        name: '',
        title: '',
        initials: '',
        photoUrl: null,
        bio: '',
        isCEO: false,
        isVisible: true,
        cardBgColor: '#ffffff',
        cardTextColor: '#11448b',
        displayOrder: 99,
        departments: [],
      });
      setImagePreview(null);
    }
  }, [director, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setForm((prev) => ({ ...prev, photoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const updateField = (key: keyof DirectorDTO, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const [deptDialog, setDeptDialog] = useState<{ open: boolean; dept: DepartmentDTO | null }>({ open: false, dept: null });

  const handleSaveDept = (dept: DepartmentDTO) => {
    const exists = form.departments.find((d) => d.id === dept.id);
    updateField('departments', exists
      ? form.departments.map((d) => (d.id === dept.id ? dept : d))
      : [...form.departments, dept],
    );
    setDeptDialog({ open: false, dept: null });
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        {isNew ? 'Novo Membro' : `Editar – ${form.name}`}
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12, color: '#94a3b8' }}><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* ===== Hierarchy picker ===== */}
          <Box sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Building size={15} color="#64748b" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#374151', fontSize: 12.5 }}>Nó Hierárquico</Typography>
            </Stack>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip
                label="Sem associação"
                size="small"
                onClick={() => updateField('topNodeId', '')}
                variant={!form.topNodeId ? 'filled' : 'outlined'}
                sx={{ borderRadius: 1.5, fontSize: 11, fontWeight: !form.topNodeId ? 800 : 500, cursor: 'pointer', bgcolor: !form.topNodeId ? '#e2e8f0' : 'transparent', color: !form.topNodeId ? '#475569' : '#94a3b8' }}
              />
              {topNodes.map((node) => (
                <Chip
                  key={node.id}
                  label={node.label}
                  size="small"
                  onClick={() => updateField('topNodeId', node.id)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: form.topNodeId === node.id ? 800 : 600,
                    bgcolor: form.topNodeId === node.id ? (node.bgColor || '#11448b') : 'transparent',
                    color: form.topNodeId === node.id ? (node.textColor || '#fff') : (node.bgColor || '#11448b'),
                    border: `1.5px solid ${node.bgColor || '#11448b'}`,
                    '&:hover': { opacity: 0.82, bgcolor: form.topNodeId === node.id ? undefined : alpha(node.bgColor || '#11448b', 0.1) },
                  }}
                />
              ))}
            </Box>
            {form.topNodeId && (
              <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.75, display: 'block' }}>
                Pode também arrastar o cartão no canvas para reassociar.
              </Typography>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth size="small" label="Nome Completo" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth size="small" label="Rótulo (ex: ADM – Nome)" value={form.personLabel} onChange={(e) => updateField('personLabel', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth size="small" label="Cargo / Título" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <TextField fullWidth size="small" label="Iniciais" value={form.initials} onChange={(e) => updateField('initials', e.target.value.toUpperCase().slice(0, 3))} />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <TextField fullWidth size="small" label="Ordem" type="number" value={form.displayOrder} onChange={(e) => updateField('displayOrder', parseInt(e.target.value) || 0)} />
            </Grid>

          </Grid>

          <TextField fullWidth size="small" label="Biografia" multiline rows={2} value={form.bio || ''} onChange={(e) => updateField('bio', e.target.value)} />

          <FormControlLabel
            control={<Switch checked={!!form.isCEO} onChange={(e) => updateField('isCEO', e.target.checked)} />}
            label="É CEO / Presidente da Comissão Executiva"
          />

          <Box
            onClick={() => updateField('isVisible', form.isVisible === false)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', p: 1, borderRadius: 2, border: '1px solid', borderColor: form.isVisible === false ? '#f87171' : '#86efac', bgcolor: form.isVisible === false ? '#fef2f2' : '#f0fdf4', userSelect: 'none', transition: 'all 0.15s' }}
          >
            {form.isVisible === false ? <EyeOff size={16} color="#dc2626" /> : <Eye size={16} color="#16a34a" />}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: form.isVisible === false ? '#dc2626' : '#16a34a', lineHeight: 1.2 }}>
                {form.isVisible === false ? 'Oculto na página pública' : 'Visível na página pública'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#64748b', lineHeight: 1.2 }}>
                {form.isVisible === false ? 'Este membro não aparece no site' : 'Clique para ocultar'}
              </Typography>
            </Box>
          </Box>

          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Cores do Cartão</Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}><ColorInput label="Fundo" value={form.cardBgColor || '#ffffff'} onChange={(v) => updateField('cardBgColor', v)} /></Box>
            <Box sx={{ flex: 1 }}><ColorInput label="Texto" value={form.cardTextColor || '#11448b'} onChange={(v) => updateField('cardTextColor', v)} /></Box>
          </Box>

          {/* Departments */}
          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Departamentos ({form.departments.length})</Typography>
            <Button size="small" startIcon={<Plus size={13} />} onClick={() => setDeptDialog({ open: true, dept: null })} sx={{ textTransform: 'none', fontSize: 12 }}>
              Adicionar
            </Button>
          </Stack>
          <Stack spacing={0.75}>
            {form.departments.map((dept) => (
              <Box key={dept.id} sx={{ borderRadius: 2, bgcolor: dept.bgColor || '#11448b', color: dept.textColor || '#fff', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, flex: 1, color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.label}</Typography>
                  <Chip label={dept.id} size="small" sx={{ height: 18, fontSize: 9, bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }} />
                  <IconButton size="small" onClick={() => setDeptDialog({ open: true, dept })} sx={{ color: 'inherit', p: 0.3 }}><Edit3 size={12} /></IconButton>
                  <IconButton size="small" onClick={() => updateField('departments', form.departments.filter((d) => d.id !== dept.id))} sx={{ color: 'inherit', p: 0.3 }}><Trash2 size={12} /></IconButton>
                </Box>
                {dept.titles && dept.titles.length > 0 && (
                  <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.2)', px: 1.25, pb: 0.75 }}>
                    {dept.titles.map((t, i) => (
                      <Typography key={i} sx={{ fontSize: 10, color: 'inherit', opacity: 0.85, lineHeight: 1.6 }}>• {t}</Typography>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
            {form.departments.length === 0 && <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Sem departamentos associados.</Typography>}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {!isNew && onDelete && (
          <Button
            onClick={onDelete}
            color="error"
            startIcon={<Trash2 size={15} />}
            sx={{ borderRadius: 2, textTransform: 'none', mr: 'auto' }}
          >
            Eliminar membro
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => onSave(form)}
          sx={{ borderRadius: 2, fontWeight: 700 }}
          disabled={!form.name || !form.title}
        >
          {isNew ? 'Adicionar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
    <DepartmentFormDialog open={deptDialog.open} department={deptDialog.dept} onClose={() => setDeptDialog({ open: false, dept: null })} onSave={handleSaveDept} />
    </>
  );
}

// ==================== Department Form Dialog ====================

function DepartmentFormDialog({
  open,
  department,
  onClose,
  onSave,
}: {
  open: boolean;
  department: DepartmentDTO | null;
  onClose: () => void;
  onSave: (d: DepartmentDTO) => void;
}) {
  const isNew = !department;
  const [form, setForm] = useState<DepartmentDTO>({
    id: '',
    label: '',
    titles: [],
    titlesBgColor: 'rgba(255,255,255,0.15)',
    bgColor: '#11448b',
    textColor: '#ffffff',
  });
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (department) {
      setForm({ ...department, titles: department.titles || [], titlesBgColor: department.titlesBgColor || 'rgba(255,255,255,0.15)' });
    } else {
      setForm({ id: `dept-${Date.now().toString(36)}`, label: '', titles: [], titlesBgColor: 'rgba(255,255,255,0.15)', bgColor: '#11448b', textColor: '#ffffff' });
    }
    setNewTitle('');
  }, [department, open]);

  const addTitle = () => {
    const t = newTitle.trim();
    if (!t) return;
    setForm({ ...form, titles: [...(form.titles || []), t] });
    setNewTitle('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>{isNew ? 'Novo Departamento' : 'Editar Departamento'}<IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12, color: '#94a3b8' }}><X size={18} /></IconButton></DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField fullWidth size="small" label="ID (ex: DCE)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!isNew} />
          <TextField fullWidth size="small" label="Nome do Departamento" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}><ColorInput label="Fundo" value={form.bgColor || '#11448b'} onChange={(v) => setForm({ ...form, bgColor: v })} /></Box>
            <Box sx={{ flex: 1 }}><ColorInput label="Texto" value={form.textColor || '#ffffff'} onChange={(v) => setForm({ ...form, textColor: v })} /></Box>
          </Box>

          <Divider />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Títulos / Cargos ({(form.titles || []).length})</Typography>
            <Box sx={{ width: 140 }}><ColorInput label="Fundo dos títulos" value={form.titlesBgColor || 'rgba(255,255,255,0.15)'} onChange={(v) => setForm({ ...form, titlesBgColor: v })} /></Box>
          </Box>
          <Stack spacing={0.5}>
            {(form.titles || []).map((t, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1.5, bgcolor: '#f1f5f9' }}>
                <Typography sx={{ fontSize: 12, flex: 1 }}>{t}</Typography>
                <IconButton size="small" onClick={() => setForm({ ...form, titles: (form.titles || []).filter((_, idx) => idx !== i) })} sx={{ p: 0.3 }}><Trash2 size={12} /></IconButton>
              </Box>
            ))}
            {(form.titles || []).length === 0 && (
              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Nenhum título ainda.</Typography>
            )}
          </Stack>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Novo título..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTitle(); } }}
            />
            <Button variant="outlined" onClick={addTitle} disabled={!newTitle.trim()} sx={{ borderRadius: 2, textTransform: 'none', flexShrink: 0 }}>Adicionar</Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={() => onSave(form)} disabled={!form.label} sx={{ borderRadius: 2, fontWeight: 700, ml: 'auto' }}>
          {isNew ? 'Adicionar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ==================== Top Node Form Dialog ====================

function TopNodeFormDialog({
  open,
  node,
  onClose,
  onSave,
  onDelete,
  defaultParentId,
}: {
  open: boolean;
  node: TopNodeDTO | null;
  onClose: () => void;
  onSave: (n: TopNodeDTO) => void;
  onDelete?: () => void;
  defaultParentId?: string;
}) {
  const isNew = !node;
  const [form, setForm] = useState<TopNodeDTO>({
    id: '',
    label: '',
    type: 'governing',
    isVisible: true,
    bgColor: '#d3161c',
    textColor: '#ffffff',
  });

  useEffect(() => {
    if (node) {
      setForm({ ...node, isVisible: node.isVisible !== false });
    } else {
      setForm({ id: `node-${Date.now().toString(36)}`, label: '', type: 'governing', isVisible: true, bgColor: '#d3161c', textColor: '#ffffff', parentId: defaultParentId || '' });
    }
  }, [node, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>{isNew ? 'Novo Nó Hierárquico' : 'Editar Nó'}<IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12, color: '#94a3b8' }}><X size={18} /></IconButton></DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField fullWidth size="small" label="ID (ex: CA)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!isNew} />
          <TextField fullWidth size="small" label="Nome / Rótulo" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />

          {defaultParentId && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #86efac' }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                Será criado como sub-nó. Pode arrastar o cabeçalho para outro nó para mudar o pai.
              </Typography>
            </Box>
          )}

          <TextField
            select
            fullWidth
            size="small"
            label="Tipo"
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as TopNodeDTO['type'];
              setForm({
                ...form,
                type,
                bgColor: type === 'governing' ? '#d3161c' : '#11448b',
              });
            }}
          >
            <MenuItem value="governing">Órgão de Governação (vermelho)</MenuItem>
            <MenuItem value="support">Gabinete de Apoio (azul)</MenuItem>
          </TextField>
          <Box
            onClick={() => setForm({ ...form, isVisible: form.isVisible !== false ? false : true })}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', p: 1, borderRadius: 2, border: '1px solid', borderColor: form.isVisible === false ? '#f87171' : '#86efac', bgcolor: form.isVisible === false ? '#fef2f2' : '#f0fdf4', userSelect: 'none', transition: 'all 0.15s' }}
          >
            {form.isVisible === false ? <EyeOff size={16} color="#dc2626" /> : <Eye size={16} color="#16a34a" />}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: form.isVisible === false ? '#dc2626' : '#16a34a', lineHeight: 1.2 }}>
                {form.isVisible === false ? 'Oculto na página pública' : 'Visível na página pública'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#64748b', lineHeight: 1.2 }}>
                {form.isVisible === false ? 'Esta hierarquia não aparece no site' : 'Clique para ocultar'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}><ColorInput label="Fundo" value={form.bgColor || '#d3161c'} onChange={(v) => setForm({ ...form, bgColor: v })} /></Box>
            <Box sx={{ flex: 1 }}><ColorInput label="Texto" value={form.textColor || '#ffffff'} onChange={(v) => setForm({ ...form, textColor: v })} /></Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {!isNew && onDelete && (
          <Button color="error" startIcon={<Trash2 size={14} />} onClick={onDelete} sx={{ borderRadius: 2, textTransform: 'none', mr: 'auto' }}>Remover</Button>
        )}
        <Button variant="contained" onClick={() => onSave(form)} disabled={!form.label} sx={{ borderRadius: 2, fontWeight: 700, ml: 'auto' }}>
          {isNew ? 'Adicionar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ==================== Main Editor ====================

export default function OrganigramEditor() {
  const [data, setData] = useState<OrganigramDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeId, setActiveId] = useState<string | null>(null);

  const [directorDialog, setDirectorDialog] = useState<{ open: boolean; director: DirectorDTO | null }>({ open: false, director: null });
  const [topNodeDialog, setTopNodeDialog] = useState<{ open: boolean; node: TopNodeDTO | null; defaultParentId?: string }>({ open: false, node: null });

  // Custom collision: when dragging a column, nest-targets (column headers) take priority via pointer-within
  const collisionDetectionStrategy = useCallback<CollisionDetection>((args) => {
    const activeType = args.active.data.current?.type;
    if (activeType === 'column') {
      const nestHits = pointerWithin({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'nest-target'),
      });
      if (nestHits.length > 0) return nestHits;
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'column'),
      });
    }
    // Director drag: exclude nest-target zones — they are only for column nesting, not card drops
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (c) => c.data.current?.type === 'director' || c.data.current?.type === 'column',
      ),
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ---- Fetch ----
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/organogram`);
      if (!res.ok) throw new Error('Fetch failed');
      const json: OrganigramDTO = await res.json();
      setData({
        ...json,
        settings: {
          showHierarchy: json.settings?.showHierarchy !== false,
        },
      });
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---- Save ----
  const handleSave = async (overrideData?: typeof data) => {
    const payload = overrideData ?? data;
    if (!payload) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/organogram`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      setData(saved);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ---- Director CRUD ----
  const handleSaveDirector = (dir: DirectorDTO) => {
    if (!data) return;
    const exists = data.directors.find((d) => d.id === dir.id);
    const updated = exists
      ? { ...data, directors: data.directors.map((d) => (d.id === dir.id ? dir : d)) }
      : { ...data, directors: [...data.directors, { ...dir, displayOrder: data.directors.length + 1 }] };
    setData(updated);
    setDirectorDialog({ open: false, director: null });
    handleSave(updated);
  };

  const handleDeleteDirector = (id: string) => {
    if (!data) return;
    const updated = { ...data, directors: data.directors.filter((d) => d.id !== id) };
    setData(updated);
    handleSave(updated);
  };

  // ---- Top Node CRUD ----
  const handleSaveTopNode = (node: TopNodeDTO) => {
    if (!data) return;
    const exists = data.topNodes.find((n) => n.id === node.id);
    const updated = exists
      ? { ...data, topNodes: data.topNodes.map((n) => (n.id === node.id ? node : n)) }
      : { ...data, topNodes: [...data.topNodes, node] };
    setData(updated);
    setTopNodeDialog({ open: false, node: null });
    handleSave(updated);
  };

  const handleDeleteTopNode = (id: string) => {
    if (!data) return;
    const updated = {
      ...data,
      topNodes: data.topNodes.filter((n) => n.id !== id),
      directors: data.directors.map((d) => (d.topNodeId === id ? { ...d, topNodeId: '' } : d)),
    };
    setData(updated);
    handleSave(updated);
  };

  // ---- Columns ----
  const columns = useMemo<Column[]>(() => {
    if (!data) return [];
    const cols: Column[] = data.topNodes.map((node) => ({
      id: node.id,
      topNode: node,
      directors: data.directors.filter((d) => d.topNodeId === node.id).sort((a, b) => a.displayOrder - b.displayOrder),
    }));
    const unassigned = data.directors
      .filter((d) => !d.topNodeId || !data.topNodes.find((n) => n.id === d.topNodeId))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    cols.push({ id: 'unassigned', topNode: null, directors: unassigned });
    return cols;
  }, [data]);

  const columnTree = useMemo<ColumnTree[]>(() => {
    if (!data) return [];
    const buildTree = (parentId: string | undefined): ColumnTree[] =>
      data.topNodes
        .filter((n) => (n.parentId || '') === (parentId || ''))
        .map((n) => ({
          column: columns.find((c) => c.id === n.id) ?? { id: n.id, topNode: n, directors: [] },
          children: buildTree(n.id),
        }));
    const roots = buildTree(undefined);
    const unassignedCol = columns.find((c) => c.id === 'unassigned');
    if (unassignedCol && unassignedCol.directors.length > 0) {
      roots.push({ column: unassignedCol, children: [] });
    }
    return roots;
  }, [data, columns]);

  // ---- Drag and Drop ----
  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !data) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeType = active.data.current?.type as string | undefined;

    if (activeType === 'column') {
      // Nest: dropped onto another column's header nest-target zone
      if (over.data.current?.type === 'nest-target') {
        const forNodeId = over.data.current.forNodeId as string;
        if (forNodeId === activeId) return;
        // Prevent circular nesting
        const wouldCycle = (checkId: string, ancestorId: string): boolean => {
          const node = data.topNodes.find((n) => n.id === checkId);
          if (!node?.parentId) return false;
          if (node.parentId === ancestorId) return true;
          return wouldCycle(node.parentId, ancestorId);
        };
        if (wouldCycle(forNodeId, activeId)) return;
        setData({ ...data, topNodes: data.topNodes.map((n) => n.id === activeId ? { ...n, parentId: forNodeId } : n) });
        return;
      }
      // Reorder root columns
      if (over.data.current?.type !== 'column') return;
      const oldIdx = data.topNodes.findIndex((n) => n.id === activeId);
      const newIdx = data.topNodes.findIndex((n) => n.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;
      setData({ ...data, topNodes: arrayMove(data.topNodes, oldIdx, newIdx) });
      return;
    }

    const sourceColId = active.data.current?.columnId as string | undefined;
    if (!sourceColId) return;

    const overType = over.data.current?.type as string | undefined;
    let destColId: string;
    if (overType === 'director') {
      destColId = over.data.current?.columnId as string;
    } else if (overType === 'column') {
      destColId = overId;
    } else if (overType === 'nest-target') {
      // Dropped on a column header — treat as dropping into that column
      destColId = String(over.data.current?.forNodeId ?? '');
    } else {
      return;
    }
    if (!destColId) return;
    if (!destColId) return;

    if (sourceColId === destColId) {
      const col = columns.find((c) => c.id === sourceColId);
      if (!col) return;
      const oldIdx = col.directors.findIndex((d) => d.id === activeId);
      const newIdx = col.directors.findIndex((d) => d.id === overId);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
      const reordered = arrayMove(col.directors, oldIdx, newIdx).map((d, i) => ({ ...d, displayOrder: i + 1 }));
      const dirMap = new Map(reordered.map((d) => [d.id, d]));
      setData({ ...data, directors: data.directors.map((d) => dirMap.get(d.id) ?? d) });
    } else {
      const newTopNodeId = destColId === 'unassigned' ? '' : destColId;
      setData({ ...data, directors: data.directors.map((d) => d.id === activeId ? { ...d, topNodeId: newTopNodeId } : d) });
    }
  };

  const activeDirector = data?.directors.find((d) => d.id === activeId) ?? null;
  const activeTopNode = data?.topNodes.find((n) => n.id === activeId) ?? null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 5 }}>
        <Typography variant="h6" color="error">Não foi possível carregar o organograma.</Typography>
        <Button onClick={fetchData} sx={{ mt: 2 }}>Tentar novamente</Button>
      </Paper>
    );
  }

  return (
    <Box>
      {/* ===== Header ===== */}
      <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" gap={1.5}>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<Building size={15} />} onClick={() => setTopNodeDialog({ open: true, node: null })} sx={{ borderRadius: 3, textTransform: 'none' }}>
            Novo Nó
          </Button>
          <Button variant="outlined" startIcon={<User size={15} />} onClick={() => setDirectorDialog({ open: true, director: null })} sx={{ borderRadius: 3, textTransform: 'none' }}>
            Novo Membro
          </Button>
          <Button
            variant={saveStatus === 'saved' || saveStatus === 'error' ? 'contained' : 'outlined'}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : saveStatus === 'saved' ? <Check size={15} /> : saveStatus === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
            onClick={() => handleSave()}
            disabled={saving}
            sx={{ borderRadius: 3, textTransform: 'none', transition: 'all 0.2s', ...(saveStatus === 'saved' ? { bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderColor: '#16a34a', color: '#fff' } : saveStatus === 'error' ? { bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderColor: '#dc2626', color: '#fff' } : {}) }}
          >
            {saving ? 'A guardar...' : saveStatus === 'saved' ? 'Guardado' : saveStatus === 'error' ? 'Erro' : 'Guardar'}
          </Button>
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Arraste cartões entre colunas para mover membros. Arraste cabeçalhos de nós raiz para reordenar. Arraste um nó sobre outro para encaixá-lo como filho.
      </Typography>

      {/* ===== Canvas ===== */}
      <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', overflow: 'visible', minHeight: 520 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <GripVertical size={13} color="#94a3b8" />
            <Typography variant="caption" sx={{ color: '#64748b' }}>Arrastar membro → mover de nó</Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>|</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <GripVertical size={13} color="#94a3b8" />
            <Typography variant="caption" sx={{ color: '#64748b' }}>Arrastar cabeçalho (grip) → reordenar ou encaixar como filho</Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>|</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {data.topNodes.length} nó{data.topNodes.length !== 1 ? 's' : ''} · {data.directors.length} membro{data.directors.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>

        <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={data.topNodes.filter((n) => !n.parentId).map((n) => n.id)} strategy={horizontalListSortingStrategy}>
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flexWrap: 'wrap', pb: 1 }}>
              {(() => {
                const isCDragging = !!activeId && !!data.topNodes.find((n) => n.id === activeId);
                const renderColumn = (tree: ColumnTree, d: number): ReactNode => {
                  const col = tree.column;
                  const tn = col.topNode;
                  return (
                    <CanvasColumn
                      key={col.id}
                      columnId={col.id}
                      topNode={tn}
                      directors={col.directors}
                      childTrees={tree.children}
                      depth={d}
                      renderChildColumn={renderColumn}
                      isDraggingColumn={isCDragging}
                      onEditTopNode={tn ? () => setTopNodeDialog({ open: true, node: tn }) : undefined}
                      onDeleteTopNode={tn ? () => handleDeleteTopNode(tn.id) : undefined}
                      onUnNest={tn?.parentId ? () => setData((prev) => prev ? { ...prev, topNodes: prev.topNodes.map((n) => n.id === tn.id ? { ...n, parentId: undefined } : n) } : prev) : undefined}
                      onAddChildNode={tn ? () => setTopNodeDialog({ open: true, node: null, defaultParentId: tn.id }) : undefined}
                      onAddDirector={() => setDirectorDialog({
                        open: true,
                        director: {
                          id: `dir-${Date.now().toString(36)}`,
                          topNodeId: col.id === 'unassigned' ? '' : col.id,
                          personLabel: '', name: '', title: '', initials: '', photoUrl: null,
                          bio: '', isCEO: false, isVisible: true, cardBgColor: '#ffffff', cardTextColor: '#11448b',
                          displayOrder: data.directors.length + 1, departments: [],
                        },
                      })}
                      onEditDirector={(dir) => setDirectorDialog({ open: true, director: dir })}
                      onDeleteDirector={handleDeleteDirector}
                    />
                  );
                };
                return columnTree.map((tree) => renderColumn(tree, 0));
              })()}

              {/* Add new column CTA */}
              <Box
                onClick={() => setTopNodeDialog({ open: true, node: null })}
                sx={{
                  width: 200, minHeight: 80, borderRadius: 2.5, border: '2px dashed #cbd5e1',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 0.75, cursor: 'pointer', color: '#94a3b8', userSelect: 'none',
                  transition: 'border-color 0.2s, color 0.2s',
                  '&:hover': { borderColor: '#3b82f6', color: '#3b82f6', bgcolor: alpha('#3b82f6', 0.03) },
                }}
              >
                <Plus size={20} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Novo nó hierárquico</Typography>
              </Box>
            </Stack>
          </SortableContext>

          {/* Ghost card while dragging */}
          <DragOverlay>
            {activeDirector ? (
              <Paper elevation={12} sx={{ p: 1.5, borderRadius: 2.5, width: 252, bgcolor: activeDirector.cardBgColor || '#fff', border: `2px solid ${activeDirector.cardTextColor || '#11448b'}`, opacity: 0.93 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 11, fontWeight: 800, bgcolor: alpha(activeDirector.cardTextColor || '#11448b', 0.1), color: activeDirector.cardTextColor || '#11448b' }}>
                    {activeDirector.initials}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 12, color: activeDirector.cardTextColor || '#11448b' }}>{activeDirector.name}</Typography>
                    <Typography sx={{ fontSize: 10, color: alpha(activeDirector.cardTextColor || '#11448b', 0.65) }}>{activeDirector.title}</Typography>
                  </Box>
                </Stack>
              </Paper>
            ) : activeTopNode ? (
              <Box sx={{ p: 1.5, borderRadius: 2.5, width: 268, bgcolor: activeTopNode.bgColor || '#d3161c', color: activeTopNode.textColor || '#fff', fontWeight: 800, fontSize: 13, boxShadow: '0 16px 40px rgba(0,0,0,0.18)', opacity: 0.93 }}>
                {activeTopNode.label}
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Paper>

      {/* ===== Dialogs ===== */}
      <DirectorFormDialog
        open={directorDialog.open}
        director={directorDialog.director}
        topNodes={data.topNodes}
        onClose={() => setDirectorDialog({ open: false, director: null })}
        onSave={handleSaveDirector}
        onDelete={directorDialog.director ? () => { handleDeleteDirector(directorDialog.director!.id); setDirectorDialog({ open: false, director: null }); } : undefined}
      />
      <TopNodeFormDialog
        open={topNodeDialog.open}
        node={topNodeDialog.node}
        defaultParentId={topNodeDialog.defaultParentId}
        onClose={() => setTopNodeDialog({ open: false, node: null })}
        onSave={handleSaveTopNode}
        onDelete={topNodeDialog.node ? () => { handleDeleteTopNode(topNodeDialog.node!.id); setTopNodeDialog({ open: false, node: null }); } : undefined}
      />


    </Box>
  );
}
