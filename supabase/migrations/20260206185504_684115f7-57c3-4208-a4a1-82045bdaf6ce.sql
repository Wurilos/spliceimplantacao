-- Add configuration fields to equipamentos table for controlling tab visibility
ALTER TABLE public.equipamentos 
ADD COLUMN IF NOT EXISTS tem_infraestrutura BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tem_operacional BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tem_upload_arquivos BOOLEAN DEFAULT false;