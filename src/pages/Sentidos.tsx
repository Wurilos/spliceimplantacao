import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSentidos, useCreateSentido, useUpdateSentido, useDeleteSentido, Sentido } from '@/hooks/useSentidos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Compass } from 'lucide-react';

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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Sentidos</h1>
              <p className="page-description">Gerencie os sentidos/direções do sistema</p>
            </div>
          </div>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
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
                    className="h-11"
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

      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sentido..."
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
          ) : filteredSentidos?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Compass className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum sentido encontrado</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Data de Criação</TableHead>
                    {canEdit && <TableHead className="w-28 font-semibold">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSentidos?.map((sentido) => (
                    <TableRow key={sentido.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{sentido.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(sentido.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(sentido)} className="hover:bg-primary/10 hover:text-primary">
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
                                    <AlertDialogTitle>Excluir sentido?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteSentido.mutate(sentido.id)}
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
