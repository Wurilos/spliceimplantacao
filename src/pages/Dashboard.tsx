import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Radio, ArrowUpDown, ArrowLeftRight, Sparkles, Activity, ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface EquipamentoComPrevisao {
  id: string;
  numero_serie: string;
  municipio: string;
  endereco: string;
  tipo_equipamento: string | null;
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
  // Instalado Vertical
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
  // Query para buscar equipamentos com previsão e totais instalados
  const { data: equipamentos, isLoading } = useQuery({
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
        // Totais verticais
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
          prev_placas: eq.prev_placas || 0,
          prev_pontaletes: eq.prev_pontaletes || 0,
          prev_postes_colapsiveis: eq.prev_postes_colapsiveis || 0,
          prev_bracos_projetados: eq.prev_bracos_projetados || 0,
          prev_semi_porticos: eq.prev_semi_porticos || 0,
          prev_defensas: eq.prev_defensas || 0,
          prev_postes_horizontal: eq.prev_postes_horizontal || 0,
          prev_tae_80: eq.prev_tae_80 || 0,
          prev_tae_100: eq.prev_tae_100 || 0,
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

  // Calcular totais gerais
  const totais = equipamentos?.reduce((acc, eq) => ({
    totalEquipamentos: acc.totalEquipamentos + 1,
    prevPontaletes: acc.prevPontaletes + eq.prev_pontaletes,
    instPontaletes: acc.instPontaletes + eq.instalado_pontaletes,
    prevPostesCol: acc.prevPostesCol + eq.prev_postes_colapsiveis,
    instPostesCol: acc.instPostesCol + eq.instalado_postes_colapsiveis,
    prevDefensas: acc.prevDefensas + eq.prev_defensas,
    instDefensas: acc.instDefensas + eq.instalado_laminas,
  }), {
    totalEquipamentos: 0,
    prevPontaletes: 0,
    instPontaletes: 0,
    prevPostesCol: 0,
    instPostesCol: 0,
    prevDefensas: 0,
    instDefensas: 0,
  });

  // Gerar dados para gráfico de um equipamento
  const getChartData = (eq: EquipamentoComPrevisao) => [
    { name: 'Pontaletes', previsto: eq.prev_pontaletes, instalado: eq.instalado_pontaletes },
    { name: 'Postes Col.', previsto: eq.prev_postes_colapsiveis, instalado: eq.instalado_postes_colapsiveis },
    { name: 'Defensas', previsto: eq.prev_defensas, instalado: eq.instalado_laminas },
    { name: 'Postes Hor.', previsto: eq.prev_postes_horizontal, instalado: eq.instalado_postes },
    { name: 'TAE 80', previsto: eq.prev_tae_80, instalado: eq.instalado_tae_80 },
    { name: 'TAE 100', previsto: eq.prev_tae_100, instalado: eq.instalado_tae_100 },
  ].filter(item => item.previsto > 0 || item.instalado > 0);

  const statsCards = [
    {
      title: 'Total de Equipamentos',
      value: totais?.totalEquipamentos || 0,
      subtitle: 'equipamentos cadastrados',
      icon: Radio,
      gradient: 'from-primary to-accent',
    },
    {
      title: 'Pontaletes',
      value: `${totais?.instPontaletes || 0} / ${totais?.prevPontaletes || 0}`,
      subtitle: 'instalados / previstos',
      icon: ArrowUpDown,
      gradient: 'from-success to-info',
    },
    {
      title: 'Defensas',
      value: `${totais?.instDefensas || 0} / ${totais?.prevDefensas || 0}`,
      subtitle: 'instaladas / previstas',
      icon: ArrowLeftRight,
      gradient: 'from-warning to-destructive',
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
        <p className="page-description">Visão geral do sistema - Previsão vs Instalado por equipamento</p>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        {statsCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="stat-card group overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="icon-container bg-primary/10 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Listagem de Equipamentos com Gráficos */}
      <div>
        <div className="section-header">
          <div className="section-header-icon bg-gradient-to-br from-primary/20 to-accent/20">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <h2 className="section-header-title">Equipamentos - Previsão x Instalado</h2>
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
                      
                      {/* Resumo rápido */}
                      <div className="mt-6 pt-4 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Resumo Previsão</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pontaletes:</span>
                            <span className="font-semibold">{eq.prev_pontaletes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Postes Col.:</span>
                            <span className="font-semibold">{eq.prev_postes_colapsiveis}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Defensas:</span>
                            <span className="font-semibold">{eq.prev_defensas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TAE:</span>
                            <span className="font-semibold">{eq.prev_tae_80 + eq.prev_tae_100}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gráfico */}
                    <div className="lg:w-2/3 p-6">
                      {hasData ? (
                        <div className="h-52">
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
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={false}
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
                                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                              />
                              <Bar 
                                dataKey="previsto" 
                                fill={`url(#gradPrev-${eq.id})`} 
                                name="Previsto" 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={35}
                              />
                              <Bar 
                                dataKey="instalado" 
                                fill={`url(#gradInst-${eq.id})`}
                                name="Instalado" 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={35}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-52 flex flex-col items-center justify-center text-muted-foreground">
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
