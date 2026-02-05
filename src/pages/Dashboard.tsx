import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Radio, Sparkles, Activity, ChevronRight, MapPin, TrendingUp, Filter, FileText, FileCheck, FileX, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContratos } from '@/hooks/useContratos';

interface EquipamentoComPrevisao {
  id: string;
  numero_serie: string;
  municipio: string;
  endereco: string;
  tipo_equipamento: string | null;
  contrato_id: string;
  // Previsão Vertical
  prev_placas: number;
  prev_pontaletes: number;
  prev_postes_colapsiveis: number;
  prev_bracos_projetados: number;
  prev_semi_porticos: number;
  // Previsão Horizontal
  prev_defensas: number;
  prev_postes_horizontal: number;
  prev_tae_80: number;
  prev_tae_100: number;
  // Previsão Infraestrutura
  prev_bases: number;
  prev_lacos: number;
  prev_postes_infra: number;
  prev_conectorizacao: number;
  prev_ajustes: number;
  prev_afericao: number;
  // Instalado Vertical (cada bloco = 1 placa)
  instalado_placas: number;
  instalado_pontaletes: number;
  instalado_perfis: number;
  instalado_postes_colapsiveis: number;
  // Instalado Horizontal
  instalado_laminas: number;
  instalado_postes: number;
  instalado_tae_80: number;
  instalado_tae_100: number;
  // Instalado Infraestrutura
  instalado_bases: number;
  instalado_lacos: number;
  instalado_postes_infra: number;
  instalado_conectorizacao: number;
  instalado_ajustes: number;
  instalado_afericao: number;
}

export default function Dashboard() {
  const [filtroContrato, setFiltroContrato] = useState<string>('todos');
  const [filtroEquipamento, setFiltroEquipamento] = useState<string>('todos');

  // Buscar contratos para o filtro
  const { data: contratos } = useContratos();

  // Query para buscar equipamentos com previsão e totais instalados
  const { data: equipamentosRaw, isLoading } = useQuery({
    queryKey: ['dashboard-equipamentos-previsao'],
    queryFn: async () => {
      const { data: eqData, error: eqError } = await supabase
        .from('equipamentos')
        .select(`
          id,
          numero_serie,
          municipio,
          endereco,
          tipo_equipamento,
          contrato_id,
          prev_placas,
          prev_pontaletes,
          prev_postes_colapsiveis,
          prev_bracos_projetados,
          prev_semi_porticos,
          prev_defensas,
          prev_postes_horizontal,
          prev_tae_80,
          prev_tae_100,
          prev_bases,
          prev_lacos,
          prev_postes_infra,
          prev_conectorizacao,
          prev_ajustes,
          prev_afericao,
          projeto_croqui_url,
          croqui_caracterizacao_url,
          estudo_viabilidade_url,
          relatorio_vdm_url,
          sinalizacao_vertical_blocos (qtd_pontaletes, qtd_perfis_metalicos, qtd_postes_colapsiveis),
          sinalizacao_horizontal_itens (tipo, qtd_laminas, qtd_postes),
          infraestrutura_itens (tipo, quantidade)
        `);
      
      if (eqError) throw eqError;

      // Processar os dados para calcular totais instalados
      const processedData = (eqData || []).map((eq: any) => {
        // Totais verticais (cada bloco = 1 placa instalada)
        let instalado_placas = eq.sinalizacao_vertical_blocos?.length || 0;
        let instalado_pontaletes = 0;
        let instalado_perfis = 0;
        let instalado_postes_colapsiveis = 0;
        
        eq.sinalizacao_vertical_blocos?.forEach((sv: any) => {
          instalado_pontaletes += sv.qtd_pontaletes || 0;
          instalado_perfis += sv.qtd_perfis_metalicos || 0;
          instalado_postes_colapsiveis += sv.qtd_postes_colapsiveis || 0;
        });

        // Totais horizontais
        let instalado_laminas = 0;
        let instalado_postes = 0;
        let instalado_tae_80 = 0;
        let instalado_tae_100 = 0;

        eq.sinalizacao_horizontal_itens?.forEach((sh: any) => {
          if (sh.tipo === 'defensa_metalica') {
            instalado_laminas += sh.qtd_laminas || 0;
            instalado_postes += sh.qtd_postes || 0;
          } else if (sh.tipo === 'tae_80') {
            instalado_tae_80 += 1;
          } else if (sh.tipo === 'tae_100') {
            instalado_tae_100 += 1;
          }
        });

      // Totais infraestrutura
      let instalado_bases = 0;
      let instalado_lacos = 0;
      let instalado_postes_infra = 0;
      let instalado_conectorizacao = 0;
      let instalado_ajustes = 0;
      let instalado_afericao = 0;

      eq.infraestrutura_itens?.forEach((inf: any) => {
        switch (inf.tipo) {
          case 'bases':
            instalado_bases += inf.quantidade || 0;
            break;
          case 'lacos':
            instalado_lacos += inf.quantidade || 0;
            break;
          case 'postes':
            instalado_postes_infra += inf.quantidade || 0;
            break;
          case 'conectorizacao':
            instalado_conectorizacao += inf.quantidade || 0;
            break;
          case 'ajustes':
            instalado_ajustes += inf.quantidade || 0;
            break;
          case 'afericao':
            instalado_afericao += inf.quantidade || 0;
            break;
        }
      });

        return {
          id: eq.id,
          numero_serie: eq.numero_serie,
          municipio: eq.municipio,
          endereco: eq.endereco,
          tipo_equipamento: eq.tipo_equipamento,
          contrato_id: eq.contrato_id,
          prev_placas: eq.prev_placas || 0,
          prev_pontaletes: eq.prev_pontaletes || 0,
          prev_postes_colapsiveis: eq.prev_postes_colapsiveis || 0,
          prev_bracos_projetados: eq.prev_bracos_projetados || 0,
          prev_semi_porticos: eq.prev_semi_porticos || 0,
          prev_defensas: eq.prev_defensas || 0,
          prev_postes_horizontal: eq.prev_postes_horizontal || 0,
          prev_tae_80: eq.prev_tae_80 || 0,
          prev_tae_100: eq.prev_tae_100 || 0,
          prev_bases: eq.prev_bases || 0,
          prev_lacos: eq.prev_lacos || 0,
          prev_postes_infra: eq.prev_postes_infra || 0,
          prev_conectorizacao: eq.prev_conectorizacao || 0,
          prev_ajustes: eq.prev_ajustes || 0,
          prev_afericao: eq.prev_afericao || 0,
          instalado_placas,
          instalado_pontaletes,
          instalado_perfis,
          instalado_postes_colapsiveis,
          instalado_laminas,
          instalado_postes,
          instalado_tae_80,
          instalado_tae_100,
          instalado_bases,
          instalado_lacos,
          instalado_postes_infra,
          instalado_conectorizacao,
          instalado_ajustes,
          instalado_afericao,
          projeto_croqui_url: eq.projeto_croqui_url,
          croqui_caracterizacao_url: eq.croqui_caracterizacao_url,
          estudo_viabilidade_url: eq.estudo_viabilidade_url,
          relatorio_vdm_url: eq.relatorio_vdm_url,
        };
      });

      return processedData;
    },
  });

  // Filtrar equipamentos com base nos filtros selecionados
  const equipamentos = useMemo(() => {
    if (!equipamentosRaw) return [];
    
    return equipamentosRaw.filter(eq => {
      const matchContrato = filtroContrato === 'todos' || eq.contrato_id === filtroContrato;
      const matchEquipamento = filtroEquipamento === 'todos' || eq.id === filtroEquipamento;
      return matchContrato && matchEquipamento;
    });
  }, [equipamentosRaw, filtroContrato, filtroEquipamento]);

  // Calcular totais gerais para o gráfico consolidado
  const totaisGerais = equipamentos?.reduce((acc, eq) => ({
    totalEquipamentos: acc.totalEquipamentos + 1,
    // Verticais
    prevPlacas: acc.prevPlacas + eq.prev_placas,
    instPlacas: acc.instPlacas + eq.instalado_placas,
    prevPontaletes: acc.prevPontaletes + eq.prev_pontaletes,
    instPontaletes: acc.instPontaletes + eq.instalado_pontaletes,
    prevPostesCol: acc.prevPostesCol + eq.prev_postes_colapsiveis,
    instPostesCol: acc.instPostesCol + eq.instalado_postes_colapsiveis,
    prevBracosProj: acc.prevBracosProj + eq.prev_bracos_projetados,
    prevSemiPorticos: acc.prevSemiPorticos + eq.prev_semi_porticos,
    // Horizontais
    prevDefensas: acc.prevDefensas + eq.prev_defensas,
    instDefensas: acc.instDefensas + eq.instalado_laminas,
    prevPostesHor: acc.prevPostesHor + eq.prev_postes_horizontal,
    instPostesHor: acc.instPostesHor + eq.instalado_postes,
    prevTae80: acc.prevTae80 + eq.prev_tae_80,
    instTae80: acc.instTae80 + eq.instalado_tae_80,
    prevTae100: acc.prevTae100 + eq.prev_tae_100,
    instTae100: acc.instTae100 + eq.instalado_tae_100,
    // Infraestrutura
    prevBases: acc.prevBases + eq.prev_bases,
    instBases: acc.instBases + eq.instalado_bases,
    prevLacos: acc.prevLacos + eq.prev_lacos,
    instLacos: acc.instLacos + eq.instalado_lacos,
    prevPostesInfra: acc.prevPostesInfra + eq.prev_postes_infra,
    instPostesInfra: acc.instPostesInfra + eq.instalado_postes_infra,
    prevConectorizacao: acc.prevConectorizacao + eq.prev_conectorizacao,
    instConectorizacao: acc.instConectorizacao + eq.instalado_conectorizacao,
    prevAjustes: acc.prevAjustes + eq.prev_ajustes,
    instAjustes: acc.instAjustes + eq.instalado_ajustes,
    prevAfericao: acc.prevAfericao + eq.prev_afericao,
    instAfericao: acc.instAfericao + eq.instalado_afericao,
  }), {
    totalEquipamentos: 0,
    prevPlacas: 0,
    instPlacas: 0,
    prevPontaletes: 0,
    instPontaletes: 0,
    prevPostesCol: 0,
    instPostesCol: 0,
    prevBracosProj: 0,
    prevSemiPorticos: 0,
    prevDefensas: 0,
    instDefensas: 0,
    prevPostesHor: 0,
    instPostesHor: 0,
    prevTae80: 0,
    instTae80: 0,
    prevTae100: 0,
    instTae100: 0,
    prevBases: 0,
    instBases: 0,
    prevLacos: 0,
    instLacos: 0,
    prevPostesInfra: 0,
    instPostesInfra: 0,
    prevConectorizacao: 0,
    instConectorizacao: 0,
    prevAjustes: 0,
    instAjustes: 0,
    prevAfericao: 0,
    instAfericao: 0,
  });

  // Dados para o gráfico geral consolidado
  const chartDataGeral = [
    { name: 'Placas', previsto: totaisGerais?.prevPlacas || 0, instalado: totaisGerais?.instPlacas || 0 },
    { name: 'Pontaletes', previsto: totaisGerais?.prevPontaletes || 0, instalado: totaisGerais?.instPontaletes || 0 },
    { name: 'Postes Col.', previsto: totaisGerais?.prevPostesCol || 0, instalado: totaisGerais?.instPostesCol || 0 },
    { name: 'Braço Proj.', previsto: totaisGerais?.prevBracosProj || 0, instalado: 0 },
    { name: 'Semi Pórtico', previsto: totaisGerais?.prevSemiPorticos || 0, instalado: 0 },
    { name: 'Defensas', previsto: totaisGerais?.prevDefensas || 0, instalado: totaisGerais?.instDefensas || 0 },
    { name: 'Postes Hor.', previsto: totaisGerais?.prevPostesHor || 0, instalado: totaisGerais?.instPostesHor || 0 },
    { name: 'TAE 80', previsto: totaisGerais?.prevTae80 || 0, instalado: totaisGerais?.instTae80 || 0 },
    { name: 'TAE 100', previsto: totaisGerais?.prevTae100 || 0, instalado: totaisGerais?.instTae100 || 0 },
    // Infraestrutura
    { name: 'Bases', previsto: totaisGerais?.prevBases || 0, instalado: totaisGerais?.instBases || 0 },
    { name: 'Laços', previsto: totaisGerais?.prevLacos || 0, instalado: totaisGerais?.instLacos || 0 },
    { name: 'Postes Infra', previsto: totaisGerais?.prevPostesInfra || 0, instalado: totaisGerais?.instPostesInfra || 0 },
    { name: 'Conect.', previsto: totaisGerais?.prevConectorizacao || 0, instalado: totaisGerais?.instConectorizacao || 0 },
    { name: 'Ajustes', previsto: totaisGerais?.prevAjustes || 0, instalado: totaisGerais?.instAjustes || 0 },
    { name: 'Aferição', previsto: totaisGerais?.prevAfericao || 0, instalado: totaisGerais?.instAfericao || 0 },
  ].filter(item => item.previsto > 0 || item.instalado > 0);

  // Gerar dados para gráfico de um equipamento (incluindo TODOS os itens)
  const getChartData = (eq: EquipamentoComPrevisao) => [
    { name: 'Placas', previsto: eq.prev_placas, instalado: eq.instalado_placas },
    { name: 'Pontaletes', previsto: eq.prev_pontaletes, instalado: eq.instalado_pontaletes },
    { name: 'Postes Col.', previsto: eq.prev_postes_colapsiveis, instalado: eq.instalado_postes_colapsiveis },
    { name: 'Braço Proj.', previsto: eq.prev_bracos_projetados, instalado: 0 },
    { name: 'Semi Pórtico', previsto: eq.prev_semi_porticos, instalado: 0 },
    { name: 'Defensas', previsto: eq.prev_defensas, instalado: eq.instalado_laminas },
    { name: 'Postes Hor.', previsto: eq.prev_postes_horizontal, instalado: eq.instalado_postes },
    { name: 'TAE 80', previsto: eq.prev_tae_80, instalado: eq.instalado_tae_80 },
    { name: 'TAE 100', previsto: eq.prev_tae_100, instalado: eq.instalado_tae_100 },
    // Infraestrutura
    { name: 'Bases', previsto: eq.prev_bases, instalado: eq.instalado_bases },
    { name: 'Laços', previsto: eq.prev_lacos, instalado: eq.instalado_lacos },
    { name: 'Postes Infra', previsto: eq.prev_postes_infra, instalado: eq.instalado_postes_infra },
    { name: 'Conect.', previsto: eq.prev_conectorizacao, instalado: eq.instalado_conectorizacao },
    { name: 'Ajustes', previsto: eq.prev_ajustes, instalado: eq.instalado_ajustes },
    { name: 'Aferição', previsto: eq.prev_afericao, instalado: eq.instalado_afericao },
  ].filter(item => item.previsto > 0 || item.instalado > 0);

  // Calcular total geral previsto e instalado
  const totalPrevisto = (totaisGerais?.prevPlacas || 0) + (totaisGerais?.prevPontaletes || 0) + 
    (totaisGerais?.prevPostesCol || 0) + (totaisGerais?.prevBracosProj || 0) + 
    (totaisGerais?.prevSemiPorticos || 0) + (totaisGerais?.prevDefensas || 0) + 
    (totaisGerais?.prevPostesHor || 0) + (totaisGerais?.prevTae80 || 0) + (totaisGerais?.prevTae100 || 0) +
    (totaisGerais?.prevBases || 0) + (totaisGerais?.prevLacos || 0) + (totaisGerais?.prevPostesInfra || 0) +
    (totaisGerais?.prevConectorizacao || 0) + (totaisGerais?.prevAjustes || 0) + (totaisGerais?.prevAfericao || 0);
  
  const totalInstalado = (totaisGerais?.instPlacas || 0) + (totaisGerais?.instPontaletes || 0) + 
    (totaisGerais?.instPostesCol || 0) + (totaisGerais?.instDefensas || 0) + 
    (totaisGerais?.instPostesHor || 0) + (totaisGerais?.instTae80 || 0) + (totaisGerais?.instTae100 || 0) +
    (totaisGerais?.instBases || 0) + (totaisGerais?.instLacos || 0) + (totaisGerais?.instPostesInfra || 0) +
    (totaisGerais?.instConectorizacao || 0) + (totaisGerais?.instAjustes || 0) + (totaisGerais?.instAfericao || 0);

  const percentualConcluido = totalPrevisto > 0 ? Math.round((totalInstalado / totalPrevisto) * 100) : 0;

  // Calcular status de documentos
  const documentStatus = useMemo(() => {
    if (!equipamentos) return { complete: 0, incomplete: 0, total: 0, byType: [], pieData: [] };
    
    let projetoCroqui = 0;
    let croquiCaracterizacao = 0;
    let estudoViabilidade = 0;
    let relatorioVdm = 0;
    
    equipamentos.forEach((eq: any) => {
      if (eq.projeto_croqui_url) projetoCroqui++;
      if (eq.croqui_caracterizacao_url) croquiCaracterizacao++;
      if (eq.estudo_viabilidade_url) estudoViabilidade++;
      if (eq.relatorio_vdm_url) relatorioVdm++;
    });
    
    const total = equipamentos.length;
    const byType = [
      { name: 'Projeto (Croqui)', enviados: projetoCroqui, pendentes: total - projetoCroqui },
      { name: 'Croqui Caracterização', enviados: croquiCaracterizacao, pendentes: total - croquiCaracterizacao },
      { name: 'Estudo Viabilidade', enviados: estudoViabilidade, pendentes: total - estudoViabilidade },
      { name: 'Relatório VDM', enviados: relatorioVdm, pendentes: total - relatorioVdm },
    ];
    
    const totalDocs = total * 4;
    const completeDocs = projetoCroqui + croquiCaracterizacao + estudoViabilidade + relatorioVdm;
    
    return {
      complete: completeDocs,
      incomplete: totalDocs - completeDocs,
      total: totalDocs,
      byType,
      pieData: [
        { name: 'Enviados', value: completeDocs, color: 'hsl(160, 84%, 39%)' },
        { name: 'Pendentes', value: totalDocs - completeDocs, color: 'hsl(var(--destructive))' },
      ]
    };
  }, [equipamentos]);

  // Função para calcular percentual
  const calcPercent = (instalado: number, previsto: number) => 
    previsto > 0 ? Math.round((instalado / previsto) * 100) : 0;

  const materialCards = [
    {
      title: 'Defensas',
      previsto: totaisGerais?.prevDefensas || 0,
      instalado: totaisGerais?.instDefensas || 0,
      icon: Activity,
      gradient: 'from-warning to-destructive',
    },
    {
      title: 'TAE 80',
      previsto: totaisGerais?.prevTae80 || 0,
      instalado: totaisGerais?.instTae80 || 0,
      icon: Activity,
      gradient: 'from-info to-primary',
    },
    {
      title: 'TAE 100',
      previsto: totaisGerais?.prevTae100 || 0,
      instalado: totaisGerais?.instTae100 || 0,
      icon: Activity,
      gradient: 'from-accent to-info',
    },
    {
      title: 'Placas',
      previsto: totaisGerais?.prevPlacas || 0,
      instalado: totaisGerais?.instPlacas || 0,
      icon: Radio,
      gradient: 'from-primary to-accent',
    },
    {
      title: 'Pontaletes',
      previsto: totaisGerais?.prevPontaletes || 0,
      instalado: totaisGerais?.instPontaletes || 0,
      icon: TrendingUp,
      gradient: 'from-success to-info',
    },
    {
      title: 'Postes Colapsíveis',
      previsto: totaisGerais?.prevPostesCol || 0,
      instalado: totaisGerais?.instPostesCol || 0,
      icon: MapPin,
      gradient: 'from-destructive to-warning',
    },
    {
      title: 'Braço Projetado',
      previsto: totaisGerais?.prevBracosProj || 0,
      instalado: 0, // Não há campo instalado ainda
      icon: Sparkles,
      gradient: 'from-primary to-success',
    },
    {
      title: 'Semi Pórtico',
      previsto: totaisGerais?.prevSemiPorticos || 0,
      instalado: 0, // Não há campo instalado ainda
      icon: Filter,
      gradient: 'from-info to-accent',
    },
    // Infraestrutura
    {
      title: 'Bases',
      previsto: totaisGerais?.prevBases || 0,
      instalado: totaisGerais?.instBases || 0,
      icon: Wrench,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Laços',
      previsto: totaisGerais?.prevLacos || 0,
      instalado: totaisGerais?.instLacos || 0,
      icon: Wrench,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Postes Infra',
      previsto: totaisGerais?.prevPostesInfra || 0,
      instalado: totaisGerais?.instPostesInfra || 0,
      icon: Wrench,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Conectorizacao',
      previsto: totaisGerais?.prevConectorizacao || 0,
      instalado: totaisGerais?.instConectorizacao || 0,
      icon: Wrench,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Ajustes',
      previsto: totaisGerais?.prevAjustes || 0,
      instalado: totaisGerais?.instAjustes || 0,
      icon: Wrench,
      gradient: 'from-rose-500 to-pink-600',
    },
    {
      title: 'Aferição',
      previsto: totaisGerais?.prevAfericao || 0,
      instalado: totaisGerais?.instAfericao || 0,
      icon: Wrench,
      gradient: 'from-slate-500 to-gray-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Dashboard</h1>
          <Sparkles className="w-6 h-6 text-warning animate-pulse-soft" />
        </div>
        <p className="page-description">Visão geral do sistema - Previsão vs Instalado</p>
      </div>

      {/* Filtros */}
      <Card className="shadow-soft">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Contrato</label>
                <Select value={filtroContrato} onValueChange={setFiltroContrato}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os contratos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os contratos</SelectItem>
                    {contratos?.map((contrato) => (
                      <SelectItem key={contrato.id} value={contrato.id}>
                        {contrato.id_contrato} - {contrato.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Equipamento</label>
                <Select value={filtroEquipamento} onValueChange={setFiltroEquipamento}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os equipamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os equipamentos</SelectItem>
                    {equipamentosRaw?.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.numero_serie} - {eq.municipio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(filtroContrato !== 'todos' || filtroEquipamento !== 'todos') && (
              <button 
                onClick={() => {
                  setFiltroContrato('todos');
                  setFiltroEquipamento('todos');
                }}
                className="text-sm text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Materiais */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {materialCards.map((mat, index) => {
          const percent = calcPercent(mat.instalado, mat.previsto);
          return (
            <Card 
              key={mat.title} 
              className="stat-card group overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mat.gradient}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">{mat.title}</CardTitle>
                <div className="icon-container w-8 h-8 bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <mat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold bg-gradient-to-r ${mat.gradient} bg-clip-text text-transparent`}>
                    {mat.instalado}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {mat.previsto}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${mat.gradient} transition-all duration-500`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico de Status de Documentos */}
      <Card className="shadow-soft overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning via-destructive to-success" />
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-destructive/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-warning" />
          </div>
          <div>
            <CardTitle>Status de Documentos</CardTitle>
            <CardDescription>Arquivos pendentes de upload por tipo</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {equipamentos && equipamentos.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Resumo em Cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                  <FileCheck className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{documentStatus.complete}</p>
                    <p className="text-sm text-muted-foreground">Documentos Enviados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <FileX className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{documentStatus.incomplete}</p>
                    <p className="text-sm text-muted-foreground">Documentos Pendentes</p>
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {documentStatus.total > 0 
                      ? `${Math.round((documentStatus.complete / documentStatus.total) * 100)}% completo`
                      : '0% completo'
                    }
                  </p>
                </div>
              </div>

              {/* Gráfico de Barras Horizontais */}
              <div className="lg:col-span-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={documentStatus.byType} 
                    layout="vertical"
                    barGap={4}
                  >
                    <defs>
                      <linearGradient id="gradEnviados" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(160, 84%, 50%)" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="gradPendentes" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(0, 72%, 60%)" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis 
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={130}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '10px',
                        boxShadow: '0 8px 30px hsl(var(--foreground) / 0.1)',
                        fontSize: '12px',
                      }}
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar 
                      dataKey="enviados" 
                      fill="url(#gradEnviados)" 
                      name="Enviados" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={25}
                    />
                    <Bar 
                      dataKey="pendentes" 
                      fill="url(#gradPendentes)" 
                      name="Pendentes" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={25}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p>Nenhum equipamento cadastrado</p>
              <p className="text-sm opacity-70">Cadastre equipamentos para acompanhar os documentos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico Geral Consolidado */}
      <Card className="shadow-soft overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-warning" />
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Resumo Geral - Previsão x Instalado</CardTitle>
            <CardDescription>Totais consolidados de todos os equipamentos</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {chartDataGeral.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataGeral} barGap={8}>
                  <defs>
                    <linearGradient id="gradPrevistoGeral" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="gradInstaladoGeral" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px hsl(var(--foreground) / 0.15)',
                    }}
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar 
                    dataKey="previsto" 
                    fill="url(#gradPrevistoGeral)" 
                    name="Previsto" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar 
                    dataKey="instalado" 
                    fill="url(#gradInstaladoGeral)" 
                    name="Instalado" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="h-12 w-12 mb-3 opacity-30" />
              <p>Nenhuma previsão cadastrada</p>
              <p className="text-sm opacity-70">Configure previsões nos equipamentos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
