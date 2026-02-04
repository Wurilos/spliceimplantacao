import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Radio, Sparkles, Activity, ChevronRight, MapPin, TrendingUp, Filter } from 'lucide-react';
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
          sinalizacao_vertical_blocos (qtd_pontaletes, qtd_perfis_metalicos, qtd_postes_colapsiveis),
          sinalizacao_horizontal_itens (tipo, qtd_laminas, qtd_postes)
        `);
      
      if (eqError) throw eqError;

      // Processar os dados para calcular totais instalados
      const processedData: EquipamentoComPrevisao[] = (eqData || []).map((eq: any) => {
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
          instalado_placas,
          instalado_pontaletes,
          instalado_perfis,
          instalado_postes_colapsiveis,
          instalado_laminas,
          instalado_postes,
          instalado_tae_80,
          instalado_tae_100,
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
  ].filter(item => item.previsto > 0 || item.instalado > 0);

  // Calcular total geral previsto e instalado
  const totalPrevisto = (totaisGerais?.prevPlacas || 0) + (totaisGerais?.prevPontaletes || 0) + 
    (totaisGerais?.prevPostesCol || 0) + (totaisGerais?.prevBracosProj || 0) + 
    (totaisGerais?.prevSemiPorticos || 0) + (totaisGerais?.prevDefensas || 0) + 
    (totaisGerais?.prevPostesHor || 0) + (totaisGerais?.prevTae80 || 0) + (totaisGerais?.prevTae100 || 0);
  
  const totalInstalado = (totaisGerais?.instPlacas || 0) + (totaisGerais?.instPontaletes || 0) + 
    (totaisGerais?.instPostesCol || 0) + (totaisGerais?.instDefensas || 0) + 
    (totaisGerais?.instPostesHor || 0) + (totaisGerais?.instTae80 || 0) + (totaisGerais?.instTae100 || 0);

  const percentualConcluido = totalPrevisto > 0 ? Math.round((totalInstalado / totalPrevisto) * 100) : 0;

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

      {/* Listagem de Equipamentos com Gráficos */}
      <div>
        <div className="section-header">
          <div className="section-header-icon bg-gradient-to-br from-primary/20 to-accent/20">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <h2 className="section-header-title">Equipamentos - Detalhamento Individual</h2>
        </div>
        
        <div className="space-y-4">
          {equipamentos?.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <Radio className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhum equipamento cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            equipamentos?.map((eq, index) => {
              const chartData = getChartData(eq);
              const hasData = chartData.length > 0;

              // Calcular totais do equipamento
              const eqTotalPrev = eq.prev_placas + eq.prev_pontaletes + eq.prev_postes_colapsiveis + 
                eq.prev_bracos_projetados + eq.prev_semi_porticos + eq.prev_defensas + 
                eq.prev_postes_horizontal + eq.prev_tae_80 + eq.prev_tae_100;
              const eqTotalInst = eq.instalado_placas + eq.instalado_pontaletes + eq.instalado_postes_colapsiveis + 
                eq.instalado_laminas + eq.instalado_postes + eq.instalado_tae_80 + eq.instalado_tae_100;
              const eqPercent = eqTotalPrev > 0 ? Math.round((eqTotalInst / eqTotalPrev) * 100) : 0;

              return (
                <Card 
                  key={eq.id}
                  className="shadow-soft hover:shadow-md transition-all duration-300 overflow-hidden group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Info do Equipamento */}
                    <div className="lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-border/50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {eq.numero_serie}
                            </Badge>
                            {eq.tipo_equipamento && (
                              <Badge className="bg-primary/10 text-primary border-0">
                                {eq.tipo_equipamento}
                              </Badge>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{eq.municipio}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {eq.endereco}
                            </p>
                          </div>
                        </div>
                        <Link 
                          to={`/equipamentos/${eq.id}`}
                          className="p-2 rounded-lg hover:bg-primary/10 transition-colors group-hover:text-primary"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </div>
                      
                      {/* Resumo com progresso */}
                      <div className="mt-6 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progresso</p>
                          <Badge variant={eqPercent >= 100 ? "default" : eqPercent >= 50 ? "secondary" : "outline"} className={eqPercent >= 100 ? "bg-success text-success-foreground" : ""}>
                            {eqPercent}%
                          </Badge>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                            style={{ width: `${Math.min(eqPercent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>Instalado: {eqTotalInst}</span>
                          <span>Previsto: {eqTotalPrev}</span>
                        </div>
                      </div>

                      {/* Grid de previsão */}
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Detalhes Previsão</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {eq.prev_placas > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Placas:</span>
                              <span className="font-semibold">{eq.prev_placas}</span>
                            </div>
                          )}
                          {eq.prev_pontaletes > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pontaletes:</span>
                              <span className="font-semibold">{eq.prev_pontaletes}</span>
                            </div>
                          )}
                          {eq.prev_postes_colapsiveis > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Postes Col.:</span>
                              <span className="font-semibold">{eq.prev_postes_colapsiveis}</span>
                            </div>
                          )}
                          {eq.prev_bracos_projetados > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Braço Proj.:</span>
                              <span className="font-semibold">{eq.prev_bracos_projetados}</span>
                            </div>
                          )}
                          {eq.prev_semi_porticos > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Semi Pórt.:</span>
                              <span className="font-semibold">{eq.prev_semi_porticos}</span>
                            </div>
                          )}
                          {eq.prev_defensas > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Defensas:</span>
                              <span className="font-semibold">{eq.prev_defensas}</span>
                            </div>
                          )}
                          {eq.prev_postes_horizontal > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Postes Hor.:</span>
                              <span className="font-semibold">{eq.prev_postes_horizontal}</span>
                            </div>
                          )}
                          {(eq.prev_tae_80 > 0 || eq.prev_tae_100 > 0) && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">TAE:</span>
                              <span className="font-semibold">{eq.prev_tae_80 + eq.prev_tae_100}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gráfico */}
                    <div className="lg:w-2/3 p-6">
                      {hasData ? (
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barGap={4}>
                              <defs>
                                <linearGradient id={`gradPrev-${eq.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.5} />
                                </linearGradient>
                                <linearGradient id={`gradInst-${eq.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.5} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={false}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={30}
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
                              <Legend 
                                iconType="circle" 
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                              />
                              <Bar 
                                dataKey="previsto" 
                                fill={`url(#gradPrev-${eq.id})`} 
                                name="Previsto" 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={30}
                              />
                              <Bar 
                                dataKey="instalado" 
                                fill={`url(#gradInst-${eq.id})`}
                                name="Instalado" 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={30}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
                          <Activity className="h-10 w-10 mb-2 opacity-30" />
                          <p className="text-sm">Sem dados de previsão</p>
                          <p className="text-xs opacity-70">Configure a previsão no cadastro do equipamento</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
