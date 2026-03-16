-- Change velocidade from integer to text to support values like "100/80"
ALTER TABLE public.equipamentos ALTER COLUMN velocidade TYPE text USING velocidade::text;

-- Create equipamento_previsoes table for dynamic forecasting
CREATE TABLE public.equipamento_previsoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  categoria_item_id uuid NOT NULL REFERENCES public.categoria_itens(id) ON DELETE CASCADE,
  quantidade_prevista integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipamento_id, categoria_item_id)
);

-- Enable RLS
ALTER TABLE public.equipamento_previsoes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone authenticated can view equipamento_previsoes"
  ON public.equipamento_previsoes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin/Operador can insert equipamento_previsoes"
  ON public.equipamento_previsoes FOR INSERT TO authenticated
  WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Admin/Operador can update equipamento_previsoes"
  ON public.equipamento_previsoes FOR UPDATE TO authenticated
  USING (can_edit(auth.uid()));

CREATE POLICY "Admin can delete equipamento_previsoes"
  ON public.equipamento_previsoes FOR DELETE TO authenticated
  USING (can_delete(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.equipamento_previsoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();