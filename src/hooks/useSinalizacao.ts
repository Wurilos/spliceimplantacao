import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SinalizacaoVertical {
  id: string;
  equipamento_id: string;
  sentido_id: string | null;
  categoria_item_id: string | null;
  endereco: string;
  tipo: string;
  subtipo: string;
  instalacao: string;
  lado: string;
  latitude: number | null;
  longitude: number | null;
  foto_url: string | null;
  qtd_pontaletes: number;
  qtd_perfis_metalicos: number;
  qtd_postes_colapsiveis: number;
  data: string | null;
  categoria: string;
  total_m2: number | null;
  created_at: string;
  updated_at: string;
  sentidos?: {
    nome: string;
  };
  categoria_itens?: {
    id: string;
    nome: string;
  };
}

export interface SinalizacaoHorizontal {
  id: string;
  equipamento_id: string;
  sentido_id: string | null;
  categoria_item_id: string | null;
  tipo: string;
  endereco: string;
  lado: string;
  latitude: number | null;
  longitude: number | null;
  foto_url: string | null;
  qtd_laminas: number;
  qtd_postes: number;
  data: string | null;
  created_at: string;
  updated_at: string;
  sentidos?: {
    nome: string;
  };
  categoria_itens?: {
    id: string;
    nome: string;
  };
}

export function useSinalizacaoVertical(equipamentoId: string | undefined) {
  return useQuery({
    queryKey: ['sinalizacao_vertical', equipamentoId],
    queryFn: async () => {
      if (!equipamentoId) return [];
      
      const { data, error } = await supabase
        .from('sinalizacao_vertical_blocos')
        .select(`
          *,
          sentidos (nome),
          categoria_itens:categoria_item_id (id, nome)
        `)
        .eq('equipamento_id', equipamentoId)
        .order('created_at');
      
      if (error) throw error;
      return (data || []) as unknown as SinalizacaoVertical[];
    },
    enabled: !!equipamentoId,
  });
}

export function useSinalizacaoHorizontal(equipamentoId: string | undefined) {
  return useQuery({
    queryKey: ['sinalizacao_horizontal', equipamentoId],
    queryFn: async () => {
      if (!equipamentoId) return [];
      
      const { data, error } = await supabase
        .from('sinalizacao_horizontal_itens')
        .select(`*, sentidos (nome), categoria_itens:categoria_item_id (id, nome)`)
        .eq('equipamento_id', equipamentoId)
        .order('created_at');
      
      if (error) throw error;
      return data as SinalizacaoHorizontal[];
    },
    enabled: !!equipamentoId,
  });
}

export function useCreateSinalizacaoVertical() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<SinalizacaoVertical, 'id' | 'created_at' | 'updated_at' | 'sentidos' | 'categoria_itens'>) => {
      const { data: result, error } = await supabase
        .from('sinalizacao_vertical_blocos')
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinalizacao_vertical'] });
      toast({ title: 'Bloco de sinalização vertical criado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar bloco', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSinalizacaoVertical() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Omit<SinalizacaoVertical, 'sentidos' | 'categoria_itens'>> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('sinalizacao_vertical_blocos')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinalizacao_vertical'] });
      toast({ title: 'Bloco atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar bloco', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSinalizacaoVertical() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sinalizacao_vertical_blocos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinalizacao_vertical'] });
      toast({ title: 'Bloco excluído!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir bloco', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreateSinalizacaoHorizontal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<SinalizacaoHorizontal, 'id' | 'created_at' | 'updated_at' | 'sentidos'>) => {
      const { data: result, error } = await supabase
        .from('sinalizacao_horizontal_itens')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinalizacao_horizontal'] });
      toast({ title: 'Item de sinalização horizontal criado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar item', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSinalizacaoHorizontal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SinalizacaoHorizontal> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('sinalizacao_horizontal_itens')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinalizacao_horizontal'] });
      toast({ title: 'Item atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSinalizacaoHorizontal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sinalizacao_horizontal_itens')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinalizacao_horizontal'] });
      toast({ title: 'Item excluído!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    },
  });
}
