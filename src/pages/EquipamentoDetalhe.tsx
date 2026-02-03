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
import { ArrowLeft, Plus, X, Save, Trash2, Edit, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
      // Adicionar sentidos pendentes ao novo equipamento
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

    // Sentido obrigatório para TAE
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
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/equipamentos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? 'Novo Equipamento' : `Equipamento ${equipamento?.numero_serie}`}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? 'Cadastre um novo equipamento' : 'Visualize e edite os dados do equipamento'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados do Equipamento</TabsTrigger>
          {formData.tem_sinalizacao_vertical && (
            <TabsTrigger value="vertical">Sinalização Vertical</TabsTrigger>
          )}
          {formData.tem_sinalizacao_horizontal && (
            <TabsTrigger value="horizontal">Sinalização Horizontal</TabsTrigger>
          )}
        </TabsList>

        {/* Tab Dados */}
        <TabsContent value="dados">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Equipamento</CardTitle>
              <CardDescription>Informações básicas do equipamento de radar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contrato *</Label>
                  <Select
                    value={formData.contrato_id}
                    onValueChange={(v) => setFormData({ ...formData, contrato_id: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
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
                  <Label>Nº Série *</Label>
                  <Input
                    value={formData.numero_serie}
                    onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                    placeholder="Número de série"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Município *</Label>
                  <Input
                    value={formData.municipio}
                    onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                    placeholder="Município"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço *</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Endereço completo"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-23.550520"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="-46.633308"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Equipamento</Label>
                  <Select
                    value={formData.tipo_equipamento}
                    onValueChange={(v) => setFormData({ ...formData, tipo_equipamento: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>Quantidade de Faixas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantidade_faixas}
                    onChange={(e) => setFormData({ ...formData, quantidade_faixas: parseInt(e.target.value) || 1 })}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vertical"
                    checked={formData.tem_sinalizacao_vertical}
                    onCheckedChange={(v) => setFormData({ ...formData, tem_sinalizacao_vertical: !!v })}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="vertical">Possui Sinalização Vertical</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="horizontal"
                    checked={formData.tem_sinalizacao_horizontal}
                    onCheckedChange={(v) => setFormData({ ...formData, tem_sinalizacao_horizontal: !!v })}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="horizontal">Possui Sinalização Horizontal</Label>
                </div>
              </div>

              {/* Sentidos do equipamento */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Sentidos do Equipamento</Label>
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
                        <SelectTrigger className="w-40">
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
                        <Button size="sm" onClick={handleAddSentido} disabled={!selectedSentidoToAdd}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      <Dialog open={sentidoDialogOpen} onOpenChange={setSentidoDialogOpen}>
                        <Button size="sm" variant="outline" onClick={() => setSentidoDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Novo
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Criar Novo Sentido</DialogTitle>
                            <DialogDescription>Adicione um novo sentido ao sistema</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Nome do sentido</Label>
                              <Input
                                value={newSentidoNome}
                                onChange={(e) => setNewSentidoNome(e.target.value)}
                                placeholder="Ex: Norte, Sul..."
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
                <div className="flex flex-wrap gap-2">
                  {isNew ? (
                    <>
                      {pendingSentidos.map((sentidoId) => {
                        const sentido = sentidos?.find(s => s.id === sentidoId);
                        return (
                          <Badge key={sentidoId} variant="secondary" className="gap-1">
                            {sentido?.nome}
                            {canEdit && (
                              <button 
                                onClick={() => setPendingSentidos(pendingSentidos.filter(id => id !== sentidoId))} 
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
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
                        <Badge key={es.id} variant="secondary" className="gap-1">
                          {es.sentidos?.nome}
                          {es.is_principal && <span className="text-xs">(principal)</span>}
                          {canEdit && (
                            <button onClick={() => removeSentido.mutate(es.id)} className="ml-1 hover:text-destructive">
                              <X className="h-3 w-3" />
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
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSave} disabled={createEquipamento.isPending || updateEquipamento.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {isNew ? 'Criar Equipamento' : 'Salvar Alterações'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Sinalização Vertical */}
        <TabsContent value="vertical">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sinalização Vertical</CardTitle>
                <CardDescription>Blocos de sinalização vertical do equipamento</CardDescription>
              </div>
              {canEdit && (
                <Button onClick={() => openSVDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Bloco
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sinalizacaoVertical?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum bloco de sinalização vertical cadastrado
                </div>
              ) : (
                <div className="space-y-4">
                  {sinalizacaoVertical?.map((sv) => (
                    <Card key={sv.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="grid gap-2 md:grid-cols-4 flex-1">
                            <div>
                              <span className="text-sm text-muted-foreground">Tipo:</span>
                              <p className="font-medium">{sv.tipo}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Subtipo:</span>
                              <p className="font-medium">{sv.subtipo}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Sentido:</span>
                              <p className="font-medium">{sv.sentidos?.nome || '-'}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Lado:</span>
                              <p className="font-medium">{sv.lado}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Endereço:</span>
                              <p className="font-medium">{sv.endereco}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Instalação:</span>
                              <p className="font-medium">{sv.instalacao}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Quantidades:</span>
                              <p className="font-medium text-sm">
                                {sv.qtd_pontaletes} pont. / {sv.qtd_perfis_metalicos} perf. / {sv.qtd_postes_colapsiveis} post.
                              </p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex gap-2 ml-4">
                              <Button variant="ghost" size="icon" onClick={() => openSVDialog(sv)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir bloco?</AlertDialogTitle>
                                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteSV.mutate(sv.id)}>Excluir</AlertDialogAction>
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSV ? 'Editar Bloco' : 'Novo Bloco de Sinalização Vertical'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sentido</Label>
                  <Select value={svForm.sentido_id} onValueChange={(v) => setSvForm({ ...svForm, sentido_id: v })}>
                    <SelectTrigger>
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
                  <Label>Endereço *</Label>
                  <Input
                    value={svForm.endereco}
                    onChange={(e) => setSvForm({ ...svForm, endereco: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Input
                    value={svForm.tipo}
                    onChange={(e) => setSvForm({ ...svForm, tipo: e.target.value })}
                    placeholder="Ex: R-19, A-25..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtipo</Label>
                  <Select value={svForm.subtipo} onValueChange={(v) => setSvForm({ ...svForm, subtipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipamento">Equipamento</SelectItem>
                      <SelectItem value="aproximacao">Aproximação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Instalação</Label>
                  <Select value={svForm.instalacao} onValueChange={(v) => setSvForm({ ...svForm, instalacao: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="aerea">Aérea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lado</Label>
                  <Select value={svForm.lado} onValueChange={(v) => setSvForm({ ...svForm, lado: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="D">Direito</SelectItem>
                      <SelectItem value="E">Esquerdo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={svForm.latitude}
                    onChange={(e) => setSvForm({ ...svForm, latitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={svForm.longitude}
                    onChange={(e) => setSvForm({ ...svForm, longitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qtd. Pontaletes</Label>
                  <Input
                    type="number"
                    value={svForm.qtd_pontaletes}
                    onChange={(e) => setSvForm({ ...svForm, qtd_pontaletes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qtd. Perfis Metálicos</Label>
                  <Input
                    type="number"
                    value={svForm.qtd_perfis_metalicos}
                    onChange={(e) => setSvForm({ ...svForm, qtd_perfis_metalicos: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qtd. Postes Colapsíveis</Label>
                  <Input
                    type="number"
                    value={svForm.qtd_postes_colapsiveis}
                    onChange={(e) => setSvForm({ ...svForm, qtd_postes_colapsiveis: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={svForm.data}
                    onChange={(e) => setSvForm({ ...svForm, data: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foto</Label>
                  <div className="flex gap-2">
                    <Input
                      value={svForm.foto_url}
                      onChange={(e) => setSvForm({ ...svForm, foto_url: e.target.value })}
                      placeholder="URL da foto"
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
                      <Button type="button" variant="outline" size="icon" asChild>
                        <span><Upload className="h-4 w-4" /></span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSV}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab Sinalização Horizontal */}
        <TabsContent value="horizontal">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sinalização Horizontal</CardTitle>
                <CardDescription>Itens de sinalização horizontal do equipamento</CardDescription>
              </div>
              {canEdit && (
                <Button onClick={() => openSHDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sinalizacaoHorizontal?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum item de sinalização horizontal cadastrado
                </div>
              ) : (
                <div className="space-y-4">
                  {sinalizacaoHorizontal?.map((sh) => (
                    <Card key={sh.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="grid gap-2 md:grid-cols-4 flex-1">
                            <div>
                              <span className="text-sm text-muted-foreground">Tipo:</span>
                              <p className="font-medium">{tipoHorizontalLabels[sh.tipo]}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Sentido:</span>
                              <p className="font-medium">{sh.sentidos?.nome || '-'}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Lado:</span>
                              <p className="font-medium">{sh.lado}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Endereço:</span>
                              <p className="font-medium">{sh.endereco}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Lâminas:</span>
                              <p className="font-medium">{sh.qtd_laminas}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Postes:</span>
                              <p className="font-medium">{sh.qtd_postes}</p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex gap-2 ml-4">
                              <Button variant="ghost" size="icon" onClick={() => openSHDialog(sh)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteSH.mutate(sh.id)}>Excluir</AlertDialogAction>
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSH ? 'Editar Item' : 'Novo Item de Sinalização Horizontal'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={shForm.tipo}
                    onValueChange={(v) => setShForm({ ...shForm, tipo: v as typeof shForm.tipo })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defensa_metalica">Defensa Metálica</SelectItem>
                      <SelectItem value="tae_80">TAE 80 km/h</SelectItem>
                      <SelectItem value="tae_100">TAE 100 km/h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sentido {(shForm.tipo === 'tae_80' || shForm.tipo === 'tae_100') && '*'}</Label>
                  <Select value={shForm.sentido_id} onValueChange={(v) => setShForm({ ...shForm, sentido_id: v })}>
                    <SelectTrigger>
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
                  <Label>Endereço *</Label>
                  <Input
                    value={shForm.endereco}
                    onChange={(e) => setShForm({ ...shForm, endereco: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lado</Label>
                  <Select value={shForm.lado} onValueChange={(v) => setShForm({ ...shForm, lado: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="D">Direito</SelectItem>
                      <SelectItem value="E">Esquerdo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={shForm.latitude}
                    onChange={(e) => setShForm({ ...shForm, latitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={shForm.longitude}
                    onChange={(e) => setShForm({ ...shForm, longitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qtd. Lâminas</Label>
                  <Input
                    type="number"
                    value={shForm.qtd_laminas}
                    onChange={(e) => setShForm({ ...shForm, qtd_laminas: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qtd. Postes</Label>
                  <Input
                    type="number"
                    value={shForm.qtd_postes}
                    onChange={(e) => setShForm({ ...shForm, qtd_postes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={shForm.data}
                    onChange={(e) => setShForm({ ...shForm, data: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Foto</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shForm.foto_url}
                      onChange={(e) => setShForm({ ...shForm, foto_url: e.target.value })}
                      placeholder="URL da foto"
                      className="flex-1"
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
                      <Button type="button" variant="outline" size="icon" asChild>
                        <span><Upload className="h-4 w-4" /></span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSH}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
