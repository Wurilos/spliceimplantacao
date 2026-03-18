
-- Change tipo column from enum to text to support dynamic category items
ALTER TABLE public.sinalizacao_horizontal_itens 
  ALTER COLUMN tipo TYPE text USING tipo::text;

-- Add categoria_item_id column to link with categoria_itens
ALTER TABLE public.sinalizacao_horizontal_itens 
  ADD COLUMN IF NOT EXISTS categoria_item_id uuid REFERENCES public.categoria_itens(id);

-- Drop the enum type (no longer needed)
DROP TYPE IF EXISTS public.sinalizacao_horizontal_tipo;
