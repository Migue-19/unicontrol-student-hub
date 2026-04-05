import { supabase } from "@/integrations/supabase/client";

export interface CargaPendiente {
  id: string;
  usuario_id: string;
  estado: string;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
  admin_id: string | null;
  comentario_admin: string | null;
  estudiante_nombre?: string;
  estudiante_codigo?: string;
  estudiante_carrera?: string;
  materias?: MateriaInscrita[];
}

export interface MateriaInscrita {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  horario: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  codigo_estudiantil: string;
  carrera_id: string;
  carrera_nombre?: string;
  semestre_actual: number;
  email?: string;
}

export interface MensajeData {
  id: string;
  emisor_id: string;
  receptor_id: string;
  asunto: string;
  mensaje: string;
  leido: boolean;
  parent_id: string | null;
  created_at: string;
  emisor_nombre?: string;
  receptor_nombre?: string;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles" as any)
    .select("role")
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

export async function fetchCargasPendientes(filtro?: string): Promise<CargaPendiente[]> {
  let query = supabase
    .from("cargas_academicas" as any)
    .select("*")
    .order("fecha_solicitud", { ascending: false });

  if (filtro && filtro !== "todas") {
    query = query.eq("estado", filtro);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cargas = (data || []) as any[];
  const userIds = [...new Set(cargas.map((c) => c.usuario_id))];

  if (userIds.length === 0) return [];

  // Fetch student info
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, codigo_estudiantil, carreras(nombre)")
    .in("id", userIds);

  const userMap = new Map((usuarios || []).map((u: any) => [u.id, u]));

  // Fetch inscripciones for all these students
  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("usuario_id, materias(id, codigo, nombre, creditos, horario)")
    .in("usuario_id", userIds)
    .eq("estado", "inscrita");

  const materiasMap = new Map<string, MateriaInscrita[]>();
  (inscripciones || []).forEach((i: any) => {
    const uid = i.usuario_id;
    if (!materiasMap.has(uid)) materiasMap.set(uid, []);
    if (i.materias) {
      materiasMap.get(uid)!.push({
        id: i.materias.id,
        codigo: i.materias.codigo,
        nombre: i.materias.nombre,
        creditos: i.materias.creditos,
        horario: i.materias.horario,
      });
    }
  });

  return cargas.map((c) => {
    const user = userMap.get(c.usuario_id) as any;
    return {
      ...c,
      estudiante_nombre: user?.nombre || "Desconocido",
      estudiante_codigo: user?.codigo_estudiantil || "",
      estudiante_carrera: (user?.carreras as any)?.nombre || "",
      materias: materiasMap.get(c.usuario_id) || [],
    };
  });
}

export async function resolverSolicitud(
  cargaId: string,
  accion: "aprobar" | "rechazar",
  comentario?: string
) {
  const { data, error } = await supabase.rpc("resolver_solicitud" as any, {
    p_inscripcion_id: cargaId,
    p_accion: accion,
    p_comentario: comentario || null,
  });

  if (error) throw new Error(error.message);
  const result = data as any;
  if (!result?.success) throw new Error(result?.message || "Error al procesar solicitud");
  return result;
}

export async function fetchEstudiantes(): Promise<Estudiante[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*, carreras(nombre)")
    .order("nombre");

  if (error) throw error;
  // Filter out admin users (those without carrera_id)
  return (data || [])
    .filter((u: any) => u.carrera_id !== null)
    .map((u: any) => ({
      id: u.id,
      nombre: u.nombre,
      codigo_estudiantil: u.codigo_estudiantil,
      carrera_id: u.carrera_id,
      carrera_nombre: (u.carreras as any)?.nombre || "",
      semestre_actual: u.semestre_actual,
    }));
}

export async function fetchHistorialEstudiante(userId: string) {
  const { data, error } = await supabase
    .from("inscripciones")
    .select("*, materias(nombre, codigo, creditos, horario)")
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((i: any) => ({
    ...i,
    materia_nombre: i.materias?.nombre || "",
    materia_codigo: i.materias?.codigo || "",
    materia_creditos: i.materias?.creditos || 0,
    materia_horario: i.materias?.horario || "",
  }));
}

export async function fetchMensajes(): Promise<MensajeData[]> {
  const { data, error } = await supabase
    .from("mensajes" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const mensajes = (data || []) as any[];
  const userIds = [...new Set([...mensajes.map((m) => m.emisor_id), ...mensajes.map((m) => m.receptor_id)])];

  const { data: usuarios } = userIds.length > 0
    ? await supabase.from("usuarios").select("id, nombre").in("id", userIds)
    : { data: [] };

  const userMap = new Map((usuarios || []).map((u: any) => [u.id, u.nombre]));

  return mensajes.map((m) => ({
    ...m,
    emisor_nombre: userMap.get(m.emisor_id) || "Sistema",
    receptor_nombre: userMap.get(m.receptor_id) || "Desconocido",
  }));
}

export async function enviarMensaje(receptorId: string, asunto: string, mensaje: string, parentId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from("mensajes" as any).insert({
    emisor_id: user.id,
    receptor_id: receptorId,
    asunto,
    mensaje,
    parent_id: parentId || null,
  } as any);

  if (error) throw new Error(error.message);
}

export async function marcarLeido(mensajeId: string) {
  const { error } = await supabase
    .from("mensajes" as any)
    .update({ leido: true } as any)
    .eq("id", mensajeId);
  if (error) throw new Error(error.message);
}
