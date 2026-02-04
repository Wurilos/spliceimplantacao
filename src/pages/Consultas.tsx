import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContratos } from '@/hooks/useContratos';
import { useSentidos } from '@/hooks/useSentidos';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Radio, ArrowUpDown, ArrowLeftRight, FileText } from 'lucide-react';
import { ConsultaDocumentos } from '@/components/ConsultaDocumentos';

export default function Consultas() {
  const { data: contratos } = useContratos();
  const { data: sentidos } = useSentidos();

  // Filtros para equipamentos
  const [eqContrato, setEqContrato] = useState<string>('all');
  const [eqMunicipio, setEqMunicipio] = useState('');
  const [eqSerie, setEqSerie] = useState('');

  // Filtros para sinalização vertical
  const [svContrato, setSvContrato] = useState<string>('all');
  const [svSentido, setSvSentido] = useState<string>('all');

  // Filtros para sinalização horizontal
  const [shContrato, setShContrato] = useState<string>('all');
  const [shTipo, setShTipo] = useState<string>('all');

  // Query equipamentos
  const { data: equipamentos, isLoading: isLoadingEq } = useQuery({
    queryKey: ['consulta-equipamentos', eqContrato, eqMunicipio, eqSerie],
    queryFn: async () => {
      let query = supabase
        .from('equipamentos')
        .select(`*, contratos (id_contrato, nome)`);
      
      if (eqContrato !== 'all') query = query.eq('contrato_id', eqContrato);
      if (eqMunicipio) query = query.ilike('municipio', `%${eqMunicipio}%`);
      if (eqSerie) query = query.ilike('numero_serie', `%${eqSerie}%`);
      
      const { data, error } = await query.order('numero_serie');
      if (error) throw error;
      return data;
    },
  });

  // Query sinalização vertical
  const { data: sinalizacaoVertical, isLoading: isLoadingSV } = useQuery({
    queryKey: ['consulta-sinalizacao-vertical', svContrato, svSentido],
    queryFn: async () => {
      let query = supabase
        .from('sinalizacao_vertical_blocos')
        .select(`
          *,
          sentidos (nome),
          equipamentos!inner (
            numero_serie,
            contrato_id,
            contratos (id_contrato, nome)
          )
        `);
      
      if (svContrato !== 'all') {
        query = query.eq('equipamentos.contrato_id', svContrato);
      }
      if (svSentido !== 'all') {
        query = query.eq('sentido_id', svSentido);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Query sinalização horizontal
  const { data: sinalizacaoHorizontal, isLoading: isLoadingSH } = useQuery({
    queryKey: ['consulta-sinalizacao-horizontal', shContrato, shTipo],
    queryFn: async () => {
      let query = supabase
        .from('sinalizacao_horizontal_itens')
        .select(`
          *,
          sentidos (nome),
          equipamentos!inner (
            numero_serie,
            contrato_id,
            contratos (id_contrato, nome)
          )
        `);
      
      if (shContrato !== 'all') {
        query = query.eq('equipamentos.contrato_id', shContrato);
      }
      if (shTipo !== 'all') {
        query = query.eq('tipo', shTipo as 'defensa_metalica' | 'tae_80' | 'tae_100');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const tipoHorizontalLabels: Record<string, string> = {
    defensa_metalica: 'Defensa Metálica',
    tae_80: 'TAE 80 km/h',
    tae_100: 'TAE 100 km/h',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Consultas</h1>
            <p className="page-description">Pesquise equipamentos e sinalizações</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="equipamentos" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto grid w-full grid-cols-3">
          <TabsTrigger value="equipamentos" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 gap-2">
            <Radio className="h-4 w-4" />
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="vertical" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sinalização Vertical
          </TabsTrigger>
          <TabsTrigger value="horizontal" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Sinalização Horizontal
          </TabsTrigger>
        </TabsList>

        {/* Tab Equipamentos */}
        <TabsContent value="equipamentos">
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contrato</Label>
                  <Select value={eqContrato} onValueChange={setEqContrato}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os contratos</SelectItem>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.id_contrato} - {c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Município</Label>
                  <Input
                    placeholder="Filtrar município..."
                    value={eqMunicipio}
                    onChange={(e) => setEqMunicipio(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nº Série</Label>
                  <Input
                    placeholder="Filtrar nº série..."
                    value={eqSerie}
                    onChange={(e) => setEqSerie(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEq ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Carregando...
                </div>
              ) : equipamentos?.length === 0 ? (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipamentos?.map((eq: any) => (
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Sinalização Vertical */}
        <TabsContent value="vertical">
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contrato</Label>
                  <Select value={svContrato} onValueChange={setSvContrato}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os contratos</SelectItem>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.id_contrato} - {c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sentido</Label>
                  <Select value={svSentido} onValueChange={setSvSentido}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os sentidos</SelectItem>
                      {sentidos?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSV ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Carregando...
                </div>
              ) : sinalizacaoVertical?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowUpDown className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma sinalização vertical encontrada</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold">Equipamento</TableHead>
                        <TableHead className="font-semibold">Contrato</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Subtipo</TableHead>
                        <TableHead className="font-semibold">Sentido</TableHead>
                        <TableHead className="font-semibold text-center">Pontaletes</TableHead>
                        <TableHead className="font-semibold text-center">Perfis</TableHead>
                        <TableHead className="font-semibold text-center">Postes Col.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sinalizacaoVertical?.map((sv: any) => (
                        <TableRow key={sv.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono font-medium">{sv.equipamentos?.numero_serie}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {sv.equipamentos?.contratos?.id_contrato}
                            </Badge>
                          </TableCell>
                          <TableCell>{sv.tipo}</TableCell>
                          <TableCell className="text-muted-foreground">{sv.subtipo}</TableCell>
                          <TableCell>{sv.sentidos?.nome || '-'}</TableCell>
                          <TableCell className="text-center font-medium">{sv.qtd_pontaletes}</TableCell>
                          <TableCell className="text-center font-medium">{sv.qtd_perfis_metalicos}</TableCell>
                          <TableCell className="text-center font-medium">{sv.qtd_postes_colapsiveis}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Sinalização Horizontal */}
        <TabsContent value="horizontal">
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contrato</Label>
                  <Select value={shContrato} onValueChange={setShContrato}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os contratos</SelectItem>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.id_contrato} - {c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Select value={shTipo} onValueChange={setShTipo}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="defensa_metalica">Defensa Metálica</SelectItem>
                      <SelectItem value="tae_80">TAE 80 km/h</SelectItem>
                      <SelectItem value="tae_100">TAE 100 km/h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSH ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Carregando...
                </div>
              ) : sinalizacaoHorizontal?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma sinalização horizontal encontrada</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold">Equipamento</TableHead>
                        <TableHead className="font-semibold">Contrato</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Sentido</TableHead>
                        <TableHead className="font-semibold">Lado</TableHead>
                        <TableHead className="font-semibold text-center">Lâminas</TableHead>
                        <TableHead className="font-semibold text-center">Postes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sinalizacaoHorizontal?.map((sh: any) => (
                        <TableRow key={sh.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono font-medium">{sh.equipamentos?.numero_serie}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {sh.equipamentos?.contratos?.id_contrato}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {tipoHorizontalLabels[sh.tipo]}
                            </Badge>
                          </TableCell>
                          <TableCell>{sh.sentidos?.nome || '-'}</TableCell>
                          <TableCell className="font-medium">{sh.lado}</TableCell>
                          <TableCell className="text-center font-medium">{sh.qtd_laminas}</TableCell>
                          <TableCell className="text-center font-medium">{sh.qtd_postes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
