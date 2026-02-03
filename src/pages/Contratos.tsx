import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContratos, useCreateContrato, useUpdateContrato, useDeleteContrato, Contrato } from '@/hooks/useContratos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">Gerencie os contratos do sistema</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
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
                    <Input value={editingContrato.id_contrato} disabled className="bg-muted" />
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredContratos?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum contrato encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Contrato</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  {canEdit && <TableHead className="w-24">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContratos?.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell className="font-mono">{contrato.id_contrato}</TableCell>
                    <TableCell>{contrato.nome}</TableCell>
                    <TableCell>{new Date(contrato.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(contrato)}>
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
                                  <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Todos os equipamentos associados também serão excluídos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteContrato.mutate(contrato.id)}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
