-- Adicionar campos tipo_equipamento e quantidade_faixas à tabela equipamentos
ALTER TABLE public.equipamentos 
ADD COLUMN tipo_equipamento text,
ADD COLUMN quantidade_faixas integer DEFAULT 1;