import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, Edit, Tags, List, FolderTree } from 'lucide-react';
import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
  useCategoriaItens,
  useCreateCategoriaItem,
  useUpdateCategoriaItem,
  useDeleteCategoriaItem,
  Categoria,
  CategoriaItem,
} from '@/hooks/useCategorias';

export default function Categorias() {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'operador';
  const canDelete = role === 'admin';

  // Categorias state
  const { data: categorias, isLoading: isLoadingCategorias } = useCategorias();
  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoria = useDeleteCategoria();

  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', descricao: '' });

  // Itens state
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const { data: itens, isLoading: isLoadingItens } = useCategoriaItens(selectedCategoria);
  const createItem = useCreateCategoriaItem();
  const updateItem = useUpdateCategoriaItem();
  const deleteItem = useDeleteCategoriaItem();

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoriaItem | null>(null);
  const [itemForm, setItemForm] = useState({ categoria_id: '', nome: '', descricao: '' });

  // Categoria handlers
  const openCategoriaDialog = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setCategoriaForm({ nome: categoria.nome, descricao: categoria.descricao || '' });
    } else {
      setEditingCategoria(null);
      setCategoriaForm({ nome: '', descricao: '' });
    }
    setCategoriaDialogOpen(true);
  };

  const handleSaveCategoria = async () => {
    if (!categoriaForm.nome.trim()) return;

    if (editingCategoria) {
      await updateCategoria.mutateAsync({ id: editingCategoria.id, ...categoriaForm });
    } else {
      await createCategoria.mutateAsync(categoriaForm);
    }
    setCategoriaDialogOpen(false);
  };

  // Item handlers
  const openItemDialog = (item?: CategoriaItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({ categoria_id: item.categoria_id, nome: item.nome, descricao: item.descricao || '' });
    } else {
      setEditingItem(null);
      setItemForm({ categoria_id: selectedCategoria !== 'all' ? selectedCategoria : '', nome: '', descricao: '' });
    }
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.nome.trim() || !itemForm.categoria_id) return;

    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, ...itemForm });
    } else {
      await createItem.mutateAsync(itemForm);
    }
    setItemDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderTree className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Categorias</h1>
            <p className="page-description">Gerencie categorias e seus itens</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="categorias" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="categorias" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 gap-2">
            <Tags className="h-4 w-4" />
            Cadastro de Categorias
          </TabsTrigger>
          <TabsTrigger value="itens" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 gap-2">
            <List className="h-4 w-4" />
            Itens de Categoria
          </TabsTrigger>
        </TabsList>

        {/* Tab Cadastro de Categorias */}
        <TabsContent value="categorias">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tags className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Categorias</CardTitle>
                  <CardDescription>Lista de categorias cadastradas</CardDescription>
                </div>
              </div>
              {canEdit && (
                <Button onClick={() => openCategoriaDialog()} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingCategorias ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Carregando...
                </div>
              ) : categorias?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Tags className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma categoria cadastrada</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Descrição</TableHead>
                        <TableHead className="font-semibold text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorias?.map((cat) => (
                        <TableRow key={cat.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{cat.nome}</TableCell>
                          <TableCell className="text-muted-foreground">{cat.descricao || '-'}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              {canEdit && (
                                <Button size="sm" variant="ghost" onClick={() => openCategoriaDialog(cat)}>
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
                                      <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação excluirá também todos os itens vinculados a esta categoria.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteCategoria.mutate(cat.id)}
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Itens de Categoria */}
        <TabsContent value="itens">
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <List className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Itens de Categoria</CardTitle>
                    <CardDescription>Itens vinculados às categorias</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-64">
                    <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Filtrar por categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categorias?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {canEdit && (
                    <Button onClick={() => openItemDialog()} className="shadow-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Item
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingItens ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Carregando...
                </div>
              ) : itens?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <List className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum item encontrado</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Categoria</TableHead>
                        <TableHead className="font-semibold">Descrição</TableHead>
                        <TableHead className="font-semibold text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens?.map((item, index) => {
                        const categoryColors = [
                          'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
                          'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
                          'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
                          'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
                          'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
                          'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
                          'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
                          'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
                        ];
                        const categoryIndex = categorias?.findIndex(c => c.id === item.categoria_id) ?? 0;
                        const colorClass = categoryColors[categoryIndex % categoryColors.length];
                        
                        return (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={colorClass}>{item.categorias?.nome}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.descricao || '-'}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              {canEdit && (
                                <Button size="sm" variant="ghost" onClick={() => openItemDialog(item)}>
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
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Categoria */}
      <Dialog open={categoriaDialogOpen} onOpenChange={setCategoriaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>
              {editingCategoria ? 'Edite os dados da categoria' : 'Preencha os dados da nova categoria'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input
                value={categoriaForm.nome}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={categoriaForm.descricao}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCategoria}
              disabled={createCategoria.isPending || updateCategoria.isPending || !categoriaForm.nome.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingCategoria ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Item */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Edite os dados do item' : 'Preencha os dados do novo item'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria <span className="text-destructive">*</span></Label>
              <Select value={itemForm.categoria_id} onValueChange={(v) => setItemForm({ ...itemForm, categoria_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input
                value={itemForm.nome}
                onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })}
                placeholder="Nome do item"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={itemForm.descricao}
                onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={createItem.isPending || updateItem.isPending || !itemForm.nome.trim() || !itemForm.categoria_id}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
