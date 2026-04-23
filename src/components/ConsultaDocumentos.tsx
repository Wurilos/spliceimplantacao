import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContratos } from '@/hooks/useContratos';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Archive, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface EquipamentoDocumentos {
  id: string;
  numero_serie: string;
  municipio: string;
  contratos: { id_contrato: string; nome: string } | null;
  projeto_croqui_url: string | null;
  croqui_caracterizacao_url: string | null;
  relatorio_vdm_url: string | null;
}

export function ConsultaDocumentos() {
  const { data: contratos } = useContratos();
  const { toast } = useToast();

  const [filtroContrato, setFiltroContrato] = useState<string>('all');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroSerie, setFiltroSerie] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: equipamentos, isLoading } = useQuery({
    queryKey: ['consulta-documentos', filtroContrato, filtroMunicipio, filtroSerie],
    queryFn: async () => {
      let query = supabase
        .from('equipamentos')
        .select(`
          id,
          numero_serie,
          municipio,
          contratos (id_contrato, nome),
          projeto_croqui_url,
          croqui_caracterizacao_url,
          relatorio_vdm_url
        `);

      if (filtroContrato !== 'all') query = query.eq('contrato_id', filtroContrato);
      if (filtroMunicipio) query = query.ilike('municipio', `%${filtroMunicipio}%`);
      if (filtroSerie) query = query.ilike('numero_serie', `%${filtroSerie}%`);

      const { data, error } = await query.order('numero_serie');
      if (error) throw error;
      return data as EquipamentoDocumentos[];
    },
  });

  const hasAnyDocument = (eq: EquipamentoDocumentos) => {
    return eq.projeto_croqui_url || eq.croqui_caracterizacao_url || eq.relatorio_vdm_url;
  };

  const countDocuments = (eq: EquipamentoDocumentos) => {
    let count = 0;
    if (eq.projeto_croqui_url) count++;
    if (eq.croqui_caracterizacao_url) count++;
    if (eq.relatorio_vdm_url) count++;
    return count;
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      saveAs(blob, filename);
    } catch (error) {
      throw new Error('Falha ao baixar arquivo');
    }
  };

  const handleDownloadAll = async (eq: EquipamentoDocumentos) => {
    if (!hasAnyDocument(eq)) return;

    setDownloadingId(eq.id);
    try {
      const zip = new JSZip();
      const files = [
        { url: eq.projeto_croqui_url, name: `${eq.numero_serie}_projeto_croqui.pdf` },
        { url: eq.croqui_caracterizacao_url, name: `${eq.numero_serie}_croqui_caracterizacao.pdf` },
        { url: eq.relatorio_vdm_url, name: `${eq.numero_serie}_relatorio_vdm.pdf` },
      ];

      for (const file of files) {
        if (file.url) {
          const response = await fetch(file.url);
          const blob = await response.blob();
          zip.file(file.name, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${eq.numero_serie}_documentos.zip`);
      toast({ title: 'Download concluído!' });
    } catch (error: any) {
      toast({ title: 'Erro ao baixar arquivos', description: error.message, variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  const documentLabels = {
    projeto_croqui_url: 'Projeto',
    croqui_caracterizacao_url: 'Croqui',
    relatorio_vdm_url: 'VDM',
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Contrato</Label>
            <Select value={filtroContrato} onValueChange={setFiltroContrato}>
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
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nº Série</Label>
            <Input
              placeholder="Filtrar nº série..."
              value={filtroSerie}
              onChange={(e) => setFiltroSerie(e.target.value)}
              className="h-11"
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
        ) : equipamentos?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
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
                  <TableHead className="font-semibold">Projeto</TableHead>
                  <TableHead className="font-semibold">Croqui</TableHead>
                  <TableHead className="font-semibold">VDM</TableHead>
                  <TableHead className="font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipamentos?.map((eq) => (
                  <TableRow key={eq.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{eq.numero_serie}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {eq.contratos?.id_contrato}
                      </Badge>
                    </TableCell>
                    <TableCell>{eq.municipio}</TableCell>
                    <TableCell>
                      {eq.projeto_croqui_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary"
                          onClick={() => downloadFile(eq.projeto_croqui_url!, `${eq.numero_serie}_projeto.pdf`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {eq.croqui_caracterizacao_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary"
                          onClick={() => downloadFile(eq.croqui_caracterizacao_url!, `${eq.numero_serie}_croqui.pdf`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {eq.relatorio_vdm_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary"
                          onClick={() => downloadFile(eq.relatorio_vdm_url!, `${eq.numero_serie}_vdm.pdf`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasAnyDocument(eq) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => handleDownloadAll(eq)}
                          disabled={downloadingId === eq.id}
                        >
                          {downloadingId === eq.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Archive className="h-4 w-4" />
                              ZIP ({countDocuments(eq)})
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
