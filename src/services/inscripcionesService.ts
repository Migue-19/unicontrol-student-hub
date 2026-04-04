import { supabase } from "@/integrations/supabase/client";

export interface ActiveEnrollment {
  id: string;
  materia_id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  horario: string;
  estado: string;
  tipo: string;
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
  estado: item.estado || "inscrita",
  tipo: item.tipo || "adicion",
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
    .select("id, materia_id, estado, tipo, materias(codigo, nombre, creditos, horario)")
    .eq("usuario_id", userId)
    .in("estado", ["inscrita", "pendiente"])
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

  const result = data as CancellationResult | null;
  if (!result?.success) throw new Error(result?.message || "La cancelación no pudo completarse.");

  const remainingEnrollments = await fetchActiveEnrollments(userId);

  return {
    message: result.message || "Solicitud de cancelación enviada",
    enrollments: remainingEnrollments,
  };
}
