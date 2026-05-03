-- 0. LIMPIEZA DE DATOS TRANSACCIONALES (autorizado)
DELETE FROM public.inscripciones;
DELETE FROM public.cargas_academicas;
DELETE FROM public.mensajes;
DELETE FROM public.materias;

-- 1. ENUMS
DO $$ BEGIN CREATE TYPE public.estado_inscripcion AS ENUM ('tentativa','confirmada','aprobada','rechazada','cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_equivalencia AS ENUM ('compartida','equivalente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_accion_historial AS ENUM ('inscripcion_tentativa','inscripcion_cancelada','carga_confirmada','carga_aprobada','carga_rechazada','materia_aprobada','materia_rechazada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. RENAME carreras → programas (idempotente)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='carreras') THEN
    ALTER TABLE public.carreras RENAME TO programas;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='usuarios' AND column_name='carrera_id') THEN
    ALTER TABLE public.usuarios RENAME COLUMN carrera_id TO programa_id;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='materias' AND column_name='carrera_id') THEN
    ALTER TABLE public.materias RENAME COLUMN carrera_id TO programa_id;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='carreras_pkey') THEN
    ALTER INDEX public.carreras_pkey RENAME TO programas_pkey;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='carreras_facultad_id_fkey') THEN
    ALTER TABLE public.programas RENAME CONSTRAINT carreras_facultad_id_fkey TO programas_facultad_id_fkey;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='usuarios_carrera_id_fkey') THEN
    ALTER TABLE public.usuarios RENAME CONSTRAINT usuarios_carrera_id_fkey TO usuarios_programa_id_fkey;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='materias_carrera_id_fkey') THEN
    ALTER TABLE public.materias RENAME CONSTRAINT materias_carrera_id_fkey TO materias_programa_id_fkey;
  END IF;
END $$;

-- 3. INSTITUCIONES
CREATE TABLE IF NOT EXISTS public.instituciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL, sigla text NOT NULL,
  nit text, direccion text, telefono text, email text, website text,
  ciudad text DEFAULT 'Tuluá',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.facultades
  ADD COLUMN IF NOT EXISTS institucion_id uuid REFERENCES public.instituciones(id);

-- 4. AMPLIAR materias
ALTER TABLE public.materias
  ADD COLUMN IF NOT EXISTS codigo_interno text,
  ADD COLUMN IF NOT EXISTS componente     text,
  ADD COLUMN IF NOT EXISTS horas_semana   int4,
  ADD COLUMN IF NOT EXISTS es_compartida  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS es_electiva    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS activa         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS dias_semana    text[],
  ADD COLUMN IF NOT EXISTS hora_inicio    time,
  ADD COLUMN IF NOT EXISTS hora_fin       time,
  ADD COLUMN IF NOT EXISTS salon          text,
  ADD COLUMN IF NOT EXISTS docente        text;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_materias_codigo_interno
  ON public.materias (codigo_interno) WHERE codigo_interno IS NOT NULL;

ALTER TABLE public.materias DROP CONSTRAINT IF EXISTS chk_cupos_logicos;
ALTER TABLE public.materias
  ADD CONSTRAINT chk_cupos_logicos
  CHECK (cupos_disponibles >= 0 AND cupos_disponibles <= cupos_totales);

-- 5. INSCRIPCIONES extra
ALTER TABLE public.inscripciones
  ADD COLUMN IF NOT EXISTS estado_v2       estado_inscripcion DEFAULT 'tentativa',
  ADD COLUMN IF NOT EXISTS orden_solicitud int4,
  ADD COLUMN IF NOT EXISTS cupo_reservado  boolean DEFAULT true;

CREATE SEQUENCE IF NOT EXISTS public.seq_orden_solicitud START 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_inscripcion_activa
  ON public.inscripciones (usuario_id, materia_id)
  WHERE estado_v2 IN ('tentativa','confirmada','aprobada');

-- 6. CARGAS_ACADEMICAS extra
ALTER TABLE public.cargas_academicas
  ADD COLUMN IF NOT EXISTS numero_orden   int4,
  ADD COLUMN IF NOT EXISTS total_creditos int4;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_carga_pendiente
  ON public.cargas_academicas (usuario_id) WHERE estado = 'pendiente';

-- 7. PREREQUISITOS
CREATE TABLE IF NOT EXISTS public.prerequisitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id      uuid NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  prerequisito_id uuid NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  CONSTRAINT prerequisitos_uq UNIQUE (materia_id, prerequisito_id),
  CONSTRAINT prerequisitos_no_self CHECK (materia_id <> prerequisito_id)
);
CREATE INDEX IF NOT EXISTS idx_prereq_materia ON public.prerequisitos(materia_id);
CREATE INDEX IF NOT EXISTS idx_prereq_prereq  ON public.prerequisitos(prerequisito_id);

-- 8. MATERIAS_RELACIONES
CREATE TABLE IF NOT EXISTS public.materias_relaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id_a       uuid NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  materia_id_b       uuid NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  tipo               tipo_equivalencia NOT NULL,
  bidireccional      boolean NOT NULL DEFAULT true,
  materia_maestra_id uuid REFERENCES public.materias(id),
  creado_por         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mr_uq UNIQUE (materia_id_a, materia_id_b),
  CONSTRAINT mr_no_self CHECK (materia_id_a <> materia_id_b)
);
CREATE INDEX IF NOT EXISTS idx_mr_a ON public.materias_relaciones(materia_id_a);
CREATE INDEX IF NOT EXISTS idx_mr_b ON public.materias_relaciones(materia_id_b);

-- 9. CARGA_INSCRIPCIONES
CREATE TABLE IF NOT EXISTS public.carga_inscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carga_id       uuid NOT NULL REFERENCES public.cargas_academicas(id) ON DELETE CASCADE,
  inscripcion_id uuid NOT NULL REFERENCES public.inscripciones(id) ON DELETE CASCADE,
  estado         estado_inscripcion NOT NULL DEFAULT 'confirmada',
  comentario     text,
  resuelto_por   uuid,
  resuelto_at    timestamptz,
  CONSTRAINT ci_uq UNIQUE (carga_id, inscripcion_id)
);
CREATE INDEX IF NOT EXISTS idx_ci_carga ON public.carga_inscripciones(carga_id);

-- 10. HISTORIAL_ACCIONES
CREATE TABLE IF NOT EXISTS public.historial_acciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id),
  accion tipo_accion_historial NOT NULL,
  inscripcion_id uuid REFERENCES public.inscripciones(id),
  carga_id uuid REFERENCES public.cargas_academicas(id),
  materia_id uuid REFERENCES public.materias(id),
  actor_id uuid, actor_rol app_role,
  descripcion text, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_historial_usuario
  ON public.historial_acciones (usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historial_carga
  ON public.historial_acciones (carga_id) WHERE carga_id IS NOT NULL;

-- 11. SEMESTRES_ACADEMICOS
CREATE TABLE IF NOT EXISTS public.semestres_academicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  institucion_id uuid NOT NULL REFERENCES public.instituciones(id),
  fecha_inicio date NOT NULL, fecha_fin date NOT NULL,
  inscripcion_inicio timestamptz NOT NULL,
  inscripcion_fin    timestamptz NOT NULL,
  adicion_inicio     timestamptz,
  adicion_fin        timestamptz,
  activo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_fechas CHECK (fecha_fin > fecha_inicio),
  CONSTRAINT chk_insc   CHECK (inscripcion_fin > inscripcion_inicio)
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_semestre_activo
  ON public.semestres_academicos (institucion_id) WHERE activo = true;

-- 12. IMPORTACIONES_ESTUDIANTES
CREATE TABLE IF NOT EXISTS public.importaciones_estudiantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  codigo_estudiantil text NOT NULL,
  email text NOT NULL,
  programa_nombre text,
  semestre_actual int4 DEFAULT 1,
  programa_id uuid REFERENCES public.programas(id),
  estado_importacion text DEFAULT 'pendiente',
  error_mensaje text,
  usuario_creado_id uuid,
  importado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. RLS
ALTER TABLE public.instituciones             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prerequisitos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_relaciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carga_inscripciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_acciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semestres_academicos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.importaciones_estudiantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read instituciones" ON public.instituciones FOR SELECT TO anon USING (true);
CREATE POLICY "Auth can read instituciones" ON public.instituciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can read prerequisitos" ON public.prerequisitos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can read materias_relaciones" ON public.materias_relaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can read semestres" ON public.semestres_academicos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users view own carga_inscripciones"
  ON public.carga_inscripciones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cargas_academicas ca
      WHERE ca.id = carga_inscripciones.carga_id
        AND (ca.usuario_id = auth.uid()
             OR (public.has_role(auth.uid(), 'admin')
                 AND EXISTS (SELECT 1 FROM public.usuarios u
                             WHERE u.id = ca.usuario_id
                               AND u.facultad_id = public.get_admin_facultad(auth.uid()))))
    )
  );

CREATE POLICY "Admin updates carga_inscripciones in faculty"
  ON public.carga_inscripciones FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') AND EXISTS (
      SELECT 1 FROM public.cargas_academicas ca
      JOIN public.usuarios u ON u.id = ca.usuario_id
      WHERE ca.id = carga_inscripciones.carga_id
        AND u.facultad_id = public.get_admin_facultad(auth.uid())
    )
  )
  WITH CHECK (true);

CREATE POLICY "Users view own historial"
  ON public.historial_acciones FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR (public.has_role(auth.uid(),'admin')
        AND EXISTS (SELECT 1 FROM public.usuarios u
                    WHERE u.id = historial_acciones.usuario_id
                      AND u.facultad_id = public.get_admin_facultad(auth.uid())))
  );

CREATE POLICY "Admin reads importaciones"
  ON public.importaciones_estudiantes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admin inserts importaciones"
  ON public.importaciones_estudiantes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 14. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_materias_programa  ON public.materias(programa_id);
CREATE INDEX IF NOT EXISTS idx_materias_semestre  ON public.materias(semestre);
CREATE INDEX IF NOT EXISTS idx_materias_compartida ON public.materias(es_compartida) WHERE es_compartida = true;
CREATE INDEX IF NOT EXISTS idx_programas_facultad ON public.programas(facultad_id);
CREATE INDEX IF NOT EXISTS idx_inscr_estado_v2    ON public.inscripciones(estado_v2);