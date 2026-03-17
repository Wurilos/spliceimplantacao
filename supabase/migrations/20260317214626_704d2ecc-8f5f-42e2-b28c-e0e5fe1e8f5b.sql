
-- Fix: Allow operadores (can_edit) to delete equipamento_sentidos, not just admins
DROP POLICY IF EXISTS "Admin can delete equipamento_sentidos" ON public.equipamento_sentidos;
CREATE POLICY "Admin/Operador can delete equipamento_sentidos"
ON public.equipamento_sentidos
FOR DELETE
TO authenticated
USING (can_edit(auth.uid()));
