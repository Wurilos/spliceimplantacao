 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 
 export interface InfraestruturaItem {
   id: string;
   equipamento_id: string;
   tipo: 'bases' | 'lacos' | 'postes' | 'conectorizacao' | 'ajustes' | 'afericao';
   quantidade: number;
   data: string | null;
   foto_url: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export function useInfraestruturaItens(equipamentoId: string | undefined) {
   return useQuery({
     queryKey: ['infraestrutura_itens', equipamentoId],
     queryFn: async () => {
       if (!equipamentoId) return [];
       
       const { data, error } = await supabase
         .from('infraestrutura_itens')
         .select('*')
         .eq('equipamento_id', equipamentoId)
         .order('created_at', { ascending: false });
       
       if (error) throw error;
       return data as InfraestruturaItem[];
     },
     enabled: !!equipamentoId,
   });
 }
 
 export function useCreateInfraestruturaItem() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (item: Omit<InfraestruturaItem, 'id' | 'created_at' | 'updated_at'>) => {
       const { data, error } = await supabase
         .from('infraestrutura_itens')
         .insert(item)
         .select()
         .single();
       
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['infraestrutura_itens'] });
       toast({ title: 'Item de infraestrutura adicionado!' });
     },
     onError: (error: Error) => {
       toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' });
     },
   });
 }
 
 export function useUpdateInfraestruturaItem() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ id, ...item }: Partial<InfraestruturaItem> & { id: string }) => {
       const { data, error } = await supabase
         .from('infraestrutura_itens')
         .update(item)
         .eq('id', id)
         .select()
         .single();
       
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['infraestrutura_itens'] });
       toast({ title: 'Item atualizado!' });
     },
     onError: (error: Error) => {
       toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
     },
   });
 }
 
 export function useDeleteInfraestruturaItem() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('infraestrutura_itens')
         .delete()
         .eq('id', id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['infraestrutura_itens'] });
       toast({ title: 'Item excluído!' });
     },
     onError: (error: Error) => {
       toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
     },
   });
 }