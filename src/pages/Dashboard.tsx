import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Radio, ArrowUpDown, ArrowLeftRight, Package } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de implantação de radares</p>
      </div>

      {/* Cards de Equipamentos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipamentos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Com Sinalização Vertical</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comVertical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Com Sinalização Horizontal</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comHorizontal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Materiais Verticais */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Materiais Verticais</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pontaletes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPontaletes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Perfis Metálicos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPerfis}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Postes Colapsíveis</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPostesColapsiveis}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards de Materiais Horizontais */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Materiais Horizontais</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lâminas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLaminas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Postes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPostes}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Materiais por Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pontaletes" fill="hsl(var(--primary))" name="Pontaletes" />
                  <Bar dataKey="perfis" fill="hsl(var(--secondary))" name="Perfis" />
                  <Bar dataKey="postes_colapsiveis" fill="hsl(var(--accent))" name="Postes Col." />
                  <Bar dataKey="laminas" fill="hsl(var(--muted))" name="Lâminas" />
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
