-- Create sequence for automatic contract ID
CREATE SEQUENCE IF NOT EXISTS contratos_seq START 1;

-- Create function to generate contract ID
CREATE OR REPLACE FUNCTION public.generate_contrato_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id_contrato IS NULL OR NEW.id_contrato = '' THEN
    NEW.id_contrato := 'CT-' || LPAD(nextval('contratos_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate id_contrato
DROP TRIGGER IF EXISTS trigger_generate_contrato_id ON public.contratos;
CREATE TRIGGER trigger_generate_contrato_id
BEFORE INSERT ON public.contratos
FOR EACH ROW
EXECUTE FUNCTION public.generate_contrato_id();