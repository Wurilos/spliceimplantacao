-- Adicionar campos de previsão na tabela de equipamentos
ALTER TABLE public.equipamentos
ADD COLUMN prev_placas integer DEFAULT 0,
ADD COLUMN prev_pontaletes integer DEFAULT 0,
ADD COLUMN prev_postes_colapsiveis integer DEFAULT 0,
ADD COLUMN prev_bracos_projetados integer DEFAULT 0,
ADD COLUMN prev_semi_porticos integer DEFAULT 0,
ADD COLUMN prev_defensas integer DEFAULT 0,
ADD COLUMN prev_postes_horizontal integer DEFAULT 0,
ADD COLUMN prev_tae_80 integer DEFAULT 0,
ADD COLUMN prev_tae_100 integer DEFAULT 0;