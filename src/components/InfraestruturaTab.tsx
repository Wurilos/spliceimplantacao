 import { useState, useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
 import { Badge } from '@/components/ui/badge';
 import { Plus, Save, Trash2, Edit, Calendar, Image, TrendingUp, Wrench, Upload } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { ImageThumbnail } from '@/components/ImageThumbnail';
 import { useToast } from '@/hooks/use-toast';
 import {
   useInfraestruturaItens,
   useCreateInfraestruturaItem,
   useUpdateInfraestruturaItem,
   useDeleteInfraestruturaItem,
   InfraestruturaItem,
 } from '@/hooks/useInfraestrutura';
 
 interface InfraestruturaTabProps {
   equipamentoId: string;
   canEdit: boolean;
   canDelete: boolean;
   formData: {
     prev_bases: number;
     prev_lacos: number;
     prev_postes_infra: number;
     prev_conectorizacao: number;
     prev_ajustes: number;
     prev_afericao: number;
   };
   onFormDataChange: (data: Partial<InfraestruturaTabProps['formData']>) => void;
   onSave: () => void;
   isSaving: boolean;
 }
 
 const INFRA_TIPOS = [
   { value: 'bases', label: 'Bases' },
   { value: 'lacos', label: 'Laços' },
   { value: 'postes', label: 'Postes' },
   { value: 'conectorizacao', label: 'Conectorização' },
   { value: 'ajustes', label: 'Ajustes' },
   { value: 'afericao', label: 'Aferição' },
 ] as const;
 
 type InfraTipo = typeof INFRA_TIPOS[number]['value'];
 
 export function InfraestruturaTab({
   equipamentoId,
   canEdit,
   canDelete,
   formData,
   onFormDataChange,
   onSave,
   isSaving,
 }: InfraestruturaTabProps) {
   const { toast } = useToast();
   const { data: itens } = useInfraestruturaItens(equipamentoId);
   const createItem = useCreateInfraestruturaItem();
   const updateItem = useUpdateInfraestruturaItem();
   const deleteItem = useDeleteInfraestruturaItem();
 
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingItem, setEditingItem] = useState<InfraestruturaItem | null>(null);
   const [itemForm, setItemForm] = useState({
     tipo: 'bases' as InfraTipo,
     quantidade: 1,
     data: '',
     foto_url: '',
   });
   const [uploadingPhoto, setUploadingPhoto] = useState(false);
 
   // Calculate installed totals per type
   const instaladoPorTipo = useMemo(() => {
     const totals: Record<InfraTipo, number> = {
       bases: 0,
       lacos: 0,
       postes: 0,
       conectorizacao: 0,
       ajustes: 0,
       afericao: 0,
     };
     itens?.forEach((item) => {
       if (totals[item.tipo as InfraTipo] !== undefined) {
         totals[item.tipo as InfraTipo] += item.quantidade;
       }
     });
     return totals;
   }, [itens]);
 
   const openDialog = (item?: InfraestruturaItem) => {
     if (item) {
       setEditingItem(item);
       setItemForm({
         tipo: item.tipo as InfraTipo,
         quantidade: item.quantidade,
         data: item.data || '',
         foto_url: item.foto_url || '',
       });
     } else {
       setEditingItem(null);
       setItemForm({
         tipo: 'bases',
         quantidade: 1,
         data: '',
         foto_url: '',
       });
     }
     setDialogOpen(true);
   };
 
   const handleSaveItem = async () => {
     if (!equipamentoId || itemForm.quantidade < 1) {
       toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
       return;
     }
 
     const data = {
       equipamento_id: equipamentoId,
       tipo: itemForm.tipo,
       quantidade: itemForm.quantidade,
       data: itemForm.data || null,
       foto_url: itemForm.foto_url || null,
     };
 
     if (editingItem) {
       await updateItem.mutateAsync({ id: editingItem.id, ...data });
     } else {
       await createItem.mutateAsync(data);
     }
     setDialogOpen(false);
   };
 
   const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     setUploadingPhoto(true);
     try {
       const fileExt = file.name.split('.').pop();
       const fileName = `${equipamentoId}/${Date.now()}.${fileExt}`;
       
       const { error: uploadError } = await supabase.storage
         .from('fotos')
         .upload(fileName, file);
 
       if (uploadError) throw uploadError;
 
       const { data: { publicUrl } } = supabase.storage
         .from('fotos')
         .getPublicUrl(fileName);
 
       setItemForm({ ...itemForm, foto_url: publicUrl });
       toast({ title: 'Foto enviada com sucesso!' });
     } catch (error: any) {
       toast({ title: 'Erro ao enviar foto', description: error.message, variant: 'destructive' });
     } finally {
       setUploadingPhoto(false);
     }
   };
 
   const getTipoLabel = (tipo: string) => {
     return INFRA_TIPOS.find(t => t.value === tipo)?.label || tipo;
   };
 
   const previsaoMap: Record<InfraTipo, keyof typeof formData> = {
     bases: 'prev_bases',
     lacos: 'prev_lacos',
     postes: 'prev_postes_infra',
     conectorizacao: 'prev_conectorizacao',
     ajustes: 'prev_ajustes',
     afericao: 'prev_afericao',
   };
 
   return (
     <div className="space-y-6">
       {/* Card de Previsão */}
       <Card className="shadow-soft border-l-4 border-l-warning">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
               <TrendingUp className="h-4 w-4 text-warning" />
             </div>
             <div>
               <CardTitle className="text-lg">Previsão de Infraestrutura</CardTitle>
               <CardDescription>Quantidade prevista de itens para infraestrutura</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
             <div className="space-y-2">
               <Label className="text-sm font-medium">Qtd. Bases</Label>
               <Input
                 type="number"
                 min="0"
                 value={formData.prev_bases}
                 onChange={(e) => onFormDataChange({ prev_bases: parseInt(e.target.value) || 0 })}
                 disabled={!canEdit}
                 className="h-10"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Qtd. Laços</Label>
               <Input
                 type="number"
                 min="0"
                 value={formData.prev_lacos}
                 onChange={(e) => onFormDataChange({ prev_lacos: parseInt(e.target.value) || 0 })}
                 disabled={!canEdit}
                 className="h-10"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Qtd. Postes</Label>
               <Input
                 type="number"
                 min="0"
                 value={formData.prev_postes_infra}
                 onChange={(e) => onFormDataChange({ prev_postes_infra: parseInt(e.target.value) || 0 })}
                 disabled={!canEdit}
                 className="h-10"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Conectorização</Label>
               <Input
                 type="number"
                 min="0"
                 value={formData.prev_conectorizacao}
                 onChange={(e) => onFormDataChange({ prev_conectorizacao: parseInt(e.target.value) || 0 })}
                 disabled={!canEdit}
                 className="h-10"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Ajustes</Label>
               <Input
                 type="number"
                 min="0"
                 value={formData.prev_ajustes}
                 onChange={(e) => onFormDataChange({ prev_ajustes: parseInt(e.target.value) || 0 })}
                 disabled={!canEdit}
                 className="h-10"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-sm font-medium">Aferição</Label>
               <Input
                 type="number"
                 min="0"
                 value={formData.prev_afericao}
                 onChange={(e) => onFormDataChange({ prev_afericao: parseInt(e.target.value) || 0 })}
                 disabled={!canEdit}
                 className="h-10"
               />
             </div>
           </div>
           {canEdit && (
             <div className="flex justify-end mt-4">
               <Button 
                 onClick={onSave} 
                 disabled={isSaving}
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
 
       {/* Card de Resumo */}
       <Card className="shadow-soft">
         <CardHeader className="pb-4">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
               <Wrench className="h-4 w-4 text-primary" />
             </div>
             <div>
               <CardTitle className="text-lg">Resumo de Execução</CardTitle>
               <CardDescription>Comparativo entre previsto e executado</CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
             {INFRA_TIPOS.map(({ value, label }) => {
               const previsto = formData[previsaoMap[value]];
               const instalado = instaladoPorTipo[value];
               const percentual = previsto > 0 ? Math.round((instalado / previsto) * 100) : 0;
               
               return (
                 <div key={value} className="p-3 rounded-lg border bg-card">
                   <div className="text-sm font-medium text-muted-foreground">{label}</div>
                   <div className="flex items-baseline gap-2 mt-1">
                     <span className="text-2xl font-bold">{instalado}</span>
                     <span className="text-sm text-muted-foreground">/ {previsto}</span>
                   </div>
                   <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                     <div 
                       className={`h-full transition-all ${percentual >= 100 ? 'bg-success' : 'bg-primary'}`}
                       style={{ width: `${Math.min(percentual, 100)}%` }}
                     />
                   </div>
                 </div>
               );
             })}
           </div>
         </CardContent>
       </Card>
 
       {/* Card de Itens Executados */}
       <Card className="shadow-soft">
         <CardHeader className="flex flex-row items-center justify-between pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
               <Wrench className="h-5 w-5 text-success" />
             </div>
             <div>
               <CardTitle>Itens Executados</CardTitle>
               <CardDescription>Registro de infraestrutura instalada</CardDescription>
             </div>
           </div>
           {canEdit && (
             <Button onClick={() => openDialog()} className="shadow-sm">
               <Plus className="h-4 w-4 mr-2" />
               Adicionar Item
             </Button>
           )}
         </CardHeader>
         <CardContent>
           {itens?.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
               <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
               <p>Nenhum item de infraestrutura registrado</p>
             </div>
           ) : (
             <div className="space-y-4">
               {itens?.map((item) => (
                 <Card key={item.id} className="hover:shadow-md transition-shadow">
                   <CardContent className="p-4">
                     <div className="flex gap-4">
                       {item.foto_url && (
                         <ImageThumbnail src={item.foto_url} alt={getTipoLabel(item.tipo)} />
                       )}
                       <div className="flex-1 min-w-0">
                         <div className="flex items-start justify-between gap-2">
                           <div>
                             <div className="flex items-center gap-2 mb-1">
                               <Badge variant="outline">{getTipoLabel(item.tipo)}</Badge>
                               <Badge variant="secondary">Qtd: {item.quantidade}</Badge>
                             </div>
                             {item.data && (
                               <p className="text-sm text-muted-foreground flex items-center gap-1">
                                 <Calendar className="h-3 w-3" />
                                 {new Date(item.data).toLocaleDateString('pt-BR')}
                               </p>
                             )}
                           </div>
                           {(canEdit || canDelete) && (
                             <div className="flex gap-1">
                               {canEdit && (
                                 <Button size="sm" variant="ghost" onClick={() => openDialog(item)}>
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
                                       <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                                       <AlertDialogDescription>
                                         Esta ação não pode ser desfeita.
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                       <AlertDialogAction 
                                         onClick={() => deleteItem.mutate(item.id)}
                                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                       >
                                         Excluir
                                       </AlertDialogAction>
                                     </AlertDialogFooter>
                                   </AlertDialogContent>
                                 </AlertDialog>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Dialog para adicionar/editar item */}
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent className="sm:max-w-lg">
           <DialogHeader>
             <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item de Infraestrutura'}</DialogTitle>
             <DialogDescription>
               {editingItem ? 'Edite as informações do item' : 'Preencha os dados do novo item'}
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Tipo <span className="text-destructive">*</span></Label>
               <select
                 value={itemForm.tipo}
                 onChange={(e) => setItemForm({ ...itemForm, tipo: e.target.value as InfraTipo })}
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
               >
                 {INFRA_TIPOS.map(({ value, label }) => (
                   <option key={value} value={value}>{label}</option>
                 ))}
               </select>
             </div>
             <div className="space-y-2">
               <Label>Quantidade <span className="text-destructive">*</span></Label>
               <Input
                 type="number"
                 min="1"
                 value={itemForm.quantidade}
                 onChange={(e) => setItemForm({ ...itemForm, quantidade: parseInt(e.target.value) || 1 })}
               />
             </div>
             <div className="space-y-2">
               <Label className="flex items-center gap-2">
                 <Calendar className="h-4 w-4" />
                 Data de Execução
               </Label>
               <Input
                 type="date"
                 value={itemForm.data}
                 onChange={(e) => setItemForm({ ...itemForm, data: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <Label className="flex items-center gap-2">
                 <Image className="h-4 w-4" />
                 Foto
               </Label>
               <div className="flex gap-2">
                 <Input
                   type="file"
                   accept="image/*"
                   onChange={handlePhotoUpload}
                   disabled={uploadingPhoto}
                   className="flex-1"
                 />
                 {itemForm.foto_url && (
                   <ImageThumbnail src={itemForm.foto_url} alt="Preview" className="h-10 w-10" />
                 )}
               </div>
               {uploadingPhoto && <p className="text-xs text-muted-foreground">Enviando...</p>}
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setDialogOpen(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleSaveItem}
               disabled={createItem.isPending || updateItem.isPending || uploadingPhoto}
             >
               <Save className="h-4 w-4 mr-2" />
               {editingItem ? 'Salvar' : 'Adicionar'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }