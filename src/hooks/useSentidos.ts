import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Sentido {
  id: string;
  nome: string;
  created_at: string;
}

export function useSentidos() {
  return useQuery({
    queryKey: ['sentidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentidos')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Sentido[];
    },
  });
}

export function useCreateSentido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sentido: { nome: string }) => {
      const { data, error } = await supabase
        .from('sentidos')
        .insert(sentido)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentidos'] });
      toast({ title: 'Sentido criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar sentido', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSentido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { data, error } = await supabase
        .from('sentidos')
        .update({ nome })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentidos'] });
      toast({ title: 'Sentido atualizado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar sentido', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSentido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sentidos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentidos'] });
      toast({ title: 'Sentido excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir sentido', description: error.message, variant: 'destructive' });
    },
  });
}
