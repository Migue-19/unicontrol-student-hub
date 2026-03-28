import { supabase } from "@/integrations/supabase/client";

export interface ActiveEnrollment {
  id: string;
  materia_id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  horario: string;
}

interface CancellationResult {
  success?: boolean;
  message?: string;
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

  if (error) {
    console.error("[inscripcionesService] Error obteniendo usuario autenticado:", error);
    throw new Error(error.message || "No fue posible validar la sesión.");
  }

  if (!data.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  return data.user.id;
}

export async function fetchActiveEnrollments(userId: string): Promise<ActiveEnrollment[]> {
  const { data, error } = await supabase
    .from("inscripciones")
    .select("id, materia_id, materias(codigo, nombre, creditos, horario)")
    .eq("usuario_id", userId)
    .eq("estado", "inscrita")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[inscripcionesService] Error consultando inscripciones activas:", error);
    throw error;
  }

  return (data || []).map(mapEnrollment);
}

export async function cancelEnrollment(materiaId: string) {
  const userId = await getAuthenticatedUserId();

  console.log("[inscripcionesService] Cancelando:", materiaId);
  console.log("[inscripcionesService] Usuario:", userId);

  const { data, error } = await supabase.rpc("cancelar_inscripcion", {
    p_usuario_id: userId,
    p_materia_id: materiaId,
  });

  if (error) {
    console.error("[inscripcionesService] Error RPC cancelar_inscripcion:", error);
    throw new Error(error.message || "Error al cancelar materia");
  }

  const result = data as CancellationResult | null;
  console.log("[inscripcionesService] Resultado RPC:", result);

  if (!result?.success) {
    const message = result?.message || "La cancelación no pudo completarse.";
    console.error("[inscripcionesService] Cancelación rechazada por Supabase:", message);
    throw new Error(message);
  }

  const remainingEnrollments = await fetchActiveEnrollments(userId);
  const stillEnrolled = remainingEnrollments.some((subject) => subject.materia_id === materiaId);

  if (stillEnrolled) {
    console.error("[inscripcionesService] Verificación fallida: la materia sigue activa en Supabase", {
      materiaId,
      userId,
    });
    throw new Error("La cancelación no se reflejó en Supabase.");
  }

  return {
    message: result.message || "Materia cancelada correctamente",
    enrollments: remainingEnrollments,
  };
}