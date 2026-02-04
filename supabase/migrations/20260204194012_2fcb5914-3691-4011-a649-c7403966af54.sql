-- Add document columns to equipamentos table
ALTER TABLE public.equipamentos 
ADD COLUMN IF NOT EXISTS projeto_croqui_url text NULL,
ADD COLUMN IF NOT EXISTS croqui_caracterizacao_url text NULL,
ADD COLUMN IF NOT EXISTS estudo_viabilidade_url text NULL,
ADD COLUMN IF NOT EXISTS relatorio_vdm_url text NULL;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Anyone authenticated can view documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');

CREATE POLICY "Admin/Operador can upload documentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos' AND can_edit(auth.uid()));

CREATE POLICY "Admin/Operador can update documentos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documentos' AND can_edit(auth.uid()));

CREATE POLICY "Admin can delete documentos"
ON storage.objects FOR DELETE
USING (bucket_id = 'documentos' AND can_delete(auth.uid()));