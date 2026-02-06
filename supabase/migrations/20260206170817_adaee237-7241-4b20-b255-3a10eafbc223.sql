-- Add categoria_item_id to sinalizacao_vertical_blocos for dynamic categories
ALTER TABLE public.sinalizacao_vertical_blocos 
ADD COLUMN categoria_item_id UUID REFERENCES public.categoria_itens(id) ON DELETE SET NULL;