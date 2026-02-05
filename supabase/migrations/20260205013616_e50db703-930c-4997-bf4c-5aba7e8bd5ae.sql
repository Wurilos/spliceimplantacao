-- Add prediction fields for infrastructure to equipamentos table
ALTER TABLE public.equipamentos
ADD COLUMN IF NOT EXISTS prev_bases integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prev_lacos integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prev_postes_infra integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prev_conectorizacao integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prev_ajustes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS prev_afericao integer DEFAULT 0;

-- Create table for infrastructure items
CREATE TABLE public.infraestrutura_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id uuid NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'bases', 'lacos', 'postes', 'conectorizacao', 'ajustes', 'afericao'
  quantidade integer NOT NULL DEFAULT 1,
  data date,
  foto_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.infraestrutura_itens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone authenticated can view infraestrutura" 
ON public.infraestrutura_itens 
FOR SELECT 
USING (true);

CREATE POLICY "Admin/Operador can insert infraestrutura" 
ON public.infraestrutura_itens 
FOR INSERT 
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Admin/Operador can update infraestrutura" 
ON public.infraestrutura_itens 
FOR UPDATE 
USING (can_edit(auth.uid()));

CREATE POLICY "Admin can delete infraestrutura" 
ON public.infraestrutura_itens 
FOR DELETE 
USING (can_delete(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_infraestrutura_itens_updated_at
BEFORE UPDATE ON public.infraestrutura_itens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();