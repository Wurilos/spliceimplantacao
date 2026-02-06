import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContratos } from '@/hooks/useContratos';
import {
  useMateriaisRecebidos,
  useCreateMaterialRecebido,
  useUpdateMaterialRecebido,
  useDeleteMaterialRecebido,
  TIPOS_MATERIAIS,
  MaterialRecebido,
} from '@/hooks/useMateriaisRecebidos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Package, Plus, Edit, Trash2, Calendar, Filter, Save } from 'lucide-react';

export default function MateriaisRecebidos() {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'operador';
  const canDelete = role === 'admin';

  const { data: contratos } = useContratos();

  // Filtros
  const [filtroContrato, setFiltroContrato] = useState<string>('all');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const { data: materiais, isLoading } = useMateriaisRecebidos({
    contratoId: filtroContrato,
    dataInicio: filtroDataInicio || undefined,
    dataFim: filtroDataFim || undefined,
  });

  const createMaterial = useCreateMaterialRecebido();
  const updateMaterial = useUpdateMaterialRecebido();
  const deleteMaterial = useDeleteMaterialRecebido();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialRecebido | null>(null);
  const [formData, setFormData] = useState({
    contrato_id: '',
    tipo_material: '',
    data_recebimento: '',
    quantidade: 1,
    observacao: '',
  });

  const openDialog = (material?: MaterialRecebido) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        contrato_id: material.contrato_id,
        tipo_material: material.tipo_material,
        data_recebimento: material.data_recebimento,
        quantidade: material.quantidade,
        observacao: material.observacao || '',
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        contrato_id: '',
        tipo_material: '',
        data_recebimento: new Date().toISOString().split('T')[0],
        quantidade: 1,
        observacao: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.contrato_id || !formData.tipo_material || !formData.data_recebimento) {
      return;
    }

    if (editingMaterial) {
      await updateMaterial.mutateAsync({ id: editingMaterial.id, ...formData });
    } else {
      await createMaterial.mutateAsync(formData);
    }
    setDialogOpen(false);
  };

  const getTipoLabel = (tipo: string) => {
    return TIPOS_MATERIAIS.find(t => t.value === tipo)?.label || tipo;
  };

  const getTipoCategoria = (tipo: string) => {
    return TIPOS_MATERIAIS.find(t => t.value === tipo)?.categoria || '';
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Sinalização Vertical':
        return 'bg-success/10 text-success border-success/20';
      case 'Sinalização Horizontal':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Infraestrutura':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Equipamento':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Agrupar tipos por categoria
  const tiposPorCategoria = TIPOS_MATERIAIS.reduce((acc, tipo) => {
    if (!acc[tipo.categoria]) {
      acc[tipo.categoria] = [];
    }
    acc[tipo.categoria].push(tipo);
    return acc;
  }, {} as Record<string, typeof TIPOS_MATERIAIS>);

  const clearFilters = () => {
    setFiltroContrato('all');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Materiais Recebidos</h1>
            <p className="page-description">Controle de recebimento de materiais por contrato</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => openDialog()} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Recebimento
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contrato</Label>
              <Select value={filtroContrato} onValueChange={setFiltroContrato}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todos os contratos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os contratos</SelectItem>
                  {contratos?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id_contrato} - {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Início</Label>
              <Input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Fim</Label>
              <Input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="h-10">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Registros de Recebimento</CardTitle>
          <CardDescription>
            {materiais?.length || 0} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : materiais?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum material recebido encontrado</p>
              {canEdit && (
                <Button variant="outline" className="mt-4" onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primeiro Recebimento
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Contrato</TableHead>
                    <TableHead className="font-semibold">Tipo de Material</TableHead>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold text-center">Quantidade</TableHead>
                    <TableHead className="font-semibold">Observação</TableHead>
                    {(canEdit || canDelete) && (
                      <TableHead className="font-semibold text-center">Ações</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiais?.map((material) => (
                    <TableRow key={material.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(material.data_recebimento).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {material.contratos?.id_contrato}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getTipoLabel(material.tipo_material)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getCategoriaColor(getTipoCategoria(material.tipo_material))}>
                          {getTipoCategoria(material.tipo_material)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-lg font-bold">{material.quantidade}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {material.observacao || '-'}
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            {canEdit && (
                              <Button size="sm" variant="ghost" onClick={() => openDialog(material)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMaterial.mutate(material.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Editar Recebimento' : 'Novo Recebimento de Material'}</DialogTitle>
            <DialogDescription>
              {editingMaterial ? 'Edite as informações do recebimento' : 'Registre um novo recebimento de material'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contrato <span className="text-destructive">*</span></Label>
              <Select
                value={formData.contrato_id}
                onValueChange={(value) => setFormData({ ...formData, contrato_id: value })}
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
              <Label>Tipo de Material <span className="text-destructive">*</span></Label>
              <Select
                value={formData.tipo_material}
                onValueChange={(value) => setFormData({ ...formData, tipo_material: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tiposPorCategoria).map(([categoria, tipos]) => (
                    <div key={categoria}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {categoria}
                      </div>
                      {tipos.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Recebimento <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={formData.data_recebimento}
                  onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                placeholder="Observações adicionais..."
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.contrato_id || !formData.tipo_material || !formData.data_recebimento || createMaterial.isPending || updateMaterial.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingMaterial ? 'Salvar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
