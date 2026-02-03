import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Radio, ArrowUpDown, ArrowLeftRight, Package, TrendingUp } from 'lucide-react';

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Visão geral do sistema de implantação de radares</p>
      </div>

      {/* Cards de Equipamentos */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="stat-card group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Equipamentos</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Radio className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEquipamentos}</div>
            <p className="text-xs text-muted-foreground mt-1">equipamentos cadastrados</p>
          </CardContent>
        </Card>
        <Card className="stat-card group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Sinalização Vertical</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpDown className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{comVertical}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEquipamentos > 0 ? `${((comVertical / totalEquipamentos) * 100).toFixed(0)}% do total` : '0% do total'}
            </p>
          </CardContent>
        </Card>
        <Card className="stat-card group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Sinalização Horizontal</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{comHorizontal}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEquipamentos > 0 ? `${((comHorizontal / totalEquipamentos) * 100).toFixed(0)}% do total` : '0% do total'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Materiais Verticais */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Materiais Verticais</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pontaletes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPontaletes}</div>
              <p className="text-xs text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Perfis Metálicos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPerfis}</div>
              <p className="text-xs text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Postes Colapsíveis</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPostesColapsiveis}</div>
              <p className="text-xs text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards de Materiais Horizontais */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Materiais Horizontais</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lâminas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLaminas}</div>
              <p className="text-xs text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Postes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPostes}</div>
              <p className="text-xs text-muted-foreground mt-1">unidades</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráfico */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Materiais por Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="pontaletes" fill="hsl(217 91% 50%)" name="Pontaletes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perfis" fill="hsl(142 76% 36%)" name="Perfis" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="postes_colapsiveis" fill="hsl(38 92% 50%)" name="Postes Col." radius={[4, 4, 0, 0]} />
                  <Bar dataKey="laminas" fill="hsl(215 16% 47%)" name="Lâminas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível para exibir
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
