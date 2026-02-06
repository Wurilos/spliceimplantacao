import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EquipamentoPrevisao {
  id: string;
  equipamento_id: string;
  categoria_item_id: string;
  quantidade_prevista: number;
  created_at: string;
  updated_at: string;
  categoria_itens?: {
    id: string;
    nome: string;
    categoria_id: string;
  };
}

export function useEquipamentoPrevisoes(equipamentoId: string | undefined) {
  return useQuery({
    queryKey: ['equipamento_previsoes', equipamentoId],
    queryFn: async () => {
      if (!equipamentoId) return [];
      
      const { data, error } = await supabase
        .from('equipamento_previsoes' as any)
        .select(`
          id,
          equipamento_id,
          categoria_item_id,
          quantidade_prevista,
          created_at,
          updated_at
        `)
        .eq('equipamento_id', equipamentoId);
      
      if (error) throw error;
      return (data || []) as unknown as EquipamentoPrevisao[];
    },
    enabled: !!equipamentoId,
  });
}

export function useUpsertEquipamentoPrevisao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (previsao: {
      equipamento_id: string;
      categoria_item_id: string;
      quantidade_prevista: number;
    }) => {
      const { data, error } = await supabase
        .from('equipamento_previsoes' as any)
        .upsert(previsao, {
          onConflict: 'equipamento_id,categoria_item_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipamento_previsoes', variables.equipamento_id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao salvar previsão', description: error.message, variant: 'destructive' });
    },
  });
}

export function useBulkUpsertEquipamentoPrevisoes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (previsoes: Array<{
      equipamento_id: string;
      categoria_item_id: string;
      quantidade_prevista: number;
    }>) => {
      if (previsoes.length === 0) return [];
      
      const { data, error } = await supabase
        .from('equipamento_previsoes' as any)
        .upsert(previsoes, {
          onConflict: 'equipamento_id,categoria_item_id',
        })
        .select();
      
      if (error) throw error;
      return data || [];
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['equipamento_previsoes', variables[0].equipamento_id] });
      }
      toast({ title: 'Previsões salvas com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao salvar previsões', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEquipamentoPrevisao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, equipamentoId }: { id: string; equipamentoId: string }) => {
      const { error } = await supabase
        .from('equipamento_previsoes' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return equipamentoId;
    },
    onSuccess: (equipamentoId) => {
      queryClient.invalidateQueries({ queryKey: ['equipamento_previsoes', equipamentoId] });
      toast({ title: 'Previsão excluída!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir previsão', description: error.message, variant: 'destructive' });
    },
  });
}
