
-- Fix 1: Change cargas_academicas policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Users can view own cargas" ON public.cargas_academicas;
DROP POLICY IF EXISTS "Users can insert own cargas" ON public.cargas_academicas;
DROP POLICY IF EXISTS "Admin can update faculty cargas" ON public.cargas_academicas;

CREATE POLICY "Users can view own cargas" ON public.cargas_academicas
  FOR SELECT TO authenticated
  USING (
    (usuario_id = auth.uid()) OR
    (has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
      SELECT 1 FROM usuarios u WHERE u.id = cargas_academicas.usuario_id AND u.facultad_id = get_admin_facultad(auth.uid())
    ))
  );

CREATE POLICY "Users can insert own cargas" ON public.cargas_academicas
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admin can update faculty cargas" ON public.cargas_academicas
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
      SELECT 1 FROM usuarios u WHERE u.id = cargas_academicas.usuario_id AND u.facultad_id = get_admin_facultad(auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND EXISTS (
      SELECT 1 FROM usuarios u WHERE u.id = cargas_academicas.usuario_id AND u.facultad_id = get_admin_facultad(auth.uid())
    )
  );
