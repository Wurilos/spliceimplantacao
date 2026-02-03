import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipamentos, useDeleteEquipamento } from '@/hooks/useEquipamentos';
import { useContratos } from '@/hooks/useContratos';
import { useSentidos } from '@/hooks/useSentidos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Eye, Trash2, ArrowUpDown, ArrowLeftRight } from 'lucide-react';

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground">Gerencie os equipamentos de radar</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link to="/equipamentos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Equipamento
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nº série, município ou endereço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={contratoFilter} onValueChange={setContratoFilter}>
              <SelectTrigger className="w-48">
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
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredEquipamentos?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum equipamento encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Série</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Sinalização</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipamentos?.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-mono">{eq.numero_serie}</TableCell>
                    <TableCell>{eq.contratos?.id_contrato}</TableCell>
                    <TableCell>{eq.municipio}</TableCell>
                    <TableCell className="max-w-xs truncate">{eq.endereco}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {eq.tem_sinalizacao_vertical && (
                          <Badge variant="outline" className="gap-1">
                            <ArrowUpDown className="h-3 w-3" />
                            V
                          </Badge>
                        )}
                        {eq.tem_sinalizacao_horizontal && (
                          <Badge variant="outline" className="gap-1">
                            <ArrowLeftRight className="h-3 w-3" />
                            H
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/equipamentos/${eq.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
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
                                <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Todas as sinalizações associadas também serão excluídas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteEquipamento.mutate(eq.id)}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
