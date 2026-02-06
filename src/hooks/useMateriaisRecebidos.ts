import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MaterialRecebido {
  id: string;
  contrato_id: string;
  tipo_material: string;
  data_recebimento: string;
  quantidade: number;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  contratos?: {
    id_contrato: string;
    nome: string;
  };
}

export const TIPOS_MATERIAIS = [
  // Sinalização Vertical
  { value: 'placas', label: 'Placas', categoria: 'Sinalização Vertical' },
  { value: 'pontaletes', label: 'Pontaletes', categoria: 'Sinalização Vertical' },
  { value: 'postes_colapsiveis', label: 'Postes Colapsíveis', categoria: 'Sinalização Vertical' },
  { value: 'bracos_projetados', label: 'Braços Projetados', categoria: 'Sinalização Vertical' },
  { value: 'semi_porticos', label: 'Semi Pórticos', categoria: 'Sinalização Vertical' },
  { value: 'perfis_metalicos', label: 'Perfis Metálicos', categoria: 'Sinalização Vertical' },
  // Sinalização Horizontal
  { value: 'defensas', label: 'Defensas Metálicas', categoria: 'Sinalização Horizontal' },
  { value: 'laminas_defensa', label: 'Lâminas de Defensa', categoria: 'Sinalização Horizontal' },
  { value: 'postes_defensa', label: 'Postes de Defensa', categoria: 'Sinalização Horizontal' },
  { value: 'tae_80', label: 'TAE 80 km/h', categoria: 'Sinalização Horizontal' },
  { value: 'tae_100', label: 'TAE 100 km/h', categoria: 'Sinalização Horizontal' },
  // Infraestrutura
  { value: 'bases', label: 'Bases', categoria: 'Infraestrutura' },
  { value: 'lacos', label: 'Laços', categoria: 'Infraestrutura' },
  { value: 'postes_infra', label: 'Postes Infraestrutura', categoria: 'Infraestrutura' },
  { value: 'conectorizacao', label: 'Conectorização', categoria: 'Infraestrutura' },
  { value: 'cabos', label: 'Cabos', categoria: 'Infraestrutura' },
  { value: 'equipamentos_radar', label: 'Equipamentos de Radar', categoria: 'Equipamento' },
];

interface UseMateriaisRecebidosParams {
  contratoId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export function useMateriaisRecebidos(params?: UseMateriaisRecebidosParams) {
  return useQuery({
    queryKey: ['materiais_recebidos', params],
    queryFn: async () => {
      let query = supabase
        .from('materiais_recebidos')
        .select(`
          *,
          contratos (id_contrato, nome)
        `)
        .order('data_recebimento', { ascending: false });

      if (params?.contratoId && params.contratoId !== 'all') {
        query = query.eq('contrato_id', params.contratoId);
      }
      if (params?.dataInicio) {
        query = query.gte('data_recebimento', params.dataInicio);
      }
      if (params?.dataFim) {
        query = query.lte('data_recebimento', params.dataFim);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaterialRecebido[];
    },
  });
}

export function useCreateMaterialRecebido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (material: Omit<MaterialRecebido, 'id' | 'created_at' | 'updated_at' | 'contratos'>) => {
      const { data, error } = await supabase
        .from('materiais_recebidos')
        .insert(material)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais_recebidos'] });
      toast({ title: 'Material registrado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao registrar material', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateMaterialRecebido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...material }: Partial<MaterialRecebido> & { id: string }) => {
      const { data, error } = await supabase
        .from('materiais_recebidos')
        .update(material)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais_recebidos'] });
      toast({ title: 'Material atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar material', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteMaterialRecebido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materiais_recebidos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais_recebidos'] });
      toast({ title: 'Material excluído!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir material', description: error.message, variant: 'destructive' });
    },
  });
}
