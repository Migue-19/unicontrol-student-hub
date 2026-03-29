-- Permitir eliminación real de inscripciones por el propio usuario
DROP POLICY IF EXISTS "Users can delete own inscripciones" ON public.inscripciones;
CREATE POLICY "Users can delete own inscripciones"
ON public.inscripciones
FOR DELETE
TO authenticated
USING (usuario_id = auth.uid());

-- Hacer más segura la actualización de cupos
CREATE OR REPLACE FUNCTION public.incrementar_cupos(materia_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.materias
  SET cupos_disponibles = LEAST(cupos_totales, cupos_disponibles + 1)
  WHERE id = materia_id_input;
END;
$$;

-- La cancelación ahora elimina por completo la inscripción activa
CREATE OR REPLACE FUNCTION public.cancelar_inscripcion(p_usuario_id uuid, p_materia_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_materia_nombre text;
  v_deleted_rows integer := 0;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuario no autenticado');
  END IF;

  IF p_usuario_id IS NOT NULL AND p_usuario_id <> v_auth_user_id THEN
    RETURN json_build_object('success', false, 'message', 'No autorizado para cancelar esta inscripción');
  END IF;

  SELECT nombre INTO v_materia_nombre
  FROM public.materias
  WHERE id = p_materia_id;

  IF v_materia_nombre IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Materia no encontrada');
  END IF;

  DELETE FROM public.inscripciones
  WHERE usuario_id = v_auth_user_id
    AND materia_id = p_materia_id
    AND estado = 'inscrita';

  GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;

  IF v_deleted_rows = 0 THEN
    RETURN json_build_object('success', false, 'message', 'No estás inscrito en esta materia');
  END IF;

  PERFORM public.incrementar_cupos(p_materia_id);

  RETURN json_build_object('success', true, 'message', format('Materia %s cancelada exitosamente', v_materia_nombre));
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Reinscripción robusta: limpiar registros cancelados heredados antes de insertar
CREATE OR REPLACE FUNCTION public.inscribir_materia(p_usuario_id uuid, p_materia_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_materia materias%ROWTYPE;
  v_creditos_actuales INT;
  v_conflicto TEXT;
BEGIN
  SELECT * INTO v_materia FROM public.materias WHERE id = p_materia_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Materia no encontrada');
  END IF;

  IF v_materia.cupos_disponibles <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'No hay cupos disponibles');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.inscripciones
    WHERE usuario_id = p_usuario_id
      AND materia_id = p_materia_id
      AND estado = 'inscrita'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Ya estás inscrito en esta materia');
  END IF;

  SELECT COALESCE(SUM(m.creditos), 0) INTO v_creditos_actuales
  FROM public.inscripciones i
  JOIN public.materias m ON i.materia_id = m.id
  WHERE i.usuario_id = p_usuario_id
    AND i.estado = 'inscrita';

  IF v_creditos_actuales + v_materia.creditos > 21 THEN
    RETURN json_build_object(
      'success', false,
      'message', format('Excede el máximo de 21 créditos (actual: %s, intentando agregar: %s)', v_creditos_actuales, v_materia.creditos)
    );
  END IF;

  SELECT m.nombre INTO v_conflicto
  FROM public.inscripciones i
  JOIN public.materias m ON i.materia_id = m.id
  WHERE i.usuario_id = p_usuario_id
    AND i.estado = 'inscrita'
    AND m.horario = v_materia.horario
  LIMIT 1;

  IF v_conflicto IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', format('Conflicto de horario con %s', v_conflicto));
  END IF;

  DELETE FROM public.inscripciones
  WHERE usuario_id = p_usuario_id
    AND materia_id = p_materia_id
    AND estado = 'cancelada';

  INSERT INTO public.inscripciones (usuario_id, materia_id, estado)
  VALUES (p_usuario_id, p_materia_id, 'inscrita');

  UPDATE public.materias
  SET cupos_disponibles = GREATEST(cupos_disponibles - 1, 0)
  WHERE id = p_materia_id;

  RETURN json_build_object('success', true, 'message', format('Inscrito exitosamente en %s', v_materia.nombre));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'message', 'Ya estás inscrito en esta materia');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Reparar datos históricos que hoy bloquean la reinscripción
DELETE FROM public.inscripciones
WHERE estado = 'cancelada';