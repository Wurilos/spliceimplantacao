import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipamentos, useDeleteEquipamento } from '@/hooks/useEquipamentos';
import { useContratos } from '@/hooks/useContratos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Eye, Trash2, ArrowUpDown, ArrowLeftRight, Radio } from 'lucide-react';

export default function Equipamentos() {
  const { canEdit, canDelete } = useAuth();
  const { data: equipamentos, isLoading } = useEquipamentos();
  const { data: contratos } = useContratos();
  const deleteEquipamento = useDeleteEquipamento();

  const [search, setSearch] = useState('');
  const [contratoFilter, setContratoFilter] = useState<string>('all');

  const filteredEquipamentos = equipamentos?.filter((eq) => {
    const matchesSearch =
      eq.numero_serie.toLowerCase().includes(search.toLowerCase()) ||
      eq.municipio.toLowerCase().includes(search.toLowerCase()) ||
      eq.endereco.toLowerCase().includes(search.toLowerCase());
    
    const matchesContrato = contratoFilter === 'all' || eq.contrato_id === contratoFilter;
    
    return matchesSearch && matchesContrato;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Equipamentos</h1>
              <p className="page-description">Gerencie os equipamentos de radar</p>
            </div>
          </div>
        </div>
        {canEdit && (
          <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <Link to="/equipamentos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Equipamento
            </Link>
          </Button>
        )}
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nº série, município ou endereço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={contratoFilter} onValueChange={setContratoFilter}>
              <SelectTrigger className="w-full sm:w-56 h-11">
                <SelectValue placeholder="Filtrar por contrato" />
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : filteredEquipamentos?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Radio className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum equipamento encontrado</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Nº Série</TableHead>
                    <TableHead className="font-semibold">Contrato</TableHead>
                    <TableHead className="font-semibold">Município</TableHead>
                    <TableHead className="font-semibold">Endereço</TableHead>
                    <TableHead className="font-semibold">Sinalização</TableHead>
                    <TableHead className="w-28 font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipamentos?.map((eq) => (
                    <TableRow key={eq.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">{eq.numero_serie}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {eq.contratos?.id_contrato}
                        </Badge>
                      </TableCell>
                      <TableCell>{eq.municipio}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{eq.endereco}</TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {eq.tem_sinalizacao_vertical && (
                            <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
                              <ArrowUpDown className="h-3 w-3" />
                              V
                            </Badge>
                          )}
                          {eq.tem_sinalizacao_horizontal && (
                            <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20">
                              <ArrowLeftRight className="h-3 w-3" />
                              H
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10 hover:text-primary">
                            <Link to={`/equipamentos/${eq.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
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
                                  <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Todas as sinalizações associadas também serão excluídas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteEquipamento.mutate(eq.id)}
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
