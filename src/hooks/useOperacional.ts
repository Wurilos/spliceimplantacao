import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OperacionalItem {
  id: string;
  equipamento_id: string;
  tipo: string;
  categoria_item_id: string | null;
  quantidade: number;
  data: string | null;
  foto_url: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  categoria_itens?: {
    id: string;
    nome: string;
  };
}

export function useOperacionalItens(equipamentoId: string | undefined) {
  return useQuery({
    queryKey: ['operacional_itens', equipamentoId],
    queryFn: async () => {
      if (!equipamentoId) return [];
      
      const { data, error } = await supabase
        .from('operacional_itens')
        .select(`
          *,
          categoria_itens:categoria_item_id (id, nome)
        `)
        .eq('equipamento_id', equipamentoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as OperacionalItem[];
    },
    enabled: !!equipamentoId,
  });
}

export function useCreateOperacionalItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<OperacionalItem, 'id' | 'created_at' | 'updated_at' | 'categoria_itens'>) => {
      const { data, error } = await supabase
        .from('operacional_itens')
        .insert(item as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacional_itens'] });
      toast({ title: 'Item operacional adicionado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateOperacionalItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<Omit<OperacionalItem, 'categoria_itens'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('operacional_itens')
        .update(item as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacional_itens'] });
      toast({ title: 'Item atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteOperacionalItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('operacional_itens')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacional_itens'] });
      toast({ title: 'Item excluído!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    },
  });
}
