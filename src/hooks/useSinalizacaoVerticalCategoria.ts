import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SinalizacaoVerticalCategoriaItem {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string;
}

/**
 * Hook to fetch category items that belong to "Sinalização Vertical" category
 * This filters categoria_itens by finding the category with name containing "Sinalização Vertical"
 */
export function useSinalizacaoVerticalCategoria() {
  return useQuery({
    queryKey: ['sinalizacao-vertical-categoria-itens'],
    queryFn: async () => {
      // First, find the "Sinalização Vertical" category
      const { data: categorias, error: catError } = await supabase
        .from('categorias')
        .select('id, nome')
        .or('nome.ilike.%Sinalização Vertical%,nome.ilike.%Sinalizacao Vertical%,nome.ilike.%Vertical%');
      
      if (catError) throw catError;
      
      if (!categorias || categorias.length === 0) {
        return [];
      }

      // Get all category IDs that match
      const categoriaIds = categorias.map(c => c.id);

      // Fetch items from those categories
      const { data: itens, error: itensError } = await supabase
        .from('categoria_itens')
        .select('id, nome, descricao, categoria_id')
        .in('categoria_id', categoriaIds)
        .order('nome');
      
      if (itensError) throw itensError;
      
      // Itens de suporte que são campos de quantidade nas placas - não devem aparecer como categorias
      const ITENS_SUPORTE_PLACA = [
        'pontalete',
        'perfil metálico', 
        'perfil metalico',
        'postes colapsíveis',
        'postes colapsiveis',
        'poste colapsível',
        'poste colapsivel'
      ];

      // Filtrar itens de suporte
      const itensFiltrados = itens.filter(item => {
        const nomeNormalizado = item.nome.toLowerCase();
        return !ITENS_SUPORTE_PLACA.some(termo => nomeNormalizado.includes(termo));
      });
      
      return itensFiltrados as SinalizacaoVerticalCategoriaItem[];
    },
  });
}
