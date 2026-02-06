-- Create operacional_itens table
CREATE TABLE public.operacional_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  categoria_item_id UUID REFERENCES public.categoria_itens(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  data DATE,
  foto_url TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operacional_itens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone authenticated can view operacional" 
ON public.operacional_itens 
FOR SELECT 
USING (true);

CREATE POLICY "Admin/Operador can insert operacional" 
ON public.operacional_itens 
FOR INSERT 
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Admin/Operador can update operacional" 
ON public.operacional_itens 
FOR UPDATE 
USING (can_edit(auth.uid()));

CREATE POLICY "Admin can delete operacional" 
ON public.operacional_itens 
FOR DELETE 
USING (can_delete(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_operacional_itens_updated_at
BEFORE UPDATE ON public.operacional_itens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();