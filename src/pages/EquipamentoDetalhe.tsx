import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContratos } from '@/hooks/useContratos';
import { useSentidos } from '@/hooks/useSentidos';
import {
  useEquipamento,
  useCreateEquipamento,
  useUpdateEquipamento,
} from '@/hooks/useEquipamentos';
import {
  useSinalizacaoVertical,
  useSinalizacaoHorizontal,
  useCreateSinalizacaoVertical,
  useUpdateSinalizacaoVertical,
  useDeleteSinalizacaoVertical,
  useCreateSinalizacaoHorizontal,
  useUpdateSinalizacaoHorizontal,
  useDeleteSinalizacaoHorizontal,
  SinalizacaoVertical,
  SinalizacaoHorizontal,
} from '@/hooks/useSinalizacao';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X, Save, Trash2, Edit, Upload, Radio, MapPin, Settings, ArrowUpDown, ArrowLeftRight, Calendar, Image, TrendingUp, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImageThumbnail } from '@/components/ImageThumbnail';
import { EquipamentoUploads } from '@/components/EquipamentoUploads';

// Component for equipment progress chart
interface EquipamentoProgressChartProps {
  formData: {
    prev_placas: number;
    prev_pontaletes: number;
    prev_postes_colapsiveis: number;
    prev_bracos_projetados: number;
    prev_semi_porticos: number;
    prev_defensas: number;
    prev_postes_horizontal: number;
    prev_tae_80: number;
    prev_tae_100: number;
  };
  sinalizacaoVertical: SinalizacaoVertical[] | undefined;
  sinalizacaoHorizontal: SinalizacaoHorizontal[] | undefined;
}

function EquipamentoProgressChart({ formData, sinalizacaoVertical, sinalizacaoHorizontal }: EquipamentoProgressChartProps) {
  // Calculate installed values
  const instalado = useMemo(() => {
    let placas = sinalizacaoVertical?.length || 0;
    let pontaletes = 0;
    let postes_colapsiveis = 0;
    
    sinalizacaoVertical?.forEach((sv) => {
      pontaletes += sv.qtd_pontaletes || 0;
      postes_colapsiveis += sv.qtd_postes_colapsiveis || 0;
    });

    let laminas = 0;
    let postes = 0;
    let tae_80 = 0;
    let tae_100 = 0;

    sinalizacaoHorizontal?.forEach((sh) => {
      if (sh.tipo === 'defensa_metalica') {
        laminas += sh.qtd_laminas || 0;
        postes += sh.qtd_postes || 0;
      } else if (sh.tipo === 'tae_80') {
        tae_80 += 1;
      } else if (sh.tipo === 'tae_100') {
        tae_100 += 1;
      }
    });

    return { placas, pontaletes, postes_colapsiveis, laminas, postes, tae_80, tae_100 };
  }, [sinalizacaoVertical, sinalizacaoHorizontal]);

  // Build chart data
  const chartData = useMemo(() => [
    { name: 'Placas', previsto: formData.prev_placas, instalado: instalado.placas },
    { name: 'Pontaletes', previsto: formData.prev_pontaletes, instalado: instalado.pontaletes },
    { name: 'Postes Col.', previsto: formData.prev_postes_colapsiveis, instalado: instalado.postes_colapsiveis },
    { name: 'Braço Proj.', previsto: formData.prev_bracos_projetados, instalado: 0 },
    { name: 'Semi Pórtico', previsto: formData.prev_semi_porticos, instalado: 0 },
    { name: 'Defensas', previsto: formData.prev_defensas, instalado: instalado.laminas },
    { name: 'Postes Hor.', previsto: formData.prev_postes_horizontal, instalado: instalado.postes },
    { name: 'TAE 80', previsto: formData.prev_tae_80, instalado: instalado.tae_80 },
    { name: 'TAE 100', previsto: formData.prev_tae_100, instalado: instalado.tae_100 },
  ].filter(item => item.previsto > 0 || item.instalado > 0), [formData, instalado]);

  // Calculate totals
  const totalPrevisto = formData.prev_placas + formData.prev_pontaletes + formData.prev_postes_colapsiveis + 
    formData.prev_bracos_projetados + formData.prev_semi_porticos + formData.prev_defensas + 
    formData.prev_postes_horizontal + formData.prev_tae_80 + formData.prev_tae_100;
  
  const totalInstalado = instalado.placas + instalado.pontaletes + instalado.postes_colapsiveis + 
    instalado.laminas + instalado.postes + instalado.tae_80 + instalado.tae_100;

  const percentual = totalPrevisto > 0 ? Math.round((totalInstalado / totalPrevisto) * 100) : 0;

  const hasData = chartData.length > 0;

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Progresso da Implantação</CardTitle>
            <CardDescription>Comparativo entre previsto e instalado</CardDescription>
          </div>
          <Badge variant={percentual >= 100 ? "default" : percentual >= 50 ? "secondary" : "outline"} className={percentual >= 100 ? "bg-success text-success-foreground" : ""}>
            {percentual}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Instalado: {totalInstalado}</span>
            <span>Previsto: {totalPrevisto}</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
              style={{ width: `${Math.min(percentual, 100)}%` }}
            />
          </div>
        </div>

        {/* Chart */}
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <defs>
                  <linearGradient id="gradPrevisto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="gradInstalado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '10px',
                    boxShadow: '0 8px 30px hsl(var(--foreground) / 0.1)',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                />
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Bar 
                  dataKey="previsto" 
                  fill="url(#gradPrevisto)" 
                  name="Previsto" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={35}
                />
                <Bar 
                  dataKey="instalado" 
                  fill="url(#gradInstalado)"
                  name="Instalado" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={35}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Sem dados de previsão</p>
            <p className="text-xs opacity-70">Configure a previsão nas abas de sinalização</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EquipamentoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, canDelete } = useAuth();
  const { toast } = useToast();
  const isNew = id === 'novo';

  const { data: contratos } = useContratos();
  const { data: sentidos } = useSentidos();
  const { data: equipamento, isLoading } = useEquipamento(isNew ? undefined : id);
  const { data: sinalizacaoVertical } = useSinalizacaoVertical(isNew ? undefined : id);
  const { data: sinalizacaoHorizontal } = useSinalizacaoHorizontal(isNew ? undefined : id);

  const createEquipamento = useCreateEquipamento();
  const updateEquipamento = useUpdateEquipamento();

  const createSV = useCreateSinalizacaoVertical();
  const updateSV = useUpdateSinalizacaoVertical();
  const deleteSV = useDeleteSinalizacaoVertical();
  const createSH = useCreateSinalizacaoHorizontal();
  const updateSH = useUpdateSinalizacaoHorizontal();
  const deleteSH = useDeleteSinalizacaoHorizontal();

  // Form state
  const [formData, setFormData] = useState({
    contrato_id: '',
    numero_serie: '',
    municipio: '',
    endereco: '',
    latitude: '',
    longitude: '',
    tem_sinalizacao_vertical: false,
    tem_sinalizacao_horizontal: false,
    tipo_equipamento: '',
    quantidade_faixas: 1,
    sentido_id: '',
    tipo_conexao: '',
    tipo_energia: '',
    // Previsão Sinalização Vertical
    prev_placas: 0,
    prev_pontaletes: 0,
    prev_postes_colapsiveis: 0,
    prev_bracos_projetados: 0,
    prev_semi_porticos: 0,
    // Previsão Sinalização Horizontal
    prev_defensas: 0,
    prev_postes_horizontal: 0,
    prev_tae_80: 0,
    prev_tae_100: 0,
  });

  // Dialog states
  const [svDialogOpen, setSvDialogOpen] = useState(false);
  const [editingSV, setEditingSV] = useState<SinalizacaoVertical | null>(null);
  const [svForm, setSvForm] = useState({
    categoria: 'placas' as 'placas' | 'braco_projetado' | 'semi_portico',
    sentido_id: '',
    endereco: '',
    tipo: '',
    subtipo: 'equipamento',
    instalacao: 'solo',
    lado: 'D',
    latitude: '',
    longitude: '',
    foto_url: '',
    qtd_pontaletes: 0,
    qtd_perfis_metalicos: 0,
    qtd_postes_colapsiveis: 0,
    data: '',
    total_m2: '',
  });

  const [shDialogOpen, setShDialogOpen] = useState(false);
  const [editingSH, setEditingSH] = useState<SinalizacaoHorizontal | null>(null);
  const [shForm, setShForm] = useState({
    sentido_id: '',
    tipo: 'defensa_metalica' as 'defensa_metalica' | 'tae_80' | 'tae_100',
    endereco: '',
    lado: 'D',
    latitude: '',
    longitude: '',
    foto_url: '',
    qtd_laminas: 0,
    qtd_postes: 0,
    data: '',
  });

  // Load equipamento data
  useEffect(() => {
    if (equipamento) {
      setFormData({
        contrato_id: equipamento.contrato_id,
        numero_serie: equipamento.numero_serie,
        municipio: equipamento.municipio,
        endereco: equipamento.endereco,
        latitude: equipamento.latitude?.toString() || '',
        longitude: equipamento.longitude?.toString() || '',
        tem_sinalizacao_vertical: equipamento.tem_sinalizacao_vertical,
        tem_sinalizacao_horizontal: equipamento.tem_sinalizacao_horizontal,
        tipo_equipamento: equipamento.tipo_equipamento || '',
        quantidade_faixas: equipamento.quantidade_faixas || 1,
        sentido_id: (equipamento as any).sentido_id || '',
        tipo_conexao: (equipamento as any).tipo_conexao || '',
        tipo_energia: (equipamento as any).tipo_energia || '',
        // Previsão Sinalização Vertical
        prev_placas: (equipamento as any).prev_placas || 0,
        prev_pontaletes: (equipamento as any).prev_pontaletes || 0,
        prev_postes_colapsiveis: (equipamento as any).prev_postes_colapsiveis || 0,
        prev_bracos_projetados: (equipamento as any).prev_bracos_projetados || 0,
        prev_semi_porticos: (equipamento as any).prev_semi_porticos || 0,
        // Previsão Sinalização Horizontal
        prev_defensas: (equipamento as any).prev_defensas || 0,
        prev_postes_horizontal: (equipamento as any).prev_postes_horizontal || 0,
        prev_tae_80: (equipamento as any).prev_tae_80 || 0,
        prev_tae_100: (equipamento as any).prev_tae_100 || 0,
      });
    }
  }, [equipamento]);

  const handleSave = async () => {
    if (!formData.contrato_id || !formData.numero_serie || !formData.municipio || !formData.endereco) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const data = {
      contrato_id: formData.contrato_id,
      numero_serie: formData.numero_serie,
      municipio: formData.municipio,
      endereco: formData.endereco,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      tem_sinalizacao_vertical: formData.tem_sinalizacao_vertical,
      tem_sinalizacao_horizontal: formData.tem_sinalizacao_horizontal,
      tipo_equipamento: formData.tipo_equipamento || null,
      quantidade_faixas: formData.quantidade_faixas,
      sentido_id: formData.sentido_id || null,
      tipo_conexao: formData.tipo_conexao || null,
      tipo_energia: formData.tipo_energia || null,
      // Previsão Sinalização Vertical
      prev_placas: formData.prev_placas,
      prev_pontaletes: formData.prev_pontaletes,
      prev_postes_colapsiveis: formData.prev_postes_colapsiveis,
      prev_bracos_projetados: formData.prev_bracos_projetados,
      prev_semi_porticos: formData.prev_semi_porticos,
      // Previsão Sinalização Horizontal
      prev_defensas: formData.prev_defensas,
      prev_postes_horizontal: formData.prev_postes_horizontal,
      prev_tae_80: formData.prev_tae_80,
      prev_tae_100: formData.prev_tae_100,
    };

    if (isNew) {
      const result = await createEquipamento.mutateAsync(data as any);
      navigate(`/equipamentos/${result.id}`);
    } else {
      await updateEquipamento.mutateAsync({ id: id!, ...data } as any);
    }
  };

  // Sinalização Vertical handlers
  const openSVDialog = (sv?: SinalizacaoVertical) => {
    if (sv) {
      setEditingSV(sv);
      setSvForm({
        categoria: (sv.categoria as 'placas' | 'braco_projetado' | 'semi_portico') || 'placas',
        sentido_id: sv.sentido_id || '',
        endereco: sv.endereco,
        tipo: sv.tipo,
        subtipo: sv.subtipo,
        instalacao: sv.instalacao,
        lado: sv.lado,
        latitude: sv.latitude?.toString() || '',
        longitude: sv.longitude?.toString() || '',
        foto_url: sv.foto_url || '',
        qtd_pontaletes: sv.qtd_pontaletes,
        qtd_perfis_metalicos: sv.qtd_perfis_metalicos,
        qtd_postes_colapsiveis: sv.qtd_postes_colapsiveis,
        data: sv.data || '',
        total_m2: sv.total_m2?.toString() || '',
      });
    } else {
      setEditingSV(null);
      setSvForm({
        categoria: 'placas',
        sentido_id: '',
        endereco: '',
        tipo: '',
        subtipo: 'equipamento',
        instalacao: 'solo',
        lado: 'D',
        latitude: '',
        longitude: '',
        foto_url: '',
        qtd_pontaletes: 0,
        qtd_perfis_metalicos: 0,
        qtd_postes_colapsiveis: 0,
        data: '',
        total_m2: '',
      });
    }
    setSvDialogOpen(true);
  };

  const handleSaveSV = async () => {
    const isPlacas = svForm.categoria === 'placas';
    
    // Validação: tipo obrigatório apenas para placas
    if (!id || !svForm.endereco || (isPlacas && !svForm.tipo)) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const data = {
      equipamento_id: id,
      categoria: svForm.categoria,
      sentido_id: svForm.sentido_id || null,
      endereco: svForm.endereco,
      tipo: svForm.tipo || svForm.categoria, // usa categoria como tipo se vazio
      subtipo: svForm.subtipo,
      instalacao: svForm.instalacao,
      lado: svForm.lado,
      latitude: svForm.latitude ? parseFloat(svForm.latitude) : null,
      longitude: svForm.longitude ? parseFloat(svForm.longitude) : null,
      foto_url: svForm.foto_url || null,
      qtd_pontaletes: isPlacas ? svForm.qtd_pontaletes : 0,
      qtd_perfis_metalicos: isPlacas ? svForm.qtd_perfis_metalicos : 0,
      qtd_postes_colapsiveis: isPlacas ? svForm.qtd_postes_colapsiveis : 0,
      data: svForm.data || null,
      total_m2: isPlacas && svForm.total_m2 ? parseFloat(svForm.total_m2) : null,
    };

    if (editingSV) {
      await updateSV.mutateAsync({ id: editingSV.id, ...data });
    } else {
      await createSV.mutateAsync(data);
    }
    setSvDialogOpen(false);
  };

  // Sinalização Horizontal handlers
  const openSHDialog = (sh?: SinalizacaoHorizontal) => {
    if (sh) {
      setEditingSH(sh);
      setShForm({
        sentido_id: sh.sentido_id || '',
        tipo: sh.tipo,
        endereco: sh.endereco,
        lado: sh.lado,
        latitude: sh.latitude?.toString() || '',
        longitude: sh.longitude?.toString() || '',
        foto_url: sh.foto_url || '',
        qtd_laminas: sh.qtd_laminas,
        qtd_postes: sh.qtd_postes,
        data: sh.data || '',
      });
    } else {
      setEditingSH(null);
      setShForm({
        sentido_id: '',
        tipo: 'defensa_metalica',
        endereco: '',
        lado: 'D',
        latitude: '',
        longitude: '',
        foto_url: '',
        qtd_laminas: 0,
        qtd_postes: 0,
        data: '',
      });
    }
    setShDialogOpen(true);
  };

  const handleSaveSH = async () => {
    if (!id || !shForm.endereco) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if ((shForm.tipo === 'tae_80' || shForm.tipo === 'tae_100') && !shForm.sentido_id) {
      toast({ title: 'Sentido é obrigatório para TAE', variant: 'destructive' });
      return;
    }

    const data = {
      equipamento_id: id,
      sentido_id: shForm.sentido_id || null,
      tipo: shForm.tipo,
      endereco: shForm.endereco,
      lado: shForm.lado,
      latitude: shForm.latitude ? parseFloat(shForm.latitude) : null,
      longitude: shForm.longitude ? parseFloat(shForm.longitude) : null,
      foto_url: shForm.foto_url || null,
      qtd_laminas: shForm.qtd_laminas,
      qtd_postes: shForm.qtd_postes,
      data: shForm.data || null,
    };

    if (editingSH) {
      await updateSH.mutateAsync({ id: editingSH.id, ...data });
    } else {
      await createSH.mutateAsync(data);
    }
    setShDialogOpen(false);
  };

  // File upload handler
  const handleFileUpload = async (file: File, setUrl: (url: string) => void) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Erro ao fazer upload', description: uploadError.message, variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('fotos')
      .getPublicUrl(filePath);

    setUrl(urlData.publicUrl);
    toast({ title: 'Upload realizado com sucesso!' });
  };

  const tipoHorizontalLabels: Record<string, string> = {
    defensa_metalica: 'Defensa Metálica',
    tae_80: 'TAE 80 km/h',
    tae_100: 'TAE 100 km/h',
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/equipamentos')} className="hover:bg-primary/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
            <Radio className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'Novo Equipamento' : `Equipamento ${equipamento?.numero_serie}`}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isNew ? 'Cadastre um novo equipamento no sistema' : 'Visualize e edite os dados do equipamento'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="dados" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
            <Settings className="h-4 w-4 mr-2" />
            Dados do Equipamento
          </TabsTrigger>
          {formData.tem_sinalizacao_vertical && (
            <TabsTrigger value="vertical" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sinalização Vertical
            </TabsTrigger>
          )}
          {formData.tem_sinalizacao_horizontal && (
            <TabsTrigger value="horizontal" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Sinalização Horizontal
            </TabsTrigger>
          )}
          {!isNew && (
            <TabsTrigger value="uploads" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
              <FileText className="h-4 w-4 mr-2" />
              Upload de Arquivos
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Dados */}
        <TabsContent value="dados" className="space-y-6">
          {/* Informações Básicas */}
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Radio className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  <CardDescription>Dados de identificação do equipamento</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">Contrato <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.contrato_id}
                    onValueChange={(v) => setFormData({ ...formData, contrato_id: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.id_contrato} - {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nº Série <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.numero_serie}
                    onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                    placeholder="Ex: RAD-001"
                    disabled={!canEdit}
                    className="h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Equipamento</Label>
                  <Select
                    value={formData.tipo_equipamento}
                    onValueChange={(v) => setFormData({ ...formData, tipo_equipamento: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REV">REV</SelectItem>
                      <SelectItem value="REC">REC</SelectItem>
                      <SelectItem value="CEV">CEV</SelectItem>
                      <SelectItem value="CEC">CEC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantidade de Faixas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantidade_faixas}
                    onChange={(e) => setFormData({ ...formData, quantidade_faixas: parseInt(e.target.value) || 1 })}
                    disabled={!canEdit}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Município <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.municipio}
                    onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                    placeholder="Nome do município"
                    disabled={!canEdit}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Endereço <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Endereço completo"
                    disabled={!canEdit}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sentido</Label>
                  <Select 
                    value={formData.sentido_id} 
                    onValueChange={(v) => setFormData({ ...formData, sentido_id: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o sentido" />
                    </SelectTrigger>
                    <SelectContent>
                      {sentidos?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Conexão</Label>
                  <Select 
                    value={formData.tipo_conexao} 
                    onValueChange={(v) => setFormData({ ...formData, tipo_conexao: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Modem">Modem</SelectItem>
                      <SelectItem value="Rádio">Rádio</SelectItem>
                      <SelectItem value="Fibra">Fibra</SelectItem>
                      <SelectItem value="Satélite">Satélite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Energia</Label>
                  <Select 
                    value={formData.tipo_energia} 
                    onValueChange={(v) => setFormData({ ...formData, tipo_energia: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Convencional">Convencional</SelectItem>
                      <SelectItem value="Solar">Solar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-success" />
                </div>
                <div>
                  <CardTitle className="text-lg">Localização</CardTitle>
                  <CardDescription>Coordenadas geográficas do equipamento</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Latitude</Label>
                  <Input
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-23.5505"
                    disabled={!canEdit}
                    className="h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Longitude</Label>
                  <Input
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="-46.6333"
                    disabled={!canEdit}
                    className="h-11 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Configurações</CardTitle>
                  <CardDescription>Tipo de sinalização e sentidos associados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    id="vertical"
                    checked={formData.tem_sinalizacao_vertical}
                    onCheckedChange={(v) => setFormData({ ...formData, tem_sinalizacao_vertical: !!v })}
                    disabled={!canEdit}
                    className="h-5 w-5"
                  />
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-sm font-medium group-hover:text-foreground transition-colors">Possui Sinalização Vertical</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    id="horizontal"
                    checked={formData.tem_sinalizacao_horizontal}
                    onCheckedChange={(v) => setFormData({ ...formData, tem_sinalizacao_horizontal: !!v })}
                    disabled={!canEdit}
                    className="h-5 w-5"
                  />
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-sm font-medium group-hover:text-foreground transition-colors">Possui Sinalização Horizontal</span>
                  </div>
                </label>
              </div>

              <div className="section-divider" />

              {/* Sentido, Tipo de Conexão, Tipo de Energia */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sentido">Sentido</Label>
                  <Select 
                    value={formData.sentido_id} 
                    onValueChange={(v) => setFormData({ ...formData, sentido_id: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o sentido" />
                    </SelectTrigger>
                    <SelectContent>
                      {sentidos?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_conexao">Tipo de Conexão</Label>
                  <Select 
                    value={formData.tipo_conexao} 
                    onValueChange={(v) => setFormData({ ...formData, tipo_conexao: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Modem">Modem</SelectItem>
                      <SelectItem value="Rádio">Rádio</SelectItem>
                      <SelectItem value="Fibra">Fibra</SelectItem>
                      <SelectItem value="Satélite">Satélite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_energia">Tipo de Energia</Label>
                  <Select 
                    value={formData.tipo_energia} 
                    onValueChange={(v) => setFormData({ ...formData, tipo_energia: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Convencional">Convencional</SelectItem>
                      <SelectItem value="Solar">Solar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {canEdit && (
                <>
                  <div className="section-divider" />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSave} 
                      disabled={createEquipamento.isPending || updateEquipamento.isPending}
                      size="lg"
                      className="shadow-md hover:shadow-lg transition-shadow"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isNew ? 'Criar Equipamento' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Progresso do Equipamento */}
          {!isNew && (
            <EquipamentoProgressChart
              formData={formData}
              sinalizacaoVertical={sinalizacaoVertical}
              sinalizacaoHorizontal={sinalizacaoHorizontal}
            />
          )}
        </TabsContent>

        {/* Tab Sinalização Vertical */}
        <TabsContent value="vertical" className="space-y-6">
          {/* Card de Previsão */}
          <Card className="shadow-soft border-l-4 border-l-warning">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Previsão de Materiais</CardTitle>
                  <CardDescription>Quantidade prevista de materiais para sinalização vertical</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. Placas</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_placas}
                    onChange={(e) => setFormData({ ...formData, prev_placas: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. Pontalete</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_pontaletes}
                    onChange={(e) => setFormData({ ...formData, prev_pontaletes: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. Poste Colapsível</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_postes_colapsiveis}
                    onChange={(e) => setFormData({ ...formData, prev_postes_colapsiveis: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. Braço Projetado</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_bracos_projetados}
                    onChange={(e) => setFormData({ ...formData, prev_bracos_projetados: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. Semi Pórtico</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_semi_porticos}
                    onChange={(e) => setFormData({ ...formData, prev_semi_porticos: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
              </div>
              {canEdit && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={createEquipamento.isPending || updateEquipamento.isPending}
                    size="sm"
                    variant="outline"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Previsão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Blocos */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <ArrowUpDown className="h-5 w-5 text-success" />
                </div>
                <div>
                  <CardTitle>Blocos Instalados</CardTitle>
                  <CardDescription>Blocos de sinalização vertical do equipamento</CardDescription>
                </div>
              </div>
              {canEdit && (
                <Button onClick={() => openSVDialog()} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Bloco
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sinalizacaoVertical?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <ArrowUpDown className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum bloco de sinalização vertical cadastrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sinalizacaoVertical?.map((sv) => (
                    <Card key={sv.id} className="hover:shadow-md transition-shadow">
                       <CardContent className="p-4">
                         <div className="flex gap-4">
                           {/* Foto */}
                            {sv.foto_url && (
                             <div className="shrink-0">
                               <ImageThumbnail src={sv.foto_url} alt="Foto da sinalização" className="w-16 h-16" />
                             </div>
                            )}
                           
                           {/* Conteúdo principal */}
                           <div className="flex-1 min-w-0">
                             {/* Linha 1: Tipo, Subtipo, Sentido, Lado */}
                             <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-2 mb-3">
                               <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</span>
                                 <p className="font-semibold text-sm">{sv.tipo}</p>
                              </div>
                               <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtipo</span>
                                 <p className="font-medium text-sm">{sv.subtipo}</p>
                              </div>
                               <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sentido</span>
                                 <p className="font-medium text-sm">{sv.sentidos?.nome || '-'}</p>
                              </div>
                               <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lado</span>
                                 <Badge variant="outline" className="mt-0.5">{sv.lado}</Badge>
                              </div>
                               <div className="col-span-2 sm:col-span-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Endereço</span>
                                 <p className="font-medium text-sm truncate">{sv.endereco}</p>
                              </div>
                             </div>
                             
                             {/* Linha 2: Instalação e Quantidades */}
                             <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                               <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Instalação</span>
                                 <p className="font-medium text-sm">{sv.instalacao}</p>
                              </div>
                               <div className="flex items-center gap-3 ml-auto">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantidades</span>
                                 <div className="flex gap-2">
                                   <Badge variant="secondary" className="text-xs">{sv.qtd_pontaletes} pont.</Badge>
                                   <Badge variant="secondary" className="text-xs">{sv.qtd_perfis_metalicos} perf.</Badge>
                                   <Badge variant="secondary" className="text-xs">{sv.qtd_postes_colapsiveis} post.</Badge>
                                 </div>
                            </div>
                          </div>
                           </div>
                           
                           {/* Botões de ação */}
                          {canEdit && (
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" onClick={() => openSVDialog(sv)} className="hover:bg-primary/10 hover:text-primary">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir bloco?</AlertDialogTitle>
                                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteSV.mutate(sv.id)} className="bg-destructive hover:bg-destructive/90">
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog SV */}
          <Dialog open={svDialogOpen} onOpenChange={setSvDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-success" />
                  {editingSV ? 'Editar Bloco' : 'Novo Bloco de Sinalização Vertical'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Categoria - primeiro campo */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categoria <span className="text-destructive">*</span></Label>
                  <Select 
                    value={svForm.categoria} 
                    onValueChange={(v: 'placas' | 'braco_projetado' | 'semi_portico') => setSvForm({ ...svForm, categoria: v })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placas">Placas</SelectItem>
                      <SelectItem value="braco_projetado">Braço Projetado</SelectItem>
                      <SelectItem value="semi_portico">Semi Pórtico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sentido</Label>
                    <Select value={svForm.sentido_id} onValueChange={(v) => setSvForm({ ...svForm, sentido_id: v })}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sentidos?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Tipo {svForm.categoria === 'placas' && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      value={svForm.tipo}
                      onChange={(e) => setSvForm({ ...svForm, tipo: e.target.value })}
                      placeholder="Ex: R-19, A-25..."
                      className="h-10"
                      disabled={svForm.categoria !== 'placas'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subtipo</Label>
                    <Select 
                      value={svForm.subtipo} 
                      onValueChange={(v) => setSvForm({ ...svForm, subtipo: v })}
                      disabled={svForm.categoria !== 'placas'}
                    >
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equipamento">Equipamento</SelectItem>
                        <SelectItem value="aproximacao">Aproximação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Instalação</Label>
                    <Select value={svForm.instalacao} onValueChange={(v) => setSvForm({ ...svForm, instalacao: v })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="aerea">Aérea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Lado</Label>
                    <Select value={svForm.lado} onValueChange={(v) => setSvForm({ ...svForm, lado: v })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D">Direito</SelectItem>
                        <SelectItem value="E">Esquerdo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Data
                    </Label>
                    <Input
                      type="date"
                      value={svForm.data}
                      onChange={(e) => setSvForm({ ...svForm, data: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Total m² - apenas para Placas */}
                {svForm.categoria === 'placas' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Total m²</Label>
                    <Input
                      type="number"
                      step="any"
                      value={svForm.total_m2}
                      onChange={(e) => setSvForm({ ...svForm, total_m2: e.target.value })}
                      placeholder="Área total em m²"
                      className="h-10"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Endereço <span className="text-destructive">*</span></Label>
                  <Input
                    value={svForm.endereco}
                    onChange={(e) => setSvForm({ ...svForm, endereco: e.target.value })}
                    placeholder="Endereço da sinalização"
                    className="h-10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Latitude
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={svForm.latitude}
                      onChange={(e) => setSvForm({ ...svForm, latitude: e.target.value })}
                      placeholder="-23.550520"
                      className="h-10 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Longitude
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={svForm.longitude}
                      onChange={(e) => setSvForm({ ...svForm, longitude: e.target.value })}
                      placeholder="-46.633308"
                      className="h-10 font-mono"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className={`text-sm font-medium ${svForm.categoria !== 'placas' ? 'text-muted-foreground' : ''}`}>
                      Qtd. Pontaletes
                    </Label>
                    <Input
                      type="number"
                      value={svForm.qtd_pontaletes}
                      onChange={(e) => setSvForm({ ...svForm, qtd_pontaletes: parseInt(e.target.value) || 0 })}
                      className="h-10"
                      disabled={svForm.categoria !== 'placas'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-sm font-medium ${svForm.categoria !== 'placas' ? 'text-muted-foreground' : ''}`}>
                      Qtd. Perfis Metálicos
                    </Label>
                    <Input
                      type="number"
                      value={svForm.qtd_perfis_metalicos}
                      onChange={(e) => setSvForm({ ...svForm, qtd_perfis_metalicos: parseInt(e.target.value) || 0 })}
                      className="h-10"
                      disabled={svForm.categoria !== 'placas'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-sm font-medium ${svForm.categoria !== 'placas' ? 'text-muted-foreground' : ''}`}>
                      Qtd. Postes Colapsíveis
                    </Label>
                    <Input
                      type="number"
                      value={svForm.qtd_postes_colapsiveis}
                      onChange={(e) => setSvForm({ ...svForm, qtd_postes_colapsiveis: parseInt(e.target.value) || 0 })}
                      className="h-10"
                      disabled={svForm.categoria !== 'placas'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Image className="h-3.5 w-3.5" /> Foto
                  </Label>
                  <div className="flex gap-3 items-center">
                    {svForm.foto_url && (
                      <ImageThumbnail src={svForm.foto_url} alt="Foto da sinalização" />
                    )}
                    <Input
                      value={svForm.foto_url}
                      onChange={(e) => setSvForm({ ...svForm, foto_url: e.target.value })}
                      placeholder="URL da foto ou faça upload"
                      className="flex-1 h-10"
                    />
                    <Label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, (url) => setSvForm({ ...svForm, foto_url: url }));
                        }}
                      />
                      <Button type="button" variant="outline" size="icon" asChild className="h-10 w-10">
                        <span><Upload className="h-4 w-4" /></span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSvDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveSV}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab Sinalização Horizontal */}
        <TabsContent value="horizontal" className="space-y-6">
          {/* Card de Previsão */}
          <Card className="shadow-soft border-l-4 border-l-info">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-info" />
                </div>
                <div>
                  <CardTitle className="text-lg">Previsão de Materiais</CardTitle>
                  <CardDescription>Quantidade prevista de materiais para sinalização horizontal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. Defensa</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_defensas}
                    onChange={(e) => setFormData({ ...formData, prev_defensas: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. Postes</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_postes_horizontal}
                    onChange={(e) => setFormData({ ...formData, prev_postes_horizontal: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. TAE 80 Km/h</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_tae_80}
                    onChange={(e) => setFormData({ ...formData, prev_tae_80: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qtd. TAE 100 Km/h</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.prev_tae_100}
                    onChange={(e) => setFormData({ ...formData, prev_tae_100: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="h-10"
                  />
                </div>
              </div>
              {canEdit && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={createEquipamento.isPending || updateEquipamento.isPending}
                    size="sm"
                    variant="outline"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Previsão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Itens */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <ArrowLeftRight className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Itens Instalados</CardTitle>
                  <CardDescription>Itens de sinalização horizontal do equipamento</CardDescription>
                </div>
              </div>
              {canEdit && (
                <Button onClick={() => openSHDialog()} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sinalizacaoHorizontal?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum item de sinalização horizontal cadastrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sinalizacaoHorizontal?.map((sh) => (
                    <Card key={sh.id} className="hover:shadow-md transition-shadow">
                       <CardContent className="p-4">
                         <div className="flex gap-4">
                           {/* Foto */}
                            {sh.foto_url && (
                             <div className="shrink-0">
                               <ImageThumbnail src={sh.foto_url} alt="Foto da sinalização" className="w-16 h-16" />
                             </div>
                            )}
                           
                           {/* Conteúdo principal */}
                           <div className="flex-1 min-w-0">
                             {/* Linha 1: Tipo, Sentido, Lado, Endereço */}
                             <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-2 mb-3">
                               <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</span>
                                 <p className="font-semibold text-sm">{tipoHorizontalLabels[sh.tipo]}</p>
                              </div>
                               <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sentido</span>
                                 <p className="font-medium text-sm">{sh.sentidos?.nome || '-'}</p>
                              </div>
                               <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lado</span>
                                 <Badge variant="outline" className="mt-0.5">{sh.lado}</Badge>
                              </div>
                               <div className="col-span-2 sm:col-span-3">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Endereço</span>
                                 <p className="font-medium text-sm truncate">{sh.endereco}</p>
                              </div>
                             </div>
                             
                             {/* Linha 2: Quantidades */}
                             <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                               <div className="flex items-center gap-3 ml-auto">
                                 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantidades</span>
                                 <div className="flex gap-2">
                                   <Badge variant="secondary" className="text-xs">{sh.qtd_laminas} lâminas</Badge>
                                   <Badge variant="secondary" className="text-xs">{sh.qtd_postes} postes</Badge>
                                 </div>
                            </div>
                          </div>
                           </div>
                           
                           {/* Botões de ação */}
                          {canEdit && (
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" onClick={() => openSHDialog(sh)} className="hover:bg-primary/10 hover:text-primary">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteSH.mutate(sh.id)} className="bg-destructive hover:bg-destructive/90">
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog SH */}
          <Dialog open={shDialogOpen} onOpenChange={setShDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-warning" />
                  {editingSH ? 'Editar Item' : 'Novo Item de Sinalização Horizontal'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo <span className="text-destructive">*</span></Label>
                    <Select
                      value={shForm.tipo}
                      onValueChange={(v) => setShForm({ ...shForm, tipo: v as typeof shForm.tipo })}
                    >
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defensa_metalica">Defensa Metálica</SelectItem>
                        <SelectItem value="tae_80">TAE 80 km/h</SelectItem>
                        <SelectItem value="tae_100">TAE 100 km/h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Sentido {(shForm.tipo === 'tae_80' || shForm.tipo === 'tae_100') && <span className="text-destructive">*</span>}
                    </Label>
                    <Select value={shForm.sentido_id} onValueChange={(v) => setShForm({ ...shForm, sentido_id: v })}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sentidos?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Lado</Label>
                    <Select value={shForm.lado} onValueChange={(v) => setShForm({ ...shForm, lado: v })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D">Direito</SelectItem>
                        <SelectItem value="E">Esquerdo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Data
                    </Label>
                    <Input
                      type="date"
                      value={shForm.data}
                      onChange={(e) => setShForm({ ...shForm, data: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Qtd. Lâminas</Label>
                    <Input
                      type="number"
                      value={shForm.qtd_laminas}
                      onChange={(e) => setShForm({ ...shForm, qtd_laminas: parseInt(e.target.value) || 0 })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Qtd. Postes</Label>
                    <Input
                      type="number"
                      value={shForm.qtd_postes}
                      onChange={(e) => setShForm({ ...shForm, qtd_postes: parseInt(e.target.value) || 0 })}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Endereço <span className="text-destructive">*</span></Label>
                  <Input
                    value={shForm.endereco}
                    onChange={(e) => setShForm({ ...shForm, endereco: e.target.value })}
                    placeholder="Endereço da sinalização"
                    className="h-10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Latitude
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={shForm.latitude}
                      onChange={(e) => setShForm({ ...shForm, latitude: e.target.value })}
                      placeholder="-23.550520"
                      className="h-10 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Longitude
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={shForm.longitude}
                      onChange={(e) => setShForm({ ...shForm, longitude: e.target.value })}
                      placeholder="-46.633308"
                      className="h-10 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Image className="h-3.5 w-3.5" /> Foto
                  </Label>
                  <div className="flex gap-3 items-center">
                    {shForm.foto_url && (
                      <ImageThumbnail src={shForm.foto_url} alt="Foto da sinalização" />
                    )}
                    <Input
                      value={shForm.foto_url}
                      onChange={(e) => setShForm({ ...shForm, foto_url: e.target.value })}
                      placeholder="URL da foto ou faça upload"
                      className="flex-1 h-10"
                    />
                    <Label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, (url) => setShForm({ ...shForm, foto_url: url }));
                        }}
                      />
                      <Button type="button" variant="outline" size="icon" asChild className="h-10 w-10">
                        <span><Upload className="h-4 w-4" /></span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveSH}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab Uploads */}
        {!isNew && (
          <TabsContent value="uploads">
            <EquipamentoUploads
              equipamentoId={id!}
              canEdit={canEdit}
              projetoCroquiUrl={(equipamento as any)?.projeto_croqui_url || null}
              croquiCaracterizacaoUrl={(equipamento as any)?.croqui_caracterizacao_url || null}
              estudoViabilidadeUrl={(equipamento as any)?.estudo_viabilidade_url || null}
              relatorioVdmUrl={(equipamento as any)?.relatorio_vdm_url || null}
              onUpdate={() => {
                // Trigger refetch of equipamento data
                window.location.reload();
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
