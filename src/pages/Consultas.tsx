import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContratos } from '@/hooks/useContratos';
import { useSentidos } from '@/hooks/useSentidos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Radio, ArrowUpDown, ArrowLeftRight } from 'lucide-react';

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
  const { data: equipamentos } = useQuery({
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
  const { data: sinalizacaoVertical } = useQuery({
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
  const { data: sinalizacaoHorizontal } = useQuery({
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
      <div>
        <h1 className="text-2xl font-bold">Consultas</h1>
        <p className="text-muted-foreground">Pesquise equipamentos e sinalizações</p>
      </div>

      <Tabs defaultValue="equipamentos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipamentos" className="gap-2">
            <Radio className="h-4 w-4" />
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="vertical" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sinalização Vertical
          </TabsTrigger>
          <TabsTrigger value="horizontal" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Sinalização Horizontal
          </TabsTrigger>
        </TabsList>

        {/* Tab Equipamentos */}
        <TabsContent value="equipamentos">
          <Card>
            <CardHeader>
              <CardTitle>Pesquisa de Equipamentos</CardTitle>
              <div className="grid gap-4 md:grid-cols-4 mt-4">
                <div className="space-y-2">
                  <Label>Contrato</Label>
                  <Select value={eqContrato} onValueChange={setEqContrato}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.id_contrato}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Município</Label>
                  <Input
                    placeholder="Filtrar município..."
                    value={eqMunicipio}
                    onChange={(e) => setEqMunicipio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nº Série</Label>
                  <Input
                    placeholder="Filtrar nº série..."
                    value={eqSerie}
                    onChange={(e) => setEqSerie(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Série</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Sinalização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipamentos?.map((eq: any) => (
                    <TableRow key={eq.id}>
                      <TableCell className="font-mono">{eq.numero_serie}</TableCell>
                      <TableCell>{eq.contratos?.id_contrato}</TableCell>
                      <TableCell>{eq.municipio}</TableCell>
                      <TableCell className="max-w-xs truncate">{eq.endereco}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {eq.tem_sinalizacao_vertical && <Badge variant="outline">V</Badge>}
                          {eq.tem_sinalizacao_horizontal && <Badge variant="outline">H</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Sinalização Vertical */}
        <TabsContent value="vertical">
          <Card>
            <CardHeader>
              <CardTitle>Consulta Sinalização Vertical</CardTitle>
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                <div className="space-y-2">
                  <Label>Contrato</Label>
                  <Select value={svContrato} onValueChange={setSvContrato}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.id_contrato}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sentido</Label>
                  <Select value={svSentido} onValueChange={setSvSentido}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {sentidos?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Subtipo</TableHead>
                    <TableHead>Sentido</TableHead>
                    <TableHead>Pontaletes</TableHead>
                    <TableHead>Perfis</TableHead>
                    <TableHead>Postes Col.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sinalizacaoVertical?.map((sv: any) => (
                    <TableRow key={sv.id}>
                      <TableCell className="font-mono">{sv.equipamentos?.numero_serie}</TableCell>
                      <TableCell>{sv.equipamentos?.contratos?.id_contrato}</TableCell>
                      <TableCell>{sv.tipo}</TableCell>
                      <TableCell>{sv.subtipo}</TableCell>
                      <TableCell>{sv.sentidos?.nome || '-'}</TableCell>
                      <TableCell>{sv.qtd_pontaletes}</TableCell>
                      <TableCell>{sv.qtd_perfis_metalicos}</TableCell>
                      <TableCell>{sv.qtd_postes_colapsiveis}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Sinalização Horizontal */}
        <TabsContent value="horizontal">
          <Card>
            <CardHeader>
              <CardTitle>Consulta Sinalização Horizontal</CardTitle>
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                <div className="space-y-2">
                  <Label>Contrato</Label>
                  <Select value={shContrato} onValueChange={setShContrato}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.id_contrato}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={shTipo} onValueChange={setShTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="defensa_metalica">Defensa Metálica</SelectItem>
                      <SelectItem value="tae_80">TAE 80 km/h</SelectItem>
                      <SelectItem value="tae_100">TAE 100 km/h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sentido</TableHead>
                    <TableHead>Lado</TableHead>
                    <TableHead>Lâminas</TableHead>
                    <TableHead>Postes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sinalizacaoHorizontal?.map((sh: any) => (
                    <TableRow key={sh.id}>
                      <TableCell className="font-mono">{sh.equipamentos?.numero_serie}</TableCell>
                      <TableCell>{sh.equipamentos?.contratos?.id_contrato}</TableCell>
                      <TableCell>{tipoHorizontalLabels[sh.tipo]}</TableCell>
                      <TableCell>{sh.sentidos?.nome || '-'}</TableCell>
                      <TableCell>{sh.lado}</TableCell>
                      <TableCell>{sh.qtd_laminas}</TableCell>
                      <TableCell>{sh.qtd_postes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
