import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContratos } from '@/hooks/useContratos';
import { useSentidos, useCreateSentido } from '@/hooks/useSentidos';
import {
  useEquipamento,
  useEquipamentoSentidos,
  useCreateEquipamento,
  useUpdateEquipamento,
  useAddEquipamentoSentido,
  useRemoveEquipamentoSentido,
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
import { ArrowLeft, Plus, X, Save, Trash2, Edit, Upload, Radio, MapPin, Settings, ArrowUpDown, ArrowLeftRight, Calendar, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImageThumbnail } from '@/components/ImageThumbnail';

export default function EquipamentoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, canDelete } = useAuth();
  const { toast } = useToast();
  const isNew = id === 'novo';

  const { data: contratos } = useContratos();
  const { data: sentidos } = useSentidos();
  const { data: equipamento, isLoading } = useEquipamento(isNew ? undefined : id);
  const { data: equipamentoSentidos } = useEquipamentoSentidos(isNew ? undefined : id);
  const { data: sinalizacaoVertical } = useSinalizacaoVertical(isNew ? undefined : id);
  const { data: sinalizacaoHorizontal } = useSinalizacaoHorizontal(isNew ? undefined : id);

  const createEquipamento = useCreateEquipamento();
  const updateEquipamento = useUpdateEquipamento();
  const addSentido = useAddEquipamentoSentido();
  const removeSentido = useRemoveEquipamentoSentido();
  const createSentido = useCreateSentido();

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
  });

  // Dialog states
  const [sentidoDialogOpen, setSentidoDialogOpen] = useState(false);
  const [newSentidoNome, setNewSentidoNome] = useState('');
  const [selectedSentidoToAdd, setSelectedSentidoToAdd] = useState<string>('');
  const [pendingSentidos, setPendingSentidos] = useState<string[]>([]);

  const [svDialogOpen, setSvDialogOpen] = useState(false);
  const [editingSV, setEditingSV] = useState<SinalizacaoVertical | null>(null);
  const [svForm, setSvForm] = useState({
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
    };

    if (isNew) {
      const result = await createEquipamento.mutateAsync(data);
      for (const sentidoId of pendingSentidos) {
        await addSentido.mutateAsync({ equipamento_id: result.id, sentido_id: sentidoId });
      }
      navigate(`/equipamentos/${result.id}`);
    } else {
      await updateEquipamento.mutateAsync({ id: id!, ...data });
    }
  };

  const handleAddSentido = async () => {
    if (!selectedSentidoToAdd || !id) return;
    await addSentido.mutateAsync({ equipamento_id: id, sentido_id: selectedSentidoToAdd });
    setSelectedSentidoToAdd('');
  };

  const handleCreateSentido = async () => {
    if (!newSentidoNome) return;
    const result = await createSentido.mutateAsync({ nome: newSentidoNome });
    setNewSentidoNome('');
    setSentidoDialogOpen(false);
    if (result.id) {
      if (isNew) {
        setPendingSentidos([...pendingSentidos, result.id]);
      } else if (id) {
        await addSentido.mutateAsync({ equipamento_id: id, sentido_id: result.id });
      }
    }
  };

  // Sinalização Vertical handlers
  const openSVDialog = (sv?: SinalizacaoVertical) => {
    if (sv) {
      setEditingSV(sv);
      setSvForm({
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
      });
    } else {
      setEditingSV(null);
      setSvForm({
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
      });
    }
    setSvDialogOpen(true);
  };

  const handleSaveSV = async () => {
    if (!id || !svForm.endereco || !svForm.tipo) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const data = {
      equipamento_id: id,
      sentido_id: svForm.sentido_id || null,
      endereco: svForm.endereco,
      tipo: svForm.tipo,
      subtipo: svForm.subtipo,
      instalacao: svForm.instalacao,
      lado: svForm.lado,
      latitude: svForm.latitude ? parseFloat(svForm.latitude) : null,
      longitude: svForm.longitude ? parseFloat(svForm.longitude) : null,
      foto_url: svForm.foto_url || null,
      qtd_pontaletes: svForm.qtd_pontaletes,
      qtd_perfis_metalicos: svForm.qtd_perfis_metalicos,
      qtd_postes_colapsiveis: svForm.qtd_postes_colapsiveis,
      data: svForm.data || null,
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

  const availableSentidosToAdd = sentidos?.filter(
    (s) => !equipamentoSentidos?.some((es) => es.sentido_id === s.id)
  );

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
        <TabsList className="bg-muted/50 p-1 h-auto">
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
                      <SelectItem value="fixo">Fixo</SelectItem>
                      <SelectItem value="movel">Móvel</SelectItem>
                      <SelectItem value="portatil">Portátil</SelectItem>
                      <SelectItem value="estacionario">Estacionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="sm:col-span-2 lg:col-span-1 space-y-2">
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
                <div className="sm:col-span-2 lg:col-span-1 space-y-2">
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
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-23.550520"
                    disabled={!canEdit}
                    className="h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="-46.633308"
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

              {/* Sentidos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Sentidos do Equipamento</Label>
                    <p className="text-sm text-muted-foreground">Direções de fiscalização do radar</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Select 
                        value={selectedSentidoToAdd} 
                        onValueChange={(value) => {
                          if (isNew) {
                            if (!pendingSentidos.includes(value)) {
                              setPendingSentidos([...pendingSentidos, value]);
                            }
                          } else {
                            setSelectedSentidoToAdd(value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-44 h-10">
                          <SelectValue placeholder="Adicionar sentido" />
                        </SelectTrigger>
                        <SelectContent>
                          {isNew 
                            ? sentidos?.filter(s => !pendingSentidos.includes(s.id)).map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                              ))
                            : availableSentidosToAdd?.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                      {!isNew && (
                        <Button size="sm" onClick={handleAddSentido} disabled={!selectedSentidoToAdd} className="h-10 px-4">
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      <Dialog open={sentidoDialogOpen} onOpenChange={setSentidoDialogOpen}>
                        <Button size="sm" variant="outline" onClick={() => setSentidoDialogOpen(true)} className="h-10">
                          <Plus className="h-4 w-4 mr-1" />
                          Novo
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Criar Novo Sentido</DialogTitle>
                            <DialogDescription>Adicione um novo sentido ao sistema</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Nome do sentido</Label>
                              <Input
                                value={newSentidoNome}
                                onChange={(e) => setNewSentidoNome(e.target.value)}
                                placeholder="Ex: Norte, Sul..."
                                className="h-11"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateSentido} disabled={!newSentidoNome}>
                              Criar e Adicionar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-muted/30 rounded-lg border border-dashed">
                  {isNew ? (
                    <>
                      {pendingSentidos.map((sentidoId) => {
                        const sentido = sentidos?.find(s => s.id === sentidoId);
                        return (
                          <Badge key={sentidoId} variant="secondary" className="gap-2 px-3 py-1.5 text-sm">
                            {sentido?.nome}
                            {canEdit && (
                              <button 
                                onClick={() => setPendingSentidos(pendingSentidos.filter(id => id !== sentidoId))} 
                                className="hover:text-destructive transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </Badge>
                        );
                      })}
                      {pendingSentidos.length === 0 && (
                        <span className="text-sm text-muted-foreground">Nenhum sentido selecionado</span>
                      )}
                    </>
                  ) : (
                    <>
                      {equipamentoSentidos?.map((es) => (
                        <Badge key={es.id} variant="secondary" className="gap-2 px-3 py-1.5 text-sm">
                          {es.sentidos?.nome}
                          {es.is_principal && <span className="text-xs opacity-70">(principal)</span>}
                          {canEdit && (
                            <button onClick={() => removeSentido.mutate(es.id)} className="hover:text-destructive transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {(!equipamentoSentidos || equipamentoSentidos.length === 0) && (
                        <span className="text-sm text-muted-foreground">Nenhum sentido adicionado</span>
                      )}
                    </>
                  )}
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
        </TabsContent>

        {/* Tab Sinalização Vertical */}
        <TabsContent value="vertical">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <ArrowUpDown className="h-5 w-5 text-success" />
                </div>
                <div>
                  <CardTitle>Sinalização Vertical</CardTitle>
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
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-4 flex-1">
                            {sv.foto_url && (
                              <ImageThumbnail src={sv.foto_url} alt="Foto da sinalização" />
                            )}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 flex-1">
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</span>
                                <p className="font-semibold">{sv.tipo}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtipo</span>
                                <p className="font-medium">{sv.subtipo}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sentido</span>
                                <p className="font-medium">{sv.sentidos?.nome || '-'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lado</span>
                                <Badge variant="outline">{sv.lado === 'D' ? 'Direito' : 'Esquerdo'}</Badge>
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Endereço</span>
                                <p className="font-medium text-sm">{sv.endereco}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Instalação</span>
                                <p className="font-medium">{sv.instalacao}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantidades</span>
                                <p className="font-medium text-sm">
                                  {sv.qtd_pontaletes} pont. / {sv.qtd_perfis_metalicos} perf. / {sv.qtd_postes_colapsiveis} post.
                                </p>
                              </div>
                            </div>
                          </div>
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
                    <Label className="text-sm font-medium">Tipo <span className="text-destructive">*</span></Label>
                    <Input
                      value={svForm.tipo}
                      onChange={(e) => setSvForm({ ...svForm, tipo: e.target.value })}
                      placeholder="Ex: R-19, A-25..."
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subtipo</Label>
                    <Select value={svForm.subtipo} onValueChange={(v) => setSvForm({ ...svForm, subtipo: v })}>
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
                    <Label className="text-sm font-medium">Qtd. Pontaletes</Label>
                    <Input
                      type="number"
                      value={svForm.qtd_pontaletes}
                      onChange={(e) => setSvForm({ ...svForm, qtd_pontaletes: parseInt(e.target.value) || 0 })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Qtd. Perfis Metálicos</Label>
                    <Input
                      type="number"
                      value={svForm.qtd_perfis_metalicos}
                      onChange={(e) => setSvForm({ ...svForm, qtd_perfis_metalicos: parseInt(e.target.value) || 0 })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Qtd. Postes Colapsíveis</Label>
                    <Input
                      type="number"
                      value={svForm.qtd_postes_colapsiveis}
                      onChange={(e) => setSvForm({ ...svForm, qtd_postes_colapsiveis: parseInt(e.target.value) || 0 })}
                      className="h-10"
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
        <TabsContent value="horizontal">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <ArrowLeftRight className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Sinalização Horizontal</CardTitle>
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
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-4 flex-1">
                            {sh.foto_url && (
                              <ImageThumbnail src={sh.foto_url} alt="Foto da sinalização" />
                            )}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 flex-1">
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</span>
                                <p className="font-semibold">{tipoHorizontalLabels[sh.tipo]}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sentido</span>
                                <p className="font-medium">{sh.sentidos?.nome || '-'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lado</span>
                                <Badge variant="outline">{sh.lado === 'D' ? 'Direito' : 'Esquerdo'}</Badge>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Endereço</span>
                                <p className="font-medium text-sm">{sh.endereco}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lâminas</span>
                                <p className="font-semibold text-lg">{sh.qtd_laminas}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Postes</span>
                                <p className="font-semibold text-lg">{sh.qtd_postes}</p>
                              </div>
                            </div>
                          </div>
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
      </Tabs>
    </div>
  );
}
