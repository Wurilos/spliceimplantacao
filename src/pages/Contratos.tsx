import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContratos, useCreateContrato, useUpdateContrato, useDeleteContrato, Contrato } from '@/hooks/useContratos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';

export default function Contratos() {
  const { canEdit, canDelete } = useAuth();
  const { data: contratos, isLoading } = useContratos();
  const createContrato = useCreateContrato();
  const updateContrato = useUpdateContrato();
  const deleteContrato = useDeleteContrato();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [formData, setFormData] = useState({ nome: '' });

  const filteredContratos = contratos?.filter(
    (c) =>
      c.id_contrato.toLowerCase().includes(search.toLowerCase()) ||
      c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContrato) {
      await updateContrato.mutateAsync({ id: editingContrato.id, id_contrato: editingContrato.id_contrato, nome: formData.nome });
    } else {
      await createContrato.mutateAsync({ id_contrato: '', nome: formData.nome });
    }
    setDialogOpen(false);
    setEditingContrato(null);
    setFormData({ nome: '' });
  };

  const openEdit = (contrato: Contrato) => {
    setEditingContrato(contrato);
    setFormData({ nome: contrato.nome });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingContrato(null);
    setFormData({ nome: '' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Contratos</h1>
              <p className="page-description">Gerencie os contratos do sistema</p>
            </div>
          </div>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingContrato ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
                <DialogDescription>
                  {editingContrato ? 'Atualize os dados do contrato' : 'Preencha os dados do novo contrato'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {editingContrato && (
                  <div className="space-y-2">
                    <Label>ID do Contrato</Label>
                    <Input value={editingContrato.id_contrato} disabled className="bg-muted h-11" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do contrato"
                    required
                    className="h-11"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createContrato.isPending || updateContrato.isPending}>
                    {editingContrato ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : filteredContratos?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum contrato encontrado</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">ID Contrato</TableHead>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Data de Criação</TableHead>
                    {canEdit && <TableHead className="w-28 font-semibold">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContratos?.map((contrato) => (
                    <TableRow key={contrato.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge variant="outline" className="font-mono font-medium">
                          {contrato.id_contrato}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{contrato.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(contrato.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(contrato)} className="hover:bg-primary/10 hover:text-primary">
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
                                    <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Todos os equipamentos associados também serão excluídos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteContrato.mutate(contrato.id)}
                                      className="bg-destructive hover:bg-destructive/90"
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
    </div>
  );
}
