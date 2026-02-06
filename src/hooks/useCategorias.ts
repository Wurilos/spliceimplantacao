import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaItem {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
  categorias?: {
    nome: string;
  };
}

// Hooks para Categorias
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as Categoria[];
    },
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoria: Omit<Categoria, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert(categoria)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast({ title: 'Categoria criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar categoria', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...categoria }: Partial<Categoria> & { id: string }) => {
      const { data, error } = await supabase
        .from('categorias')
        .update(categoria)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast({ title: 'Categoria atualizada!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar categoria', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast({ title: 'Categoria excluída!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir categoria', description: error.message, variant: 'destructive' });
    },
  });
}

// Hooks para Itens de Categoria
export function useCategoriaItens(categoriaId?: string) {
  return useQuery({
    queryKey: ['categoria_itens', categoriaId],
    queryFn: async () => {
      let query = supabase
        .from('categoria_itens')
        .select(`
          *,
          categorias (nome)
        `)
        .order('nome');

      if (categoriaId && categoriaId !== 'all') {
        query = query.eq('categoria_id', categoriaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CategoriaItem[];
    },
  });
}

export function useCreateCategoriaItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<CategoriaItem, 'id' | 'created_at' | 'updated_at' | 'categorias'>) => {
      const { data, error } = await supabase
        .from('categoria_itens')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoria_itens'] });
      toast({ title: 'Item criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar item', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCategoriaItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<CategoriaItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('categoria_itens')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoria_itens'] });
      toast({ title: 'Item atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCategoriaItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categoria_itens')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoria_itens'] });
      toast({ title: 'Item excluído!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    },
  });
}
