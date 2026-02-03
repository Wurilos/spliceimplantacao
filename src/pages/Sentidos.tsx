import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSentidos, useCreateSentido, useUpdateSentido, useDeleteSentido, Sentido } from '@/hooks/useSentidos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function Sentidos() {
  const { canEdit, canDelete } = useAuth();
  const { data: sentidos, isLoading } = useSentidos();
  const createSentido = useCreateSentido();
  const updateSentido = useUpdateSentido();
  const deleteSentido = useDeleteSentido();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSentido, setEditingSentido] = useState<Sentido | null>(null);
  const [nome, setNome] = useState('');

  const filteredSentidos = sentidos?.filter((s) =>
    s.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSentido) {
      await updateSentido.mutateAsync({ id: editingSentido.id, nome });
    } else {
      await createSentido.mutateAsync({ nome });
    }
    setDialogOpen(false);
    setEditingSentido(null);
    setNome('');
  };

  const openEdit = (sentido: Sentido) => {
    setEditingSentido(sentido);
    setNome(sentido.nome);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingSentido(null);
    setNome('');
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sentidos</h1>
          <p className="text-muted-foreground">Gerencie os sentidos/direções do sistema</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Sentido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSentido ? 'Editar Sentido' : 'Novo Sentido'}</DialogTitle>
                <DialogDescription>
                  {editingSentido ? 'Atualize o nome do sentido' : 'Digite o nome do novo sentido'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Norte, Sul, Leste..."
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createSentido.isPending || updateSentido.isPending}>
                    {editingSentido ? 'Salvar' : 'Criar'}
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
                placeholder="Buscar sentido..."
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
          ) : filteredSentidos?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum sentido encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  {canEdit && <TableHead className="w-24">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSentidos?.map((sentido) => (
                  <TableRow key={sentido.id}>
                    <TableCell className="font-medium">{sentido.nome}</TableCell>
                    <TableCell>{new Date(sentido.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(sentido)}>
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
                                  <AlertDialogTitle>Excluir sentido?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSentido.mutate(sentido.id)}>
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
