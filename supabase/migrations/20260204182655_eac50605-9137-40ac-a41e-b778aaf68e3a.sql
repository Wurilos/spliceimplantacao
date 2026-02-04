-- Add categoria and total_m2 columns to sinalizacao_vertical_blocos
ALTER TABLE public.sinalizacao_vertical_blocos 
ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'placas';

ALTER TABLE public.sinalizacao_vertical_blocos 
ADD COLUMN IF NOT EXISTS total_m2 numeric NULL;