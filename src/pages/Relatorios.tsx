import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContratos } from '@/hooks/useContratos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Loader2, 
  Radio, 
  ArrowUpDown, 
  ArrowLeftRight, 
  Wrench,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Printer,
  Eye,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EquipamentoRelatorio from '@/components/EquipamentoRelatorio';

interface ProgressItem {
  name: string;
  previsto: number;
  instalado: number;
  percentual: number;
}

export default function Relatorios() {
  const { data: contratos } = useContratos();
  const { toast } = useToast();
  const [selectedContrato, setSelectedContrato] = useState<string>('');
  const [selectedEquipamento, setSelectedEquipamento] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('progresso');
  const reportRef = useRef<HTMLDivElement>(null);

  // Query para equipamentos do contrato selecionado
  const { data: equipamentosContrato } = useQuery({
    queryKey: ['equipamentos-contrato', selectedContrato],
    queryFn: async () => {
      if (!selectedContrato) return [];
      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, numero_serie, endereco, municipio')
        .eq('contrato_id', selectedContrato)
        .order('numero_serie');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedContrato,
  });

  // Query para dados do relatório de progresso
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['relatorio-contrato', selectedContrato],
    queryFn: async () => {
      if (!selectedContrato) return null;

      const { data: equipamentos, error: eqError } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('contrato_id', selectedContrato);

      if (eqError) throw eqError;

      const equipamentoIds = equipamentos?.map(eq => eq.id) || [];

      const { data: sinalizacaoVertical, error: svError } = await supabase
        .from('sinalizacao_vertical_blocos')
        .select('*')
        .in('equipamento_id', equipamentoIds);

      if (svError) throw svError;

      const { data: sinalizacaoHorizontal, error: shError } = await supabase
        .from('sinalizacao_horizontal_itens')
        .select('*')
        .in('equipamento_id', equipamentoIds);

      if (shError) throw shError;

      const { data: infraestrutura, error: infraError } = await supabase
        .from('infraestrutura_itens')
        .select('*')
        .in('equipamento_id', equipamentoIds);

      if (infraError) throw infraError;

      return {
        equipamentos,
        sinalizacaoVertical,
        sinalizacaoHorizontal,
        infraestrutura,
      };
    },
    enabled: !!selectedContrato,
  });

  // Query para dados do equipamento selecionado (relatório detalhado)
  const { data: equipamentoData, isLoading: isLoadingEquipamento } = useQuery({
    queryKey: ['equipamento-relatorio', selectedEquipamento],
    queryFn: async () => {
      if (!selectedEquipamento) return null;

      const { data: equipamento, error: eqError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          contrato:contratos(id_contrato, nome),
          sentido:sentidos(nome)
        `)
        .eq('id', selectedEquipamento)
        .single();

      if (eqError) throw eqError;

      const { data: sinalizacaoVertical, error: svError } = await supabase
        .from('sinalizacao_vertical_blocos')
        .select(`*, sentido:sentidos(nome)`)
        .eq('equipamento_id', selectedEquipamento)
        .order('created_at', { ascending: false });

      if (svError) throw svError;

      const { data: sinalizacaoHorizontal, error: shError } = await supabase
        .from('sinalizacao_horizontal_itens')
        .select(`*, sentido:sentidos(nome)`)
        .eq('equipamento_id', selectedEquipamento)
        .order('created_at', { ascending: false });

      if (shError) throw shError;

      const { data: infraestrutura, error: infraError } = await supabase
        .from('infraestrutura_itens')
        .select('*')
        .eq('equipamento_id', selectedEquipamento)
        .order('created_at', { ascending: false });

      if (infraError) throw infraError;

      const { data: operacional, error: opError } = await supabase
        .from('operacional_itens')
        .select('*')
        .eq('equipamento_id', selectedEquipamento)
        .order('created_at', { ascending: false });

      if (opError) throw opError;

      // Fetch equipamento_sentidos with sentido names
      const { data: equipamentoSentidos, error: esError } = await supabase
        .from('equipamento_sentidos')
        .select('*, sentido:sentidos(nome)')
        .eq('equipamento_id', selectedEquipamento)
        .order('faixa_numero', { ascending: true });

      if (esError) throw esError;

      return {
        equipamento,
        sinalizacaoVertical: sinalizacaoVertical || [],
        sinalizacaoHorizontal: sinalizacaoHorizontal || [],
        infraestrutura: infraestrutura || [],
        operacional: operacional || [],
        equipamentoSentidos: equipamentoSentidos || [],
      };
    },
    enabled: !!selectedEquipamento,
  });

  // Calcular progresso consolidado
  const progressData = useMemo(() => {
    if (!reportData) return null;

    const { equipamentos, sinalizacaoVertical, sinalizacaoHorizontal, infraestrutura } = reportData;

    const totaisPrev = {
      placas: equipamentos?.reduce((acc, eq) => acc + (eq.prev_placas || 0), 0) || 0,
      pontaletes: equipamentos?.reduce((acc, eq) => acc + (eq.prev_pontaletes || 0), 0) || 0,
      postesColapsiveis: equipamentos?.reduce((acc, eq) => acc + (eq.prev_postes_colapsiveis || 0), 0) || 0,
      bracosProjetados: equipamentos?.reduce((acc, eq) => acc + (eq.prev_bracos_projetados || 0), 0) || 0,
      semiPorticos: equipamentos?.reduce((acc, eq) => acc + (eq.prev_semi_porticos || 0), 0) || 0,
      defensas: equipamentos?.reduce((acc, eq) => acc + (eq.prev_defensas || 0), 0) || 0,
      postesHorizontal: equipamentos?.reduce((acc, eq) => acc + (eq.prev_postes_horizontal || 0), 0) || 0,
      tae80: equipamentos?.reduce((acc, eq) => acc + (eq.prev_tae_80 || 0), 0) || 0,
      tae100: equipamentos?.reduce((acc, eq) => acc + (eq.prev_tae_100 || 0), 0) || 0,
      bases: equipamentos?.reduce((acc, eq) => acc + (eq.prev_bases || 0), 0) || 0,
      lacos: equipamentos?.reduce((acc, eq) => acc + (eq.prev_lacos || 0), 0) || 0,
      postesInfra: equipamentos?.reduce((acc, eq) => acc + (eq.prev_postes_infra || 0), 0) || 0,
      conectorizacao: equipamentos?.reduce((acc, eq) => acc + (eq.prev_conectorizacao || 0), 0) || 0,
      ajustes: equipamentos?.reduce((acc, eq) => acc + (eq.prev_ajustes || 0), 0) || 0,
      afericao: equipamentos?.reduce((acc, eq) => acc + (eq.prev_afericao || 0), 0) || 0,
    };

    const instaladoSV = {
      placas: sinalizacaoVertical?.filter(sv => sv.categoria === 'placas').length || 0,
      pontaletes: sinalizacaoVertical?.reduce((acc, sv) => acc + (sv.qtd_pontaletes || 0), 0) || 0,
      postesColapsiveis: sinalizacaoVertical?.reduce((acc, sv) => acc + (sv.qtd_postes_colapsiveis || 0), 0) || 0,
      bracosProjetados: sinalizacaoVertical?.filter(sv => sv.categoria === 'braco_projetado').length || 0,
      semiPorticos: sinalizacaoVertical?.filter(sv => sv.categoria === 'semi_portico').length || 0,
    };

    const instaladoSH = {
      defensas: sinalizacaoHorizontal?.filter(sh => sh.tipo === 'defensa_metalica').reduce((acc, sh) => acc + (sh.qtd_laminas || 0), 0) || 0,
      postesHorizontal: sinalizacaoHorizontal?.reduce((acc, sh) => acc + (sh.qtd_postes || 0), 0) || 0,
      tae80: sinalizacaoHorizontal?.filter(sh => sh.tipo === 'tae_80').length || 0,
      tae100: sinalizacaoHorizontal?.filter(sh => sh.tipo === 'tae_100').length || 0,
    };

    const instaladoInfra = {
      bases: infraestrutura?.filter(i => i.tipo === 'bases').reduce((acc, i) => acc + i.quantidade, 0) || 0,
      lacos: infraestrutura?.filter(i => i.tipo === 'lacos').reduce((acc, i) => acc + i.quantidade, 0) || 0,
      postesInfra: infraestrutura?.filter(i => i.tipo === 'postes').reduce((acc, i) => acc + i.quantidade, 0) || 0,
      conectorizacao: infraestrutura?.filter(i => i.tipo === 'conectorizacao').reduce((acc, i) => acc + i.quantidade, 0) || 0,
      ajustes: infraestrutura?.filter(i => i.tipo === 'ajustes').reduce((acc, i) => acc + i.quantidade, 0) || 0,
      afericao: infraestrutura?.filter(i => i.tipo === 'afericao').reduce((acc, i) => acc + i.quantidade, 0) || 0,
    };

    const calcPercent = (instalado: number, previsto: number) => 
      previsto > 0 ? Math.round((instalado / previsto) * 100) : 0;

    const sinalizacaoVerticalProgress: ProgressItem[] = [
      { name: 'Placas', previsto: totaisPrev.placas, instalado: instaladoSV.placas, percentual: calcPercent(instaladoSV.placas, totaisPrev.placas) },
      { name: 'Pontaletes', previsto: totaisPrev.pontaletes, instalado: instaladoSV.pontaletes, percentual: calcPercent(instaladoSV.pontaletes, totaisPrev.pontaletes) },
      { name: 'Postes Colapsíveis', previsto: totaisPrev.postesColapsiveis, instalado: instaladoSV.postesColapsiveis, percentual: calcPercent(instaladoSV.postesColapsiveis, totaisPrev.postesColapsiveis) },
      { name: 'Braços Projetados', previsto: totaisPrev.bracosProjetados, instalado: instaladoSV.bracosProjetados, percentual: calcPercent(instaladoSV.bracosProjetados, totaisPrev.bracosProjetados) },
      { name: 'Semi Pórticos', previsto: totaisPrev.semiPorticos, instalado: instaladoSV.semiPorticos, percentual: calcPercent(instaladoSV.semiPorticos, totaisPrev.semiPorticos) },
    ];

    const sinalizacaoHorizontalProgress: ProgressItem[] = [
      { name: 'Defensas', previsto: totaisPrev.defensas, instalado: instaladoSH.defensas, percentual: calcPercent(instaladoSH.defensas, totaisPrev.defensas) },
      { name: 'Postes', previsto: totaisPrev.postesHorizontal, instalado: instaladoSH.postesHorizontal, percentual: calcPercent(instaladoSH.postesHorizontal, totaisPrev.postesHorizontal) },
      { name: 'TAE 80 km/h', previsto: totaisPrev.tae80, instalado: instaladoSH.tae80, percentual: calcPercent(instaladoSH.tae80, totaisPrev.tae80) },
      { name: 'TAE 100 km/h', previsto: totaisPrev.tae100, instalado: instaladoSH.tae100, percentual: calcPercent(instaladoSH.tae100, totaisPrev.tae100) },
    ];

    const infraestruturaProgress: ProgressItem[] = [
      { name: 'Bases', previsto: totaisPrev.bases, instalado: instaladoInfra.bases, percentual: calcPercent(instaladoInfra.bases, totaisPrev.bases) },
      { name: 'Laços', previsto: totaisPrev.lacos, instalado: instaladoInfra.lacos, percentual: calcPercent(instaladoInfra.lacos, totaisPrev.lacos) },
      { name: 'Postes Infra', previsto: totaisPrev.postesInfra, instalado: instaladoInfra.postesInfra, percentual: calcPercent(instaladoInfra.postesInfra, totaisPrev.postesInfra) },
      { name: 'Conectorização', previsto: totaisPrev.conectorizacao, instalado: instaladoInfra.conectorizacao, percentual: calcPercent(instaladoInfra.conectorizacao, totaisPrev.conectorizacao) },
      { name: 'Ajustes', previsto: totaisPrev.ajustes, instalado: instaladoInfra.ajustes, percentual: calcPercent(instaladoInfra.ajustes, totaisPrev.ajustes) },
      { name: 'Aferição', previsto: totaisPrev.afericao, instalado: instaladoInfra.afericao, percentual: calcPercent(instaladoInfra.afericao, totaisPrev.afericao) },
    ];

    const todosPrevisto = [...sinalizacaoVerticalProgress, ...sinalizacaoHorizontalProgress, ...infraestruturaProgress]
      .reduce((acc, item) => acc + item.previsto, 0);
    const todosInstalado = [...sinalizacaoVerticalProgress, ...sinalizacaoHorizontalProgress, ...infraestruturaProgress]
      .reduce((acc, item) => acc + item.instalado, 0);
    const progressoGeral = calcPercent(todosInstalado, todosPrevisto);

    return {
      totalEquipamentos: equipamentos?.length || 0,
      sinalizacaoVerticalProgress,
      sinalizacaoHorizontalProgress,
      infraestruturaProgress,
      progressoGeral,
    };
  }, [reportData]);

  const selectedContratoData = contratos?.find(c => c.id === selectedContrato);

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = async () => {
    if (!progressData || !selectedContratoData) return;

    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Progresso', 14, 18);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Contrato: ${selectedContratoData.id_contrato} - ${selectedContratoData.nome}`, 14, 28);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Geral', 14, 55);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Equipamentos: ${progressData.totalEquipamentos}`, 14, 65);
      doc.text(`Progresso Geral: ${progressData.progressoGeral}%`, 14, 72);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Sinalização Vertical', 14, 88);

      autoTable(doc, {
        startY: 92,
        head: [['Item', 'Previsto', 'Instalado', 'Progresso']],
        body: progressData.sinalizacaoVerticalProgress.map(item => [
          item.name,
          item.previsto.toString(),
          item.instalado.toString(),
          `${item.percentual}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10 },
      });

      const finalY1 = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Sinalização Horizontal', 14, finalY1 + 15);

      autoTable(doc, {
        startY: finalY1 + 19,
        head: [['Item', 'Previsto', 'Instalado', 'Progresso']],
        body: progressData.sinalizacaoHorizontalProgress.map(item => [
          item.name,
          item.previsto.toString(),
          item.instalado.toString(),
          `${item.percentual}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11], textColor: 0 },
        styles: { fontSize: 10 },
      });

      const finalY2 = (doc as any).lastAutoTable.finalY;
      
      if (finalY2 > 220) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Infraestrutura', 14, 20);

        autoTable(doc, {
          startY: 24,
          head: [['Item', 'Previsto', 'Instalado', 'Progresso']],
          body: progressData.infraestruturaProgress.map(item => [
            item.name,
            item.previsto.toString(),
            item.instalado.toString(),
            `${item.percentual}%`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 10 },
        });
      } else {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Infraestrutura', 14, finalY2 + 15);

        autoTable(doc, {
          startY: finalY2 + 19,
          head: [['Item', 'Previsto', 'Instalado', 'Progresso']],
          body: progressData.infraestruturaProgress.map(item => [
            item.name,
            item.previsto.toString(),
            item.instalado.toString(),
            `${item.percentual}%`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 10 },
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(128);
        doc.text(
          `Sistema de Implantação de Radares - Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`relatorio_${selectedContratoData.id_contrato}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: 'PDF gerado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao gerar PDF', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const ProgressCard = ({ title, icon: Icon, items, color }: { 
    title: string; 
    icon: React.ElementType; 
    items: ProgressItem[];
    color: string;
  }) => (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.filter(item => item.previsto > 0 || item.instalado > 0).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum item previsto</p>
        ) : (
          items.filter(item => item.previsto > 0 || item.instalado > 0).map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {item.instalado}/{item.previsto}
                  </span>
                  <Badge 
                    variant={item.percentual >= 100 ? 'default' : 'secondary'}
                    className={item.percentual >= 100 ? 'bg-success' : ''}
                  >
                    {item.percentual}%
                  </Badge>
                </div>
              </div>
              <Progress value={Math.min(item.percentual, 100)} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Relatórios</h1>
            <p className="page-description">Relatórios de progresso e implantação</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="progresso" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Progresso
          </TabsTrigger>
          <TabsTrigger value="implantacao" className="gap-2">
            <FileText className="h-4 w-4" />
            Implantação
          </TabsTrigger>
        </TabsList>

        {/* Tab Progresso */}
        <TabsContent value="progresso" className="space-y-6 mt-6">
          {/* Filtro e Ações */}
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Selecione o Contrato</Label>
                  <Select value={selectedContrato} onValueChange={setSelectedContrato}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Escolha um contrato..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.id_contrato} - {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generatePDF} 
                  disabled={!selectedContrato || isLoading || isGenerating || !progressData}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Exportar PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && selectedContrato && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando dados do relatório...
            </div>
          )}

          {/* Empty State */}
          {!selectedContrato && (
            <Card className="shadow-soft">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Selecione um contrato para visualizar o relatório de progresso</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Content */}
          {progressData && selectedContratoData && !isLoading && (
            <>
              {/* Resumo Geral */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-soft border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Radio className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Equipamentos</p>
                        <p className="text-2xl font-bold">{progressData.totalEquipamentos}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft border-l-4 border-l-success">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Progresso Geral</p>
                        <p className="text-2xl font-bold">{progressData.progressoGeral}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft border-l-4 border-l-warning">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                        {progressData.progressoGeral >= 100 ? (
                          <CheckCircle2 className="h-6 w-6 text-warning" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold">
                          {progressData.progressoGeral >= 100 ? 'Concluído' : 'Em Andamento'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft border-l-4 border-l-accent">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contrato</p>
                        <p className="text-lg font-semibold">{selectedContratoData.id_contrato}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes por Categoria */}
              <div className="grid gap-6 lg:grid-cols-3">
                <ProgressCard 
                  title="Sinalização Vertical" 
                  icon={ArrowUpDown}
                  items={progressData.sinalizacaoVerticalProgress}
                  color="bg-primary"
                />
                <ProgressCard 
                  title="Sinalização Horizontal" 
                  icon={ArrowLeftRight}
                  items={progressData.sinalizacaoHorizontalProgress}
                  color="bg-warning"
                />
                <ProgressCard 
                  title="Infraestrutura" 
                  icon={Wrench}
                  items={progressData.infraestruturaProgress}
                  color="bg-success"
                />
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab Implantação */}
        <TabsContent value="implantacao" className="space-y-6 mt-6">
          {/* Filtros */}
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contrato</Label>
                  <Select value={selectedContrato} onValueChange={(v) => { setSelectedContrato(v); setSelectedEquipamento(''); }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Escolha um contrato..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contratos?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.id_contrato} - {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Equipamento</Label>
                  <Select 
                    value={selectedEquipamento} 
                    onValueChange={setSelectedEquipamento}
                    disabled={!selectedContrato}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Escolha um equipamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {equipamentosContrato?.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.numero_serie} - {eq.municipio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handlePrint}
                    disabled={!equipamentoData}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoadingEquipamento && selectedEquipamento && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando dados do equipamento...
            </div>
          )}

          {/* Empty State */}
          {!selectedEquipamento && (
            <Card className="shadow-soft">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Selecione um contrato e equipamento para visualizar o relatório de implantação</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview do Relatório */}
          {equipamentoData && !isLoadingEquipamento && (
            <Card className="shadow-soft overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pré-visualização do Relatório</CardTitle>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[70vh] overflow-auto">
                <EquipamentoRelatorio
                  ref={reportRef}
                  equipamento={equipamentoData.equipamento}
                  sinalizacaoVertical={equipamentoData.sinalizacaoVertical}
                  sinalizacaoHorizontal={equipamentoData.sinalizacaoHorizontal}
                  infraestrutura={equipamentoData.infraestrutura}
                  operacional={equipamentoData.operacional}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Print View (hidden on screen, visible on print) */}
      {equipamentoData && (
        <div className="hidden print:block">
          <EquipamentoRelatorio
            equipamento={equipamentoData.equipamento}
            sinalizacaoVertical={equipamentoData.sinalizacaoVertical}
            sinalizacaoHorizontal={equipamentoData.sinalizacaoHorizontal}
            infraestrutura={equipamentoData.infraestrutura}
            operacional={equipamentoData.operacional}
          />
        </div>
      )}
    </div>
  );
}
