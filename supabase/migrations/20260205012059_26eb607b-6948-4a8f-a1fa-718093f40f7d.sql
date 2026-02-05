-- Add new columns to equipamentos table
ALTER TABLE public.equipamentos 
ADD COLUMN IF NOT EXISTS sentido_id UUID REFERENCES public.sentidos(id),
ADD COLUMN IF NOT EXISTS tipo_conexao TEXT,
ADD COLUMN IF NOT EXISTS tipo_energia TEXT;