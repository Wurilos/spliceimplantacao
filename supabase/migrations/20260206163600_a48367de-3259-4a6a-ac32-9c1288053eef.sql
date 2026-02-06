-- Tabela de Categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Itens de Categoria
CREATE TABLE public.categoria_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categorias
CREATE POLICY "Anyone authenticated can view categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Admin/Operador can insert categorias" ON public.categorias FOR INSERT WITH CHECK (can_edit(auth.uid()));
CREATE POLICY "Admin/Operador can update categorias" ON public.categorias FOR UPDATE USING (can_edit(auth.uid()));
CREATE POLICY "Admin can delete categorias" ON public.categorias FOR DELETE USING (can_delete(auth.uid()));

-- RLS Policies for categoria_itens
CREATE POLICY "Anyone authenticated can view categoria_itens" ON public.categoria_itens FOR SELECT USING (true);
CREATE POLICY "Admin/Operador can insert categoria_itens" ON public.categoria_itens FOR INSERT WITH CHECK (can_edit(auth.uid()));
CREATE POLICY "Admin/Operador can update categoria_itens" ON public.categoria_itens FOR UPDATE USING (can_edit(auth.uid()));
CREATE POLICY "Admin can delete categoria_itens" ON public.categoria_itens FOR DELETE USING (can_delete(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categoria_itens_updated_at BEFORE UPDATE ON public.categoria_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();