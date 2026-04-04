
-- 1. Create user_roles table (security best practice: roles in separate table)
CREATE TYPE public.app_role AS ENUM ('admin', 'estudiante');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'estudiante',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Add facultad_id to usuarios (for admin faculty assignment)
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS facultad_id UUID REFERENCES public.facultades(id);

-- 3. Add approval workflow columns to inscripciones
ALTER TABLE public.inscripciones 
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'adicion',
  ADD COLUMN IF NOT EXISTS fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_id UUID,
  ADD COLUMN IF NOT EXISTS comentario_admin TEXT;

-- 4. Create mensajes table
CREATE TABLE public.mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receptor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id UUID REFERENCES public.mensajes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- 5. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Security definer function to get admin's faculty
CREATE OR REPLACE FUNCTION public.get_admin_facultad(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT facultad_id FROM public.usuarios WHERE id = _user_id
$$;

-- 7. RLS for user_roles
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 8. RLS for mensajes
CREATE POLICY "Users can read own messages"
ON public.mensajes FOR SELECT
TO authenticated
USING (emisor_id = auth.uid() OR receptor_id = auth.uid());

CREATE POLICY "Users can insert messages"
ON public.mensajes FOR INSERT
TO authenticated
WITH CHECK (emisor_id = auth.uid());

CREATE POLICY "Users can update own received messages"
ON public.mensajes FOR UPDATE
TO authenticated
USING (receptor_id = auth.uid())
WITH CHECK (receptor_id = auth.uid());

-- 9. Admin can view students in their faculty
CREATE POLICY "Admin can view faculty students"
ON public.usuarios FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR (
    public.has_role(auth.uid(), 'admin') 
    AND facultad_id IS NOT NULL 
    AND facultad_id = public.get_admin_facultad(auth.uid())
  )
);

-- 10. Admin can view inscripciones of faculty students
CREATE POLICY "Admin can view faculty inscripciones"
ON public.inscripciones FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid()
  OR (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = inscripciones.usuario_id
      AND u.facultad_id = public.get_admin_facultad(auth.uid())
    )
  )
);

-- 11. Admin can update inscripciones (approve/reject)
CREATE POLICY "Admin can update faculty inscripciones"
ON public.inscripciones FOR UPDATE
TO authenticated
USING (
  usuario_id = auth.uid()
  OR (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = inscripciones.usuario_id
      AND u.facultad_id = public.get_admin_facultad(auth.uid())
    )
  )
)
WITH CHECK (
  usuario_id = auth.uid()
  OR (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = inscripciones.usuario_id
      AND u.facultad_id = public.get_admin_facultad(auth.uid())
    )
  )
);

-- 12. Drop conflicting existing policies that would overlap
DROP POLICY IF EXISTS "Users can read own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can read own inscripciones" ON public.inscripciones;
DROP POLICY IF EXISTS "update_own_inscripciones" ON public.inscripciones;
DROP POLICY IF EXISTS "Users can update own inscripciones" ON public.inscripciones;

-- 13. RPC for admin to approve/reject solicitudes
CREATE OR REPLACE FUNCTION public.resolver_solicitud(
  p_inscripcion_id UUID,
  p_accion TEXT,
  p_comentario TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inscripcion inscripciones%ROWTYPE;
  v_materia materias%ROWTYPE;
  v_admin_facultad UUID;
  v_estudiante_facultad UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'No autorizado');
  END IF;

  SELECT * INTO v_inscripcion FROM public.inscripciones WHERE id = p_inscripcion_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Solicitud no encontrada');
  END IF;

  IF v_inscripcion.estado <> 'pendiente' THEN
    RETURN json_build_object('success', false, 'message', 'Esta solicitud ya fue procesada');
  END IF;

  -- Verify faculty match
  SELECT facultad_id INTO v_admin_facultad FROM public.usuarios WHERE id = auth.uid();
  SELECT u.facultad_id INTO v_estudiante_facultad 
  FROM public.usuarios u WHERE u.id = v_inscripcion.usuario_id;
  
  IF v_admin_facultad IS NULL OR v_admin_facultad <> v_estudiante_facultad THEN
    RETURN json_build_object('success', false, 'message', 'No autorizado para esta facultad');
  END IF;

  IF p_accion = 'aprobar' THEN
    IF v_inscripcion.tipo = 'adicion' THEN
      -- Check cupos
      SELECT * INTO v_materia FROM public.materias WHERE id = v_inscripcion.materia_id;
      IF v_materia.cupos_disponibles <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'No hay cupos disponibles');
      END IF;
      
      UPDATE public.inscripciones
      SET estado = 'inscrita', fecha_respuesta = now(), admin_id = auth.uid(), comentario_admin = p_comentario
      WHERE id = p_inscripcion_id;
      
      UPDATE public.materias
      SET cupos_disponibles = GREATEST(cupos_disponibles - 1, 0)
      WHERE id = v_inscripcion.materia_id;
    
    ELSIF v_inscripcion.tipo = 'cancelacion' THEN
      DELETE FROM public.inscripciones WHERE id = p_inscripcion_id;
      PERFORM public.incrementar_cupos(v_inscripcion.materia_id);
    END IF;
    
    RETURN json_build_object('success', true, 'message', 'Solicitud aprobada');
    
  ELSIF p_accion = 'rechazar' THEN
    IF v_inscripcion.tipo = 'adicion' THEN
      DELETE FROM public.inscripciones WHERE id = p_inscripcion_id;
    ELSIF v_inscripcion.tipo = 'cancelacion' THEN
      -- Keep enrolled, just mark as rejected
      UPDATE public.inscripciones
      SET estado = 'inscrita', tipo = 'adicion', fecha_respuesta = now(), admin_id = auth.uid(), comentario_admin = p_comentario
      WHERE id = p_inscripcion_id;
    END IF;
    
    RETURN json_build_object('success', true, 'message', 'Solicitud rechazada');
  ELSE
    RETURN json_build_object('success', false, 'message', 'Acción no válida');
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 14. Update inscribir_materia to create pending requests instead of direct enrollment
CREATE OR REPLACE FUNCTION public.inscribir_materia(p_usuario_id UUID, p_materia_id UUID)
RETURNS JSON
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

  -- Check if already enrolled or has pending request
  IF EXISTS (
    SELECT 1 FROM public.inscripciones
    WHERE usuario_id = p_usuario_id AND materia_id = p_materia_id
    AND estado IN ('inscrita', 'pendiente')
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Ya tienes una solicitud o inscripción activa para esta materia');
  END IF;

  SELECT COALESCE(SUM(m.creditos), 0) INTO v_creditos_actuales
  FROM public.inscripciones i
  JOIN public.materias m ON i.materia_id = m.id
  WHERE i.usuario_id = p_usuario_id AND i.estado IN ('inscrita', 'pendiente');

  IF v_creditos_actuales + v_materia.creditos > 21 THEN
    RETURN json_build_object('success', false, 'message',
      format('Excede el máximo de 21 créditos (actual: %s, intentando agregar: %s)', v_creditos_actuales, v_materia.creditos));
  END IF;

  SELECT m.nombre INTO v_conflicto
  FROM public.inscripciones i
  JOIN public.materias m ON i.materia_id = m.id
  WHERE i.usuario_id = p_usuario_id AND i.estado IN ('inscrita', 'pendiente') AND m.horario = v_materia.horario
  LIMIT 1;

  IF v_conflicto IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', format('Conflicto de horario con %s', v_conflicto));
  END IF;

  -- Clean up any old rejected/cancelled records
  DELETE FROM public.inscripciones
  WHERE usuario_id = p_usuario_id AND materia_id = p_materia_id AND estado NOT IN ('inscrita', 'pendiente');

  -- Create pending request
  INSERT INTO public.inscripciones (usuario_id, materia_id, estado, tipo, fecha_solicitud)
  VALUES (p_usuario_id, p_materia_id, 'pendiente', 'adicion', now());

  RETURN json_build_object('success', true, 'message', format('Solicitud de inscripción en %s enviada. Pendiente de aprobación.', v_materia.nombre));

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'message', 'Ya tienes una solicitud activa para esta materia');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 15. Update cancelar_inscripcion to create pending cancellation request
CREATE OR REPLACE FUNCTION public.cancelar_inscripcion(p_usuario_id UUID, p_materia_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_materia_nombre TEXT;
  v_inscripcion_id UUID;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuario no autenticado');
  END IF;

  IF p_usuario_id IS NOT NULL AND p_usuario_id <> v_auth_user_id THEN
    RETURN json_build_object('success', false, 'message', 'No autorizado');
  END IF;

  SELECT nombre INTO v_materia_nombre FROM public.materias WHERE id = p_materia_id;
  IF v_materia_nombre IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Materia no encontrada');
  END IF;

  SELECT id INTO v_inscripcion_id FROM public.inscripciones
  WHERE usuario_id = v_auth_user_id AND materia_id = p_materia_id AND estado = 'inscrita';

  IF v_inscripcion_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'No estás inscrito en esta materia');
  END IF;

  -- Change to pending cancellation
  UPDATE public.inscripciones
  SET estado = 'pendiente', tipo = 'cancelacion', fecha_solicitud = now(), fecha_respuesta = NULL, admin_id = NULL, comentario_admin = NULL
  WHERE id = v_inscripcion_id;

  RETURN json_build_object('success', true, 'message', format('Solicitud de cancelación de %s enviada. Pendiente de aprobación.', v_materia_nombre));

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;
