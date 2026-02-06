-- Create table for materials received
CREATE TABLE public.materiais_recebidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  tipo_material TEXT NOT NULL,
  data_recebimento DATE NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.materiais_recebidos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone authenticated can view materiais_recebidos"
ON public.materiais_recebidos
FOR SELECT
USING (true);

CREATE POLICY "Admin/Operador can insert materiais_recebidos"
ON public.materiais_recebidos
FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Admin/Operador can update materiais_recebidos"
ON public.materiais_recebidos
FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Admin can delete materiais_recebidos"
ON public.materiais_recebidos
FOR DELETE
USING (can_delete(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_materiais_recebidos_updated_at
BEFORE UPDATE ON public.materiais_recebidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();