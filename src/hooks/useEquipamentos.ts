import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Equipamento {
  id: string;
  contrato_id: string;
  numero_serie: string;
  municipio: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  tem_sinalizacao_vertical: boolean;
  tem_sinalizacao_horizontal: boolean;
  tipo_equipamento: string | null;
  quantidade_faixas: number | null;
  tipo_conexao: string | null;
  tipo_energia: string | null;
  conexao_instalada: boolean | null;
  energia_instalada: boolean | null;
  velocidade: string | null;
  // Previsão Sinalização Vertical
  prev_placas?: number;
  prev_pontaletes?: number;
  prev_postes_colapsiveis?: number;
  prev_bracos_projetados?: number;
  prev_semi_porticos?: number;
  // Previsão Sinalização Horizontal
  prev_defensas?: number;
  prev_postes_horizontal?: number;
  prev_tae_80?: number;
  prev_tae_100?: number;
  created_at: string;
  updated_at: string;
  contratos?: {
    id_contrato: string;
    nome: string;
  };
}

export interface EquipamentoSentido {
  id: string;
  equipamento_id: string;
  sentido_id: string;
  is_principal: boolean;
  created_at: string;
  sentidos?: {
    nome: string;
  };
}

export function useEquipamentos() {
  return useQuery({
    queryKey: ['equipamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          contratos (id_contrato, nome)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Equipamento[];
    },
  });
}

export function useEquipamento(id: string | undefined) {
  return useQuery({
    queryKey: ['equipamento', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          contratos (id_contrato, nome)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Equipamento;
    },
    enabled: !!id,
  });
}

export function useEquipamentoSentidos(equipamentoId: string | undefined) {
  return useQuery({
    queryKey: ['equipamento_sentidos', equipamentoId],
    queryFn: async () => {
      if (!equipamentoId) return [];
      
      const { data, error } = await supabase
        .from('equipamento_sentidos')
        .select(`
          *,
          sentidos (nome)
        `)
        .eq('equipamento_id', equipamentoId);
      
      if (error) throw error;
      return data as EquipamentoSentido[];
    },
    enabled: !!equipamentoId,
  });
}

export function useCreateEquipamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (equipamento: Omit<Equipamento, 'id' | 'created_at' | 'updated_at' | 'contratos'>) => {
      const { data, error } = await supabase
        .from('equipamentos')
        .insert(equipamento)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast({ title: 'Equipamento criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar equipamento', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEquipamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...equipamento }: Partial<Equipamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('equipamentos')
        .update(equipamento)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      queryClient.invalidateQueries({ queryKey: ['equipamento'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-equipamentos-previsao'] });
      toast({ title: 'Equipamento atualizado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar equipamento', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEquipamento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
      toast({ title: 'Equipamento excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir equipamento', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAddEquipamentoSentido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ equipamento_id, sentido_id, is_principal = false }: { equipamento_id: string; sentido_id: string; is_principal?: boolean }) => {
      const { data, error } = await supabase
        .from('equipamento_sentidos')
        .insert({ equipamento_id, sentido_id, is_principal })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamento_sentidos'] });
      toast({ title: 'Sentido adicionado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar sentido', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRemoveEquipamentoSentido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipamento_sentidos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamento_sentidos'] });
      toast({ title: 'Sentido removido!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover sentido', description: error.message, variant: 'destructive' });
    },
  });
}
