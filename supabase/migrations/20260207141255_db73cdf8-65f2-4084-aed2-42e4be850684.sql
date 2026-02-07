-- Adicionar campos de instalação para conexão e energia
ALTER TABLE public.equipamentos 
ADD COLUMN IF NOT EXISTS conexao_instalada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS energia_instalada boolean DEFAULT false;