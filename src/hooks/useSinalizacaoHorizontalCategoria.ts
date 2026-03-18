import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SinalizacaoHorizontalCategoriaItem {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string;
}

/**
 * Hook to fetch category items that belong to "Sinalização Horizontal" category
 */
export function useSinalizacaoHorizontalCategoria() {
  return useQuery({
    queryKey: ['sinalizacao-horizontal-categoria-itens'],
    queryFn: async () => {
      // Find the "Sinalização Horizontal" or "Horizontal" category
      const { data: categorias, error: catError } = await supabase
        .from('categorias')
        .select('id, nome')
        .or('nome.ilike.%Sinalização Horizontal%,nome.ilike.%Sinalizacao Horizontal%,nome.ilike.%Horizontal%');
      
      if (catError) throw catError;
      
      if (!categorias || categorias.length === 0) {
        return [];
      }

      const categoriaIds = categorias.map(c => c.id);

      const { data: itens, error: itensError } = await supabase
        .from('categoria_itens')
        .select('id, nome, descricao, categoria_id')
        .in('categoria_id', categoriaIds)
        .order('nome');
      
      if (itensError) throw itensError;
      
      return itens as SinalizacaoHorizontalCategoriaItem[];
    },
  });
}
