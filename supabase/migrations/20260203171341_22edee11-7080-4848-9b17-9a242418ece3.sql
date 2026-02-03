-- Adicionar coluna data na tabela sinalizacao_vertical_blocos
ALTER TABLE public.sinalizacao_vertical_blocos 
ADD COLUMN data DATE;

-- Adicionar coluna data na tabela sinalizacao_horizontal_itens
ALTER TABLE public.sinalizacao_horizontal_itens 
ADD COLUMN data DATE;