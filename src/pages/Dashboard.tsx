import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Radio, Sparkles, Activity, TrendingUp, Filter, FileText, FileCheck, FileX, Wrench, ArrowUpDown, ArrowLeftRight, CheckCircle2, AlertCircle, Package, BarChart3, Settings2, Upload, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContratos } from '@/hooks/useContratos';
import { TIPOS_MATERIAIS } from '@/hooks/useMateriaisRecebidos';

interface ProgressItem {
  name: string;
  previsto: number;
  instalado: number;
  percentual: number;
}

export default function Dashboard() {
  const [filtroContrato, setFiltroContrato] = useState<string>('todos');
  const [filtroEquipamento, setFiltroEquipamento] = useState<string>('todos');

  const { data: contratos } = useContratos();

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
          tipo_conexao,
          tipo_energia,
          conexao_instalada,
          energia_instalada,
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
          relatorio_vdm_url,
          declaracao_conformidade_url,
          sinalizacao_vertical_blocos (qtd_pontaletes, qtd_perfis_metalicos, qtd_postes_colapsiveis, categoria),
          sinalizacao_horizontal_itens (tipo, qtd_laminas, qtd_postes),
          infraestrutura_itens (tipo, quantidade, categoria_item_id),
          operacional_itens (tipo, quantidade)
        `);
      
      if (eqError) throw eqError;

      // Fetch equipamento_previsoes with categoria_itens names
      const { data: previsoesData, error: prevError } = await supabase
        .from('equipamento_previsoes')
        .select(`
          equipamento_id,
          categoria_item_id,
          quantidade_prevista,
          categoria_itens:categoria_item_id (id, nome, categoria_id)
        `);
      
      if (prevError) throw prevError;

      // Fetch infraestrutura category to filter previsoes
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('id, nome')
        .ilike('nome', '%Infraestrutura%');
      
      const infraCategoriaIds = (categoriasData || []).map(c => c.id);

      // Build a map of previsoes per equipamento
      const previsoesMap: Record<string, Array<{ categoria_item_id: string; nome: string; quantidade_prevista: number }>> = {};
      (previsoesData || []).forEach((p: any) => {
        const catItem = p.categoria_itens;
        if (!catItem || !infraCategoriaIds.includes(catItem.categoria_id)) return;
        if (!previsoesMap[p.equipamento_id]) previsoesMap[p.equipamento_id] = [];
        previsoesMap[p.equipamento_id].push({
          categoria_item_id: p.categoria_item_id,
          nome: catItem.nome,
          quantidade_prevista: p.quantidade_prevista,
        });
      });

      const processedData = (eqData || []).map((eq: any) => {
        let instalado_placas = eq.sinalizacao_vertical_blocos?.filter((sv: any) => sv.categoria === 'placas').length || 0;
        let instalado_pontaletes = 0;
        let instalado_perfis = 0;
        let instalado_postes_colapsiveis = 0;
        let instalado_bracos_projetados = eq.sinalizacao_vertical_blocos?.filter((sv: any) => sv.categoria === 'braco_projetado').length || 0;
        let instalado_semi_porticos = eq.sinalizacao_vertical_blocos?.filter((sv: any) => sv.categoria === 'semi_portico').length || 0;
        
        eq.sinalizacao_vertical_blocos?.forEach((sv: any) => {
          instalado_pontaletes += sv.qtd_pontaletes || 0;
          instalado_perfis += sv.qtd_perfis_metalicos || 0;
          instalado_postes_colapsiveis += sv.qtd_postes_colapsiveis || 0;
        });

        let instalado_laminas = 0;
        let instalado_postes = 0;
        let instalado_tae_80 = 0;
        let instalado_tae_100 = 0;

        eq.sinalizacao_horizontal_itens?.forEach((sh: any) => {
          const tipoLower = sh.tipo?.toLowerCase() || '';
          if (tipoLower.includes('defensa')) {
            instalado_laminas += sh.qtd_laminas || 0;
            instalado_postes += sh.qtd_postes || 0;
          } else if (tipoLower.includes('tae 80') || tipoLower.includes('tae_80')) {
            instalado_tae_80 += 1;
          } else if (tipoLower.includes('tae 100') || tipoLower.includes('tae_100')) {
            instalado_tae_100 += 1;
          }
        });

        // Build infraestrutura installed totals by categoria_item_id
        const infraInstaladoPorCat: Record<string, number> = {};
        eq.infraestrutura_itens?.forEach((inf: any) => {
          if (inf.categoria_item_id) {
            infraInstaladoPorCat[inf.categoria_item_id] = (infraInstaladoPorCat[inf.categoria_item_id] || 0) + (inf.quantidade || 0);
          }
        });

        // Use equipamento_previsoes for infra previsao/instalado
        const eqPrevisoes = previsoesMap[eq.id] || [];
        let instalado_bases = 0, instalado_lacos = 0, instalado_postes_infra = 0, instalado_conectorizacao = 0;
        let prev_bases_dyn = 0, prev_lacos_dyn = 0, prev_postes_infra_dyn = 0, prev_conectorizacao_dyn = 0;
        eqPrevisoes.forEach(p => {
          const nomeLower = p.nome.toLowerCase();
          const instalado = infraInstaladoPorCat[p.categoria_item_id] || 0;
          if (nomeLower.includes('base')) { instalado_bases += instalado; prev_bases_dyn += p.quantidade_prevista; }
          else if (nomeLower.includes('laço') || nomeLower.includes('laco')) { instalado_lacos += instalado; prev_lacos_dyn += p.quantidade_prevista; }
          else if (nomeLower.includes('poste')) { instalado_postes_infra += instalado; prev_postes_infra_dyn += p.quantidade_prevista; }
          else if (nomeLower.includes('conectoriza')) { instalado_conectorizacao += instalado; prev_conectorizacao_dyn += p.quantidade_prevista; }
        });

        // Processar itens operacionais
        let instalado_ajustes = 0;
        let instalado_afericao = 0;
        eq.operacional_itens?.forEach((op: any) => {
          const tipoLower = op.tipo?.toLowerCase() || '';
          if (tipoLower.includes('ajuste')) {
            instalado_ajustes += op.quantidade || 0;
          } else if (tipoLower.includes('aferi') || tipoLower.includes('aferição')) {
            instalado_afericao += op.quantidade || 0;
          }
        });

        return {
          ...eq,
          instalado_placas,
          instalado_pontaletes,
          instalado_perfis,
          instalado_postes_colapsiveis,
          instalado_bracos_projetados,
          instalado_semi_porticos,
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
          prev_bases_dyn,
          prev_lacos_dyn,
          prev_postes_infra_dyn,
          prev_conectorizacao_dyn,
        };
      });

      return processedData;
    },
  });

  // Query para materiais recebidos
  const { data: materiaisRecebidos } = useQuery({
    queryKey: ['dashboard-materiais-recebidos', filtroContrato],
    queryFn: async () => {
      let query = supabase
        .from('materiais_recebidos')
        .select('*');
      
      if (filtroContrato !== 'todos') {
        query = query.eq('contrato_id', filtroContrato);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const equipamentos = useMemo(() => {
    if (!equipamentosRaw) return [];
    return equipamentosRaw.filter(eq => {
      const matchContrato = filtroContrato === 'todos' || eq.contrato_id === filtroContrato;
      const matchEquipamento = filtroEquipamento === 'todos' || eq.id === filtroEquipamento;
      return matchContrato && matchEquipamento;
    });
  }, [equipamentosRaw, filtroContrato, filtroEquipamento]);

  const calcPercent = (instalado: number, previsto: number) => 
    previsto > 0 ? Math.min(100, Math.round((instalado / previsto) * 100)) : 0;

  // Calcular totais e progresso por categoria
  const progressData = useMemo(() => {
    if (!equipamentos || equipamentos.length === 0) return null;

    const totaisPrev = {
      placas: equipamentos.reduce((acc, eq) => acc + (eq.prev_placas || 0), 0),
      pontaletes: equipamentos.reduce((acc, eq) => acc + (eq.prev_pontaletes || 0), 0),
      postesColapsiveis: equipamentos.reduce((acc, eq) => acc + (eq.prev_postes_colapsiveis || 0), 0),
      bracosProjetados: equipamentos.reduce((acc, eq) => acc + (eq.prev_bracos_projetados || 0), 0),
      semiPorticos: equipamentos.reduce((acc, eq) => acc + (eq.prev_semi_porticos || 0), 0),
      defensas: equipamentos.reduce((acc, eq) => acc + (eq.prev_defensas || 0), 0),
      postesHorizontal: equipamentos.reduce((acc, eq) => acc + (eq.prev_postes_horizontal || 0), 0),
      tae80: equipamentos.reduce((acc, eq) => acc + (eq.prev_tae_80 || 0), 0),
      tae100: equipamentos.reduce((acc, eq) => acc + (eq.prev_tae_100 || 0), 0),
      bases: equipamentos.reduce((acc, eq) => acc + (eq.prev_bases_dyn || 0), 0),
      lacos: equipamentos.reduce((acc, eq) => acc + (eq.prev_lacos_dyn || 0), 0),
      postesInfra: equipamentos.reduce((acc, eq) => acc + (eq.prev_postes_infra_dyn || 0), 0),
      conectorizacao: equipamentos.reduce((acc, eq) => acc + (eq.prev_conectorizacao_dyn || 0), 0),
      ajustes: equipamentos.reduce((acc, eq) => acc + (eq.prev_ajustes || 0), 0),
      afericao: equipamentos.reduce((acc, eq) => acc + (eq.prev_afericao || 0), 0),
    };

    const totaisInst = {
      placas: equipamentos.reduce((acc, eq) => acc + (eq.instalado_placas || 0), 0),
      pontaletes: equipamentos.reduce((acc, eq) => acc + (eq.instalado_pontaletes || 0), 0),
      postesColapsiveis: equipamentos.reduce((acc, eq) => acc + (eq.instalado_postes_colapsiveis || 0), 0),
      bracosProjetados: equipamentos.reduce((acc, eq) => acc + (eq.instalado_bracos_projetados || 0), 0),
      semiPorticos: equipamentos.reduce((acc, eq) => acc + (eq.instalado_semi_porticos || 0), 0),
      defensas: equipamentos.reduce((acc, eq) => acc + (eq.instalado_laminas || 0), 0),
      postesHorizontal: equipamentos.reduce((acc, eq) => acc + (eq.instalado_postes || 0), 0),
      tae80: equipamentos.reduce((acc, eq) => acc + (eq.instalado_tae_80 || 0), 0),
      tae100: equipamentos.reduce((acc, eq) => acc + (eq.instalado_tae_100 || 0), 0),
      bases: equipamentos.reduce((acc, eq) => acc + (eq.instalado_bases || 0), 0),
      lacos: equipamentos.reduce((acc, eq) => acc + (eq.instalado_lacos || 0), 0),
      postesInfra: equipamentos.reduce((acc, eq) => acc + (eq.instalado_postes_infra || 0), 0),
      conectorizacao: equipamentos.reduce((acc, eq) => acc + (eq.instalado_conectorizacao || 0), 0),
      ajustes: equipamentos.reduce((acc, eq) => acc + (eq.instalado_ajustes || 0), 0),
      afericao: equipamentos.reduce((acc, eq) => acc + (eq.instalado_afericao || 0), 0),
    };

    const sinalizacaoVerticalProgress: ProgressItem[] = [
      { name: 'Placas', previsto: totaisPrev.placas, instalado: totaisInst.placas, percentual: calcPercent(totaisInst.placas, totaisPrev.placas) },
      { name: 'Pontaletes', previsto: totaisPrev.pontaletes, instalado: totaisInst.pontaletes, percentual: calcPercent(totaisInst.pontaletes, totaisPrev.pontaletes) },
      { name: 'Postes Colapsíveis', previsto: totaisPrev.postesColapsiveis, instalado: totaisInst.postesColapsiveis, percentual: calcPercent(totaisInst.postesColapsiveis, totaisPrev.postesColapsiveis) },
      { name: 'Braços Projetados', previsto: totaisPrev.bracosProjetados, instalado: totaisInst.bracosProjetados, percentual: calcPercent(totaisInst.bracosProjetados, totaisPrev.bracosProjetados) },
      { name: 'Semi Pórticos', previsto: totaisPrev.semiPorticos, instalado: totaisInst.semiPorticos, percentual: calcPercent(totaisInst.semiPorticos, totaisPrev.semiPorticos) },
    ];

    const sinalizacaoHorizontalProgress: ProgressItem[] = [
      { name: 'Defensas', previsto: totaisPrev.defensas, instalado: totaisInst.defensas, percentual: calcPercent(totaisInst.defensas, totaisPrev.defensas) },
      { name: 'Postes', previsto: totaisPrev.postesHorizontal, instalado: totaisInst.postesHorizontal, percentual: calcPercent(totaisInst.postesHorizontal, totaisPrev.postesHorizontal) },
      { name: 'TAE 80 km/h', previsto: totaisPrev.tae80, instalado: totaisInst.tae80, percentual: calcPercent(totaisInst.tae80, totaisPrev.tae80) },
      { name: 'TAE 100 km/h', previsto: totaisPrev.tae100, instalado: totaisInst.tae100, percentual: calcPercent(totaisInst.tae100, totaisPrev.tae100) },
    ];

    const infraestruturaProgress: ProgressItem[] = [
      { name: 'Bases', previsto: totaisPrev.bases, instalado: totaisInst.bases, percentual: calcPercent(totaisInst.bases, totaisPrev.bases) },
      { name: 'Laços', previsto: totaisPrev.lacos, instalado: totaisInst.lacos, percentual: calcPercent(totaisInst.lacos, totaisPrev.lacos) },
      { name: 'Postes Infra', previsto: totaisPrev.postesInfra, instalado: totaisInst.postesInfra, percentual: calcPercent(totaisInst.postesInfra, totaisPrev.postesInfra) },
      { name: 'Conectorização', previsto: totaisPrev.conectorizacao, instalado: totaisInst.conectorizacao, percentual: calcPercent(totaisInst.conectorizacao, totaisPrev.conectorizacao) },
    ];

    const operacionalProgress: ProgressItem[] = [
      { name: 'Ajustes', previsto: totaisPrev.ajustes, instalado: totaisInst.ajustes, percentual: calcPercent(totaisInst.ajustes, totaisPrev.ajustes) },
      { name: 'Aferição', previsto: totaisPrev.afericao, instalado: totaisInst.afericao, percentual: calcPercent(totaisInst.afericao, totaisPrev.afericao) },
    ];

    // Calcular progresso de upload de arquivos
    const uploadProgress: ProgressItem[] = [
      { name: 'Projeto (Croqui)', previsto: equipamentos.length, instalado: equipamentos.filter((eq: any) => eq.projeto_croqui_url).length, percentual: calcPercent(equipamentos.filter((eq: any) => eq.projeto_croqui_url).length, equipamentos.length) },
      { name: 'Croqui Caracterização', previsto: equipamentos.length, instalado: equipamentos.filter((eq: any) => eq.croqui_caracterizacao_url).length, percentual: calcPercent(equipamentos.filter((eq: any) => eq.croqui_caracterizacao_url).length, equipamentos.length) },
      { name: 'Relatório VDM', previsto: equipamentos.length, instalado: equipamentos.filter((eq: any) => eq.relatorio_vdm_url).length, percentual: calcPercent(equipamentos.filter((eq: any) => eq.relatorio_vdm_url).length, equipamentos.length) },
      { name: 'Declaração de Conformidade', previsto: equipamentos.length, instalado: equipamentos.filter((eq: any) => eq.declaracao_conformidade_url).length, percentual: calcPercent(equipamentos.filter((eq: any) => eq.declaracao_conformidade_url).length, equipamentos.length) },
    ];

    // Calcular progresso de conexão e energia
    const totalEquipamentos = equipamentos.length;
    const conexaoInstalada = equipamentos.filter((eq: any) => eq.conexao_instalada).length;
    const energiaInstalada = equipamentos.filter((eq: any) => eq.energia_instalada).length;
    const conexaoEnergiaProgress: ProgressItem[] = [
      { 
        name: 'Conexão', 
        previsto: totalEquipamentos, 
        instalado: conexaoInstalada, 
        percentual: calcPercent(conexaoInstalada, totalEquipamentos) 
      },
      { 
        name: 'Energia', 
        previsto: totalEquipamentos, 
        instalado: energiaInstalada, 
        percentual: calcPercent(energiaInstalada, totalEquipamentos) 
      },
    ];

    const todosItens = [...sinalizacaoVerticalProgress, ...sinalizacaoHorizontalProgress, ...infraestruturaProgress, ...operacionalProgress];
    const todosPrevisto = todosItens.reduce((acc, item) => acc + item.previsto, 0);
    // Cap instalado por item ao previsto para evitar % > 100 no progresso geral
    const todosInstalado = todosItens.reduce((acc, item) => acc + Math.min(item.instalado, item.previsto), 0);
    const progressoGeral = calcPercent(todosInstalado, todosPrevisto);

    // Verificar se TODOS os itens com previsão > 0 foram 100% concluídos
    const itensComPrevisao = todosItens.filter(item => item.previsto > 0);
    const todosItensConcluidos = itensComPrevisao.length > 0 && 
      itensComPrevisao.every(item => item.instalado >= item.previsto);

    return {
      totalEquipamentos: equipamentos.length,
      sinalizacaoVerticalProgress,
      sinalizacaoHorizontalProgress,
      infraestruturaProgress,
      operacionalProgress,
      uploadProgress,
      conexaoEnergiaProgress,
      progressoGeral,
      todosItensConcluidos,
      totaisPrev,
      totaisInst,
    };
  }, [equipamentos]);

  // Dados para gráfico consolidado
  const chartDataGeral = useMemo(() => {
    if (!progressData) return [];
    return [
      ...progressData.sinalizacaoVerticalProgress,
      ...progressData.sinalizacaoHorizontalProgress,
      ...progressData.infraestruturaProgress,
      ...progressData.operacionalProgress,
    ].filter(item => item.previsto > 0 || item.instalado > 0)
     .map(item => ({ name: item.name, previsto: item.previsto, instalado: item.instalado }));
  }, [progressData]);

  // Status de documentos
  const documentStatus = useMemo(() => {
    if (!equipamentos) return { complete: 0, incomplete: 0, total: 0, byType: [] };
    
    let projetoCroqui = 0, croquiCaracterizacao = 0, relatorioVdm = 0, declaracaoConformidade = 0;
    
    equipamentos.forEach((eq: any) => {
      if (eq.projeto_croqui_url) projetoCroqui++;
      if (eq.croqui_caracterizacao_url) croquiCaracterizacao++;
      if (eq.relatorio_vdm_url) relatorioVdm++;
      if (eq.declaracao_conformidade_url) declaracaoConformidade++;
    });
    
    const total = equipamentos.length;
    const byType = [
      { name: 'Projeto (Croqui)', enviados: projetoCroqui, pendentes: total - projetoCroqui },
      { name: 'Croqui Caracterização', enviados: croquiCaracterizacao, pendentes: total - croquiCaracterizacao },
      { name: 'Relatório VDM', enviados: relatorioVdm, pendentes: total - relatorioVdm },
      { name: 'Declaração de Conformidade', enviados: declaracaoConformidade, pendentes: total - declaracaoConformidade },
    ];
    
    const totalDocs = total * 4;
    const completeDocs = projetoCroqui + croquiCaracterizacao + relatorioVdm + declaracaoConformidade;
    
    return { complete: completeDocs, incomplete: totalDocs - completeDocs, total: totalDocs, byType };
  }, [equipamentos]);

  // Dados de materiais recebidos por categoria
  const materiaisChartData = useMemo(() => {
    if (!materiaisRecebidos || materiaisRecebidos.length === 0) return { byCategory: [], byType: [], total: 0 };

    const byTypeMap: Record<string, number> = {};
    const byCategoryMap: Record<string, number> = {};
    let total = 0;

    materiaisRecebidos.forEach((mat) => {
      const tipoInfo = TIPOS_MATERIAIS.find(t => t.value === mat.tipo_material);
      const label = tipoInfo?.label || mat.tipo_material;
      const categoria = tipoInfo?.categoria || 'Outros';
      
      byTypeMap[label] = (byTypeMap[label] || 0) + mat.quantidade;
      byCategoryMap[categoria] = (byCategoryMap[categoria] || 0) + mat.quantidade;
      total += mat.quantidade;
    });

    const byType = Object.entries(byTypeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const categoryColors: Record<string, string> = {
      'Sinalização Vertical': 'hsl(221, 83%, 53%)',
      'Sinalização Horizontal': 'hsl(38, 92%, 50%)',
      'Infraestrutura': 'hsl(160, 84%, 39%)',
      'Equipamento': 'hsl(262, 83%, 58%)',
    };

    const byCategory = Object.entries(byCategoryMap).map(([name, value]) => ({ 
      name, 
      value,
      color: categoryColors[name] || 'hsl(var(--muted-foreground))'
    }));

    return { byCategory, byType, total };
  }, [materiaisRecebidos]);

  // Comparativo Recebido vs Instalado
  const comparativoData = useMemo(() => {
    if (!materiaisRecebidos || !progressData) return [];

    // Mapear materiais recebidos para categorias
    const recebidoMap: Record<string, number> = {};
    materiaisRecebidos.forEach((mat) => {
      recebidoMap[mat.tipo_material] = (recebidoMap[mat.tipo_material] || 0) + mat.quantidade;
    });

    const items = [
      // Sinalização Vertical
      { name: 'Placas', recebido: recebidoMap['placas'] || 0, instalado: progressData.totaisInst.placas },
      { name: 'Pontaletes', recebido: recebidoMap['pontaletes'] || 0, instalado: progressData.totaisInst.pontaletes },
      { name: 'Postes Colapsíveis', recebido: recebidoMap['postes_colapsiveis'] || 0, instalado: progressData.totaisInst.postesColapsiveis },
      { name: 'Braços Projetados', recebido: recebidoMap['bracos_projetados'] || 0, instalado: progressData.totaisInst.bracosProjetados },
      { name: 'Semi Pórticos', recebido: recebidoMap['semi_porticos'] || 0, instalado: progressData.totaisInst.semiPorticos },
      // Sinalização Horizontal
      { name: 'Defensas', recebido: recebidoMap['defensas'] || 0, instalado: progressData.totaisInst.defensas },
      { name: 'TAE 80', recebido: recebidoMap['tae_80'] || 0, instalado: progressData.totaisInst.tae80 },
      { name: 'TAE 100', recebido: recebidoMap['tae_100'] || 0, instalado: progressData.totaisInst.tae100 },
      // Infraestrutura
      { name: 'Bases', recebido: recebidoMap['bases'] || 0, instalado: progressData.totaisInst.bases },
      { name: 'Laços', recebido: recebidoMap['lacos'] || 0, instalado: progressData.totaisInst.lacos },
      { name: 'Postes Infra', recebido: recebidoMap['postes_infra'] || 0, instalado: progressData.totaisInst.postesInfra },
      { name: 'Conectorização', recebido: recebidoMap['conectorizacao'] || 0, instalado: progressData.totaisInst.conectorizacao },
    ];

    return items.filter(item => item.recebido > 0 || item.instalado > 0);
  }, [materiaisRecebidos, progressData]);

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
          <h1 className="page-title">Splice News</h1>
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

      {/* Cards de Resumo */}
      {progressData && (
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

          <Card className={`shadow-soft border-l-4 ${progressData.todosItensConcluidos ? 'border-l-success' : 'border-l-warning'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${progressData.todosItensConcluidos ? 'bg-success/10' : 'bg-warning/10'} flex items-center justify-center`}>
                  {progressData.todosItensConcluidos ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-warning" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`text-lg font-semibold ${progressData.todosItensConcluidos ? 'text-success' : ''}`}>
                    {progressData.todosItensConcluidos ? 'Concluído' : 'Em Andamento'}
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
                  <p className="text-sm text-muted-foreground">Documentos</p>
                  <p className="text-lg font-semibold">
                    {documentStatus.total > 0 
                      ? `${Math.round((documentStatus.complete / documentStatus.total) * 100)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cards de Progresso por Categoria */}
      {progressData && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
          <ProgressCard 
            title="Operacional" 
            icon={Settings2}
            items={progressData.operacionalProgress}
            color="bg-accent"
          />
          <ProgressCard 
            title="Upload de Arquivos" 
            icon={Upload}
            items={progressData.uploadProgress}
            color="bg-destructive"
          />
          <ProgressCard 
            title="Conexão e Energia" 
            icon={Zap}
            items={progressData.conexaoEnergiaProgress}
            color="bg-amber-500"
          />
        </div>
      )}

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

              <div className="lg:col-span-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentStatus.byType} layout="vertical" barGap={4}>
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
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', boxShadow: '0 8px 30px hsl(var(--foreground) / 0.1)', fontSize: '12px' }} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="enviados" fill="url(#gradEnviados)" name="Enviados" radius={[0, 4, 4, 0]} maxBarSize={25} />
                    <Bar dataKey="pendentes" fill="url(#gradPendentes)" name="Pendentes" radius={[0, 4, 4, 0]} maxBarSize={25} />
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
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 40px hsl(var(--foreground) / 0.15)' }} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar dataKey="previsto" fill="url(#gradPrevistoGeral)" name="Previsto" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="instalado" fill="url(#gradInstaladoGeral)" name="Instalado" radius={[6, 6, 0, 0]} maxBarSize={50} />
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

      {/* Gráfico de Materiais Recebidos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-warning to-success" />
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-warning/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Materiais Recebidos</CardTitle>
              <CardDescription>Distribuição por categoria</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {materiaisChartData.byCategory.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={materiaisChartData.byCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {materiaisChartData.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '10px',
                          boxShadow: '0 8px 30px hsl(var(--foreground) / 0.1)'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-3xl font-bold text-primary">{materiaisChartData.total}</p>
                    <p className="text-sm text-muted-foreground">Total de Itens Recebidos</p>
                  </div>
                  <div className="space-y-2">
                    {materiaisChartData.byCategory.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <Badge variant="secondary">{cat.value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12 mb-3 opacity-30" />
                <p>Nenhum material registrado</p>
                <p className="text-sm opacity-70">Registre materiais recebidos para visualizar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico Comparativo: Recebido vs Instalado */}
        <Card className="shadow-soft overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-success to-primary" />
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-success/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>Recebido vs Instalado</CardTitle>
              <CardDescription>Comparativo de materiais por tipo</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {comparativoData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativoData} layout="vertical" barGap={4}>
                    <defs>
                      <linearGradient id="gradRecebido" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(262, 83%, 68%)" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="gradInstaladoComp" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(160, 84%, 50%)" stopOpacity={0.7} />
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
                      width={100} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '10px',
                        boxShadow: '0 8px 30px hsl(var(--foreground) / 0.1)',
                        fontSize: '12px'
                      }} 
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} 
                    />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="recebido" fill="url(#gradRecebido)" name="Recebido" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    <Bar dataKey="instalado" fill="url(#gradInstaladoComp)" name="Instalado" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
                <p>Sem dados para comparar</p>
                <p className="text-sm opacity-70">Registre materiais e instalações</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
