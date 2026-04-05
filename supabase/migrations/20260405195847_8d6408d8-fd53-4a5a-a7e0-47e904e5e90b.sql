
-- 1. Create cargas_academicas table
CREATE TABLE public.cargas_academicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_respuesta TIMESTAMPTZ,
  admin_id UUID,
  comentario_admin TEXT
);

ALTER TABLE public.cargas_academicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cargas"
ON public.cargas_academicas FOR SELECT
USING (
  usuario_id = auth.uid()
  OR (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = cargas_academicas.usuario_id
      AND u.facultad_id = public.get_admin_facultad(auth.uid())
    )
  )
);

CREATE POLICY "Users can insert own cargas"
ON public.cargas_academicas FOR INSERT
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admin can update faculty cargas"
ON public.cargas_academicas FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = cargas_academicas.usuario_id
    AND u.facultad_id = public.get_admin_facultad(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = cargas_academicas.usuario_id
    AND u.facultad_id = public.get_admin_facultad(auth.uid())
  )
);

-- 2. Auto-populate facultad_id from carrera
CREATE OR REPLACE FUNCTION public.set_facultad_from_carrera()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.carrera_id IS NOT NULL THEN
    SELECT c.facultad_id INTO NEW.facultad_id FROM public.carreras c WHERE c.id = NEW.carrera_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_set_facultad
BEFORE INSERT OR UPDATE OF carrera_id ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.set_facultad_from_carrera();

-- Backfill existing students
UPDATE public.usuarios u
SET facultad_id = c.facultad_id
FROM public.carreras c
WHERE u.carrera_id = c.id AND u.facultad_id IS NULL;

-- 3. Revert inscribir_materia to direct enrollment
CREATE OR REPLACE FUNCTION public.inscribir_materia(p_usuario_id uuid, p_materia_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    SELECT 1 FROM public.inscripciones
    WHERE usuario_id = p_usuario_id AND materia_id = p_materia_id AND estado = 'inscrita'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Ya estás inscrito en esta materia');
  END IF;

  SELECT COALESCE(SUM(m.creditos), 0) INTO v_creditos_actuales
  FROM public.inscripciones i
  JOIN public.materias m ON i.materia_id = m.id
  WHERE i.usuario_id = p_usuario_id AND i.estado = 'inscrita';

  IF v_creditos_actuales + v_materia.creditos > 21 THEN
    RETURN json_build_object('success', false, 'message',
      format('Excede el máximo de 21 créditos (actual: %s, intentando agregar: %s)', v_creditos_actuales, v_materia.creditos));
  END IF;

  SELECT m.nombre INTO v_conflicto
  FROM public.inscripciones i
  JOIN public.materias m ON i.materia_id = m.id
  WHERE i.usuario_id = p_usuario_id AND i.estado = 'inscrita' AND m.horario = v_materia.horario
  LIMIT 1;

  IF v_conflicto IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', format('Conflicto de horario con %s', v_conflicto));
  END IF;

  -- Clean old records
  DELETE FROM public.inscripciones
  WHERE usuario_id = p_usuario_id AND materia_id = p_materia_id AND estado <> 'inscrita';

  -- Direct insert as inscrita
  INSERT INTO public.inscripciones (usuario_id, materia_id, estado, tipo)
  VALUES (p_usuario_id, p_materia_id, 'inscrita', 'adicion');

  -- Decrement cupos
  UPDATE public.materias SET cupos_disponibles = GREATEST(cupos_disponibles - 1, 0) WHERE id = p_materia_id;

  RETURN json_build_object('success', true, 'message', format('Inscrito en %s exitosamente', v_materia.nombre));

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'message', 'Ya estás inscrito en esta materia');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. Revert cancelar_inscripcion to direct delete
CREATE OR REPLACE FUNCTION public.cancelar_inscripcion(p_usuario_id uuid, p_materia_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_materia_nombre TEXT;
  v_inscripcion_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuario no autenticado');
  END IF;

  IF p_usuario_id <> auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'No autorizado');
  END IF;

  SELECT nombre INTO v_materia_nombre FROM public.materias WHERE id = p_materia_id;
  IF v_materia_nombre IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Materia no encontrada');
  END IF;

  SELECT id INTO v_inscripcion_id FROM public.inscripciones
  WHERE usuario_id = p_usuario_id AND materia_id = p_materia_id AND estado = 'inscrita';

  IF v_inscripcion_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'No estás inscrito en esta materia');
  END IF;

  -- Check if student has a pending load - prevent changes
  IF EXISTS (SELECT 1 FROM public.cargas_academicas WHERE usuario_id = p_usuario_id AND estado = 'pendiente') THEN
    RETURN json_build_object('success', false, 'message', 'No puedes modificar materias mientras tu carga académica está pendiente de aprobación');
  END IF;

  DELETE FROM public.inscripciones WHERE id = v_inscripcion_id;
  PERFORM public.incrementar_cupos(p_materia_id);

  RETURN json_build_object('success', true, 'message', format('Materia %s cancelada exitosamente', v_materia_nombre));

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 5. Create confirmar_carga_academica RPC
CREATE OR REPLACE FUNCTION public.confirmar_carga_academica(p_usuario_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_usuario_id THEN
    RETURN json_build_object('success', false, 'message', 'No autorizado');
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.inscripciones
  WHERE usuario_id = p_usuario_id AND estado = 'inscrita';

  IF v_count = 0 THEN
    RETURN json_build_object('success', false, 'message', 'No tienes materias inscritas para confirmar');
  END IF;

  IF EXISTS (SELECT 1 FROM public.cargas_academicas WHERE usuario_id = p_usuario_id AND estado = 'pendiente') THEN
    RETURN json_build_object('success', false, 'message', 'Ya tienes una carga académica pendiente de aprobación');
  END IF;

  INSERT INTO public.cargas_academicas (usuario_id, estado)
  VALUES (p_usuario_id, 'pendiente');

  RETURN json_build_object('success', true, 'message', 'Carga académica enviada para aprobación del coordinador');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 6. Update resolver_solicitud to work with cargas_academicas
CREATE OR REPLACE FUNCTION public.resolver_solicitud(p_inscripcion_id uuid, p_accion text, p_comentario text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carga cargas_academicas%ROWTYPE;
  v_admin_facultad UUID;
  v_estudiante_facultad UUID;
  v_estudiante_nombre TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'No autorizado');
  END IF;

  SELECT * INTO v_carga FROM public.cargas_academicas WHERE id = p_inscripcion_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Solicitud no encontrada');
  END IF;

  IF v_carga.estado <> 'pendiente' THEN
    RETURN json_build_object('success', false, 'message', 'Esta solicitud ya fue procesada');
  END IF;

  SELECT facultad_id INTO v_admin_facultad FROM public.usuarios WHERE id = auth.uid();
  SELECT u.facultad_id, u.nombre INTO v_estudiante_facultad, v_estudiante_nombre
  FROM public.usuarios u WHERE u.id = v_carga.usuario_id;

  IF v_admin_facultad IS NULL OR v_admin_facultad <> v_estudiante_facultad THEN
    RETURN json_build_object('success', false, 'message', 'No autorizado para esta facultad');
  END IF;

  IF p_accion = 'aprobar' THEN
    UPDATE public.cargas_academicas
    SET estado = 'aprobada', fecha_respuesta = now(), admin_id = auth.uid(), comentario_admin = p_comentario
    WHERE id = p_inscripcion_id;

    RETURN json_build_object('success', true, 'message', format('Carga académica de %s aprobada', v_estudiante_nombre));

  ELSIF p_accion = 'rechazar' THEN
    UPDATE public.cargas_academicas
    SET estado = 'rechazada', fecha_respuesta = now(), admin_id = auth.uid(), comentario_admin = p_comentario
    WHERE id = p_inscripcion_id;

    RETURN json_build_object('success', true, 'message', format('Carga académica de %s rechazada', v_estudiante_nombre));

  ELSE
    RETURN json_build_object('success', false, 'message', 'Acción no válida');
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 7. Clean up any pending inscripciones from old flow
UPDATE public.inscripciones SET estado = 'inscrita', tipo = 'adicion' WHERE estado = 'pendiente';
