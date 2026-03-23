ALTER TABLE public.infraestrutura_itens 
ADD COLUMN categoria_item_id uuid REFERENCES public.categoria_itens(id) ON DELETE SET NULL;