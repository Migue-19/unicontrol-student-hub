import { supabase } from "@/integrations/supabase/client";

export interface ActiveEnrollment {
  id: string;
  materia_id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  horario: string;
}

export interface CargaAcademica {
  id: string;
  estado: string;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
  comentario_admin: string | null;
}

const mapEnrollment = (item: any): ActiveEnrollment => ({
  id: item.id,
  materia_id: item.materia_id,
  codigo: item.materias?.codigo || "",
  nombre: item.materias?.nombre || "",
  creditos: item.materias?.creditos || 0,
  horario: item.materias?.horario || "",
});

export async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message || "No fue posible validar la sesión.");
  if (!data.user?.id) throw new Error("Usuario no autenticado");
  return data.user.id;
}

export async function fetchActiveEnrollments(userId: string): Promise<ActiveEnrollment[]> {
  const { data, error } = await supabase
    .from("inscripciones")
    .select("id, materia_id, materias(codigo, nombre, creditos, horario)")
    .eq("usuario_id", userId)
    .eq("estado", "inscrita")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapEnrollment);
}

export async function cancelEnrollment(materiaId: string) {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase.rpc("cancelar_inscripcion", {
    p_usuario_id: userId,
    p_materia_id: materiaId,
  });

  if (error) throw new Error(error.message || "Error al cancelar materia");

  const result = data as any;
  if (!result?.success) throw new Error(result?.message || "La cancelación no pudo completarse.");

  const remainingEnrollments = await fetchActiveEnrollments(userId);
  return {
    message: result.message || "Materia cancelada exitosamente",
    enrollments: remainingEnrollments,
  };
}

export async function confirmarCargaAcademica(userId: string) {
  const { data, error } = await supabase.rpc("confirmar_carga_academica" as any, {
    p_usuario_id: userId,
  });

  if (error) throw new Error(error.message || "Error al confirmar carga");

  const result = data as any;
  if (!result?.success) throw new Error(result?.message || "No se pudo confirmar la carga académica.");

  return result;
}

export async function fetchCargaActual(userId: string): Promise<CargaAcademica | null> {
  const { data, error } = await supabase
    .from("cargas_academicas" as any)
    .select("*")
    .eq("usuario_id", userId)
    .order("fecha_solicitud", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as CargaAcademica | null;
}
