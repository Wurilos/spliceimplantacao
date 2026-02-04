import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Radio, ArrowUpDown, ArrowLeftRight, Package, TrendingUp, Sparkles, Activity } from 'lucide-react';

export default function Dashboard() {
  // Métricas de equipamentos
  const { data: equipamentos } = useQuery({
    queryKey: ['dashboard-equipamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, tem_sinalizacao_vertical, tem_sinalizacao_horizontal');
      if (error) throw error;
      return data;
    },
  });

  // Métricas de sinalização vertical
  const { data: sinalizacaoVertical } = useQuery({
    queryKey: ['dashboard-sinalizacao-vertical'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sinalizacao_vertical_blocos')
        .select('qtd_pontaletes, qtd_perfis_metalicos, qtd_postes_colapsiveis');
      if (error) throw error;
      return data;
    },
  });

  // Métricas de sinalização horizontal
  const { data: sinalizacaoHorizontal } = useQuery({
    queryKey: ['dashboard-sinalizacao-horizontal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sinalizacao_horizontal_itens')
        .select('qtd_laminas, qtd_postes');
      if (error) throw error;
      return data;
    },
  });

  // Dados para gráfico por contrato
  const { data: chartData } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          contrato_id,
          contratos (id_contrato, nome),
          sinalizacao_vertical_blocos (qtd_pontaletes, qtd_perfis_metalicos, qtd_postes_colapsiveis),
          sinalizacao_horizontal_itens (qtd_laminas, qtd_postes)
        `);
      if (error) throw error;

      // Agregar por contrato
      const contratoMap = new Map<string, { nome: string; pontaletes: number; perfis: number; postes_colapsiveis: number; laminas: number; postes: number }>();
      
      data?.forEach((eq: any) => {
        const contratoNome = eq.contratos?.nome || 'Sem contrato';
        const existing = contratoMap.get(contratoNome) || { nome: contratoNome, pontaletes: 0, perfis: 0, postes_colapsiveis: 0, laminas: 0, postes: 0 };
        
        eq.sinalizacao_vertical_blocos?.forEach((sv: any) => {
          existing.pontaletes += sv.qtd_pontaletes || 0;
          existing.perfis += sv.qtd_perfis_metalicos || 0;
          existing.postes_colapsiveis += sv.qtd_postes_colapsiveis || 0;
        });
        
        eq.sinalizacao_horizontal_itens?.forEach((sh: any) => {
          existing.laminas += sh.qtd_laminas || 0;
          existing.postes += sh.qtd_postes || 0;
        });
        
        contratoMap.set(contratoNome, existing);
      });
      
      return Array.from(contratoMap.values());
    },
  });

  // Calcular totais
  const totalEquipamentos = equipamentos?.length || 0;
  const comVertical = equipamentos?.filter(e => e.tem_sinalizacao_vertical).length || 0;
  const comHorizontal = equipamentos?.filter(e => e.tem_sinalizacao_horizontal).length || 0;

  const totalPontaletes = sinalizacaoVertical?.reduce((acc, sv) => acc + (sv.qtd_pontaletes || 0), 0) || 0;
  const totalPerfis = sinalizacaoVertical?.reduce((acc, sv) => acc + (sv.qtd_perfis_metalicos || 0), 0) || 0;
  const totalPostesColapsiveis = sinalizacaoVertical?.reduce((acc, sv) => acc + (sv.qtd_postes_colapsiveis || 0), 0) || 0;

  const totalLaminas = sinalizacaoHorizontal?.reduce((acc, sh) => acc + (sh.qtd_laminas || 0), 0) || 0;
  const totalPostes = sinalizacaoHorizontal?.reduce((acc, sh) => acc + (sh.qtd_postes || 0), 0) || 0;

  const statsCards = [
    {
      title: 'Total de Equipamentos',
      value: totalEquipamentos,
      subtitle: 'equipamentos cadastrados',
      icon: Radio,
      gradient: 'from-primary to-accent',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Com Sinalização Vertical',
      value: comVertical,
      subtitle: totalEquipamentos > 0 ? `${((comVertical / totalEquipamentos) * 100).toFixed(0)}% do total` : '0% do total',
      icon: ArrowUpDown,
      gradient: 'from-success to-info',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: 'Com Sinalização Horizontal',
      value: comHorizontal,
      subtitle: totalEquipamentos > 0 ? `${((comHorizontal / totalEquipamentos) * 100).toFixed(0)}% do total` : '0% do total',
      icon: ArrowLeftRight,
      gradient: 'from-warning to-destructive',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">Dashboard</h1>
          <Sparkles className="w-6 h-6 text-warning animate-pulse-soft" />
        </div>
        <p className="page-description">Visão geral do sistema de implantação de radares</p>
      </div>

      {/* Cards de Equipamentos */}
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
              <div className={`icon-container ${stat.iconBg} group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards de Materiais Verticais */}
      <div>
        <div className="section-header">
          <div className="section-header-icon bg-gradient-to-br from-success/20 to-info/20">
            <ArrowUpDown className="h-5 w-5 text-success" />
          </div>
          <h2 className="section-header-title">Materiais Verticais</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { label: 'Pontaletes', value: totalPontaletes, color: 'from-primary to-primary/70' },
            { label: 'Perfis Metálicos', value: totalPerfis, color: 'from-success to-success/70' },
            { label: 'Postes Colapsíveis', value: totalPostesColapsiveis, color: 'from-info to-info/70' },
          ].map((item, index) => (
            <Card key={item.label} className="hover-lift group" style={{ animationDelay: `${(index + 3) * 100}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                  {item.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">unidades</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cards de Materiais Horizontais */}
      <div>
        <div className="section-header">
          <div className="section-header-icon bg-gradient-to-br from-warning/20 to-destructive/20">
            <ArrowLeftRight className="h-5 w-5 text-warning" />
          </div>
          <h2 className="section-header-title">Materiais Horizontais</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { label: 'Lâminas', value: totalLaminas, color: 'from-warning to-warning/70' },
            { label: 'Postes', value: totalPostes, color: 'from-destructive to-destructive/70' },
          ].map((item, index) => (
            <Card key={item.label} className="hover-lift group" style={{ animationDelay: `${(index + 6) * 100}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground group-hover:text-warning transition-colors" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                  {item.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">unidades</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <Card className="card-elevated overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-warning" />
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Materiais por Contrato</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Distribuição de materiais por contrato</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="gradientPontaletes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="gradientPerfis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="gradientPostes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="gradientLaminas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="nome" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px hsl(var(--foreground) / 0.15)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="pontaletes" fill="url(#gradientPontaletes)" name="Pontaletes" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="perfis" fill="url(#gradientPerfis)" name="Perfis" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="postes_colapsiveis" fill="url(#gradientPostes)" name="Postes Col." radius={[6, 6, 0, 0]} />
                  <Bar dataKey="laminas" fill="url(#gradientLaminas)" name="Lâminas" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Activity className="w-12 h-12 opacity-50" />
                <p>Nenhum dado disponível para exibir</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
