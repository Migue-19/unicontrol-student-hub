export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      carga_inscripciones: {
        Row: {
          carga_id: string
          comentario: string | null
          estado: Database["public"]["Enums"]["estado_inscripcion"]
          id: string
          inscripcion_id: string
          resuelto_at: string | null
          resuelto_por: string | null
        }
        Insert: {
          carga_id: string
          comentario?: string | null
          estado?: Database["public"]["Enums"]["estado_inscripcion"]
          id?: string
          inscripcion_id: string
          resuelto_at?: string | null
          resuelto_por?: string | null
        }
        Update: {
          carga_id?: string
          comentario?: string | null
          estado?: Database["public"]["Enums"]["estado_inscripcion"]
          id?: string
          inscripcion_id?: string
          resuelto_at?: string | null
          resuelto_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carga_inscripciones_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas_academicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carga_inscripciones_inscripcion_id_fkey"
            columns: ["inscripcion_id"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cargas_academicas: {
        Row: {
          admin_id: string | null
          comentario_admin: string | null
          estado: string
          fecha_respuesta: string | null
          fecha_solicitud: string
          id: string
          numero_orden: number | null
          total_creditos: number | null
          usuario_id: string
        }
        Insert: {
          admin_id?: string | null
          comentario_admin?: string | null
          estado?: string
          fecha_respuesta?: string | null
          fecha_solicitud?: string
          id?: string
          numero_orden?: number | null
          total_creditos?: number | null
          usuario_id: string
        }
        Update: {
          admin_id?: string | null
          comentario_admin?: string | null
          estado?: string
          fecha_respuesta?: string | null
          fecha_solicitud?: string
          id?: string
          numero_orden?: number | null
          total_creditos?: number | null
          usuario_id?: string
        }
        Relationships: []
      }
      facultades: {
        Row: {
          id: string
          institucion_id: string | null
          nombre: string
        }
        Insert: {
          id?: string
          institucion_id?: string | null
          nombre: string
        }
        Update: {
          id?: string
          institucion_id?: string | null
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "facultades_institucion_id_fkey"
            columns: ["institucion_id"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_acciones: {
        Row: {
          accion: Database["public"]["Enums"]["tipo_accion_historial"]
          actor_id: string | null
          actor_rol: Database["public"]["Enums"]["app_role"] | null
          carga_id: string | null
          created_at: string
          descripcion: string | null
          id: string
          inscripcion_id: string | null
          materia_id: string | null
          metadata: Json | null
          usuario_id: string
        }
        Insert: {
          accion: Database["public"]["Enums"]["tipo_accion_historial"]
          actor_id?: string | null
          actor_rol?: Database["public"]["Enums"]["app_role"] | null
          carga_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          inscripcion_id?: string | null
          materia_id?: string | null
          metadata?: Json | null
          usuario_id: string
        }
        Update: {
          accion?: Database["public"]["Enums"]["tipo_accion_historial"]
          actor_id?: string | null
          actor_rol?: Database["public"]["Enums"]["app_role"] | null
          carga_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          inscripcion_id?: string | null
          materia_id?: string | null
          metadata?: Json | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_acciones_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas_academicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_acciones_inscripcion_id_fkey"
            columns: ["inscripcion_id"]
            isOneToOne: false
            referencedRelation: "inscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_acciones_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_acciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      importaciones_estudiantes: {
        Row: {
          codigo_estudiantil: string
          created_at: string
          email: string
          error_mensaje: string | null
          estado_importacion: string | null
          id: string
          importado_por: string | null
          nombre: string
          programa_id: string | null
          programa_nombre: string | null
          semestre_actual: number | null
          usuario_creado_id: string | null
        }
        Insert: {
          codigo_estudiantil: string
          created_at?: string
          email: string
          error_mensaje?: string | null
          estado_importacion?: string | null
          id?: string
          importado_por?: string | null
          nombre: string
          programa_id?: string | null
          programa_nombre?: string | null
          semestre_actual?: number | null
          usuario_creado_id?: string | null
        }
        Update: {
          codigo_estudiantil?: string
          created_at?: string
          email?: string
          error_mensaje?: string | null
          estado_importacion?: string | null
          id?: string
          importado_por?: string | null
          nombre?: string
          programa_id?: string | null
          programa_nombre?: string | null
          semestre_actual?: number | null
          usuario_creado_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "importaciones_estudiantes_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
      inscripciones: {
        Row: {
          admin_id: string | null
          comentario_admin: string | null
          created_at: string
          cupo_reservado: boolean | null
          estado: string
          estado_v2: Database["public"]["Enums"]["estado_inscripcion"] | null
          fecha_respuesta: string | null
          fecha_solicitud: string | null
          id: string
          materia_id: string
          orden_solicitud: number | null
          tipo: string | null
          usuario_id: string
        }
        Insert: {
          admin_id?: string | null
          comentario_admin?: string | null
          created_at?: string
          cupo_reservado?: boolean | null
          estado?: string
          estado_v2?: Database["public"]["Enums"]["estado_inscripcion"] | null
          fecha_respuesta?: string | null
          fecha_solicitud?: string | null
          id?: string
          materia_id: string
          orden_solicitud?: number | null
          tipo?: string | null
          usuario_id: string
        }
        Update: {
          admin_id?: string | null
          comentario_admin?: string | null
          created_at?: string
          cupo_reservado?: boolean | null
          estado?: string
          estado_v2?: Database["public"]["Enums"]["estado_inscripcion"] | null
          fecha_respuesta?: string | null
          fecha_solicitud?: string | null
          id?: string
          materia_id?: string
          orden_solicitud?: number | null
          tipo?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      instituciones: {
        Row: {
          ciudad: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nit: string | null
          nombre: string
          sigla: string
          telefono: string | null
          website: string | null
        }
        Insert: {
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nit?: string | null
          nombre: string
          sigla: string
          telefono?: string | null
          website?: string | null
        }
        Update: {
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nit?: string | null
          nombre?: string
          sigla?: string
          telefono?: string | null
          website?: string | null
        }
        Relationships: []
      }
      materias: {
        Row: {
          activa: boolean | null
          codigo: string
          codigo_interno: string | null
          componente: string | null
          creditos: number
          cupos_disponibles: number
          cupos_totales: number
          dias_semana: string[] | null
          docente: string | null
          es_compartida: boolean | null
          es_electiva: boolean | null
          hora_fin: string | null
          hora_inicio: string | null
          horario: string
          horas_semana: number | null
          id: string
          nombre: string
          programa_id: string
          salon: string | null
          semestre: number
        }
        Insert: {
          activa?: boolean | null
          codigo: string
          codigo_interno?: string | null
          componente?: string | null
          creditos: number
          cupos_disponibles?: number
          cupos_totales?: number
          dias_semana?: string[] | null
          docente?: string | null
          es_compartida?: boolean | null
          es_electiva?: boolean | null
          hora_fin?: string | null
          hora_inicio?: string | null
          horario: string
          horas_semana?: number | null
          id?: string
          nombre: string
          programa_id: string
          salon?: string | null
          semestre: number
        }
        Update: {
          activa?: boolean | null
          codigo?: string
          codigo_interno?: string | null
          componente?: string | null
          creditos?: number
          cupos_disponibles?: number
          cupos_totales?: number
          dias_semana?: string[] | null
          docente?: string | null
          es_compartida?: boolean | null
          es_electiva?: boolean | null
          hora_fin?: string | null
          hora_inicio?: string | null
          horario?: string
          horas_semana?: number | null
          id?: string
          nombre?: string
          programa_id?: string
          salon?: string | null
          semestre?: number
        }
        Relationships: [
          {
            foreignKeyName: "materias_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
      materias_relaciones: {
        Row: {
          bidireccional: boolean
          creado_por: string | null
          created_at: string
          id: string
          materia_id_a: string
          materia_id_b: string
          materia_maestra_id: string | null
          tipo: Database["public"]["Enums"]["tipo_equivalencia"]
        }
        Insert: {
          bidireccional?: boolean
          creado_por?: string | null
          created_at?: string
          id?: string
          materia_id_a: string
          materia_id_b: string
          materia_maestra_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_equivalencia"]
        }
        Update: {
          bidireccional?: boolean
          creado_por?: string | null
          created_at?: string
          id?: string
          materia_id_a?: string
          materia_id_b?: string
          materia_maestra_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_equivalencia"]
        }
        Relationships: [
          {
            foreignKeyName: "materias_relaciones_materia_id_a_fkey"
            columns: ["materia_id_a"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materias_relaciones_materia_id_b_fkey"
            columns: ["materia_id_b"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materias_relaciones_materia_maestra_id_fkey"
            columns: ["materia_maestra_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          asunto: string
          created_at: string
          emisor_id: string
          id: string
          leido: boolean
          mensaje: string
          parent_id: string | null
          receptor_id: string
        }
        Insert: {
          asunto: string
          created_at?: string
          emisor_id: string
          id?: string
          leido?: boolean
          mensaje: string
          parent_id?: string | null
          receptor_id: string
        }
        Update: {
          asunto?: string
          created_at?: string
          emisor_id?: string
          id?: string
          leido?: boolean
          mensaje?: string
          parent_id?: string | null
          receptor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mensajes"
            referencedColumns: ["id"]
          },
        ]
      }
      prerequisitos: {
        Row: {
          id: string
          materia_id: string
          prerequisito_id: string
        }
        Insert: {
          id?: string
          materia_id: string
          prerequisito_id: string
        }
        Update: {
          id?: string
          materia_id?: string
          prerequisito_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prerequisitos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prerequisitos_prerequisito_id_fkey"
            columns: ["prerequisito_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
        ]
      }
      programas: {
        Row: {
          facultad_id: string
          id: string
          nombre: string
        }
        Insert: {
          facultad_id: string
          id?: string
          nombre: string
        }
        Update: {
          facultad_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "programas_facultad_id_fkey"
            columns: ["facultad_id"]
            isOneToOne: false
            referencedRelation: "facultades"
            referencedColumns: ["id"]
          },
        ]
      }
      semestres_academicos: {
        Row: {
          activo: boolean
          adicion_fin: string | null
          adicion_inicio: string | null
          created_at: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          inscripcion_fin: string
          inscripcion_inicio: string
          institucion_id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          adicion_fin?: string | null
          adicion_inicio?: string | null
          created_at?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          inscripcion_fin: string
          inscripcion_inicio: string
          institucion_id: string
          nombre: string
        }
        Update: {
          activo?: boolean
          adicion_fin?: string | null
          adicion_inicio?: string | null
          created_at?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          inscripcion_fin?: string
          inscripcion_inicio?: string
          institucion_id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "semestres_academicos_institucion_id_fkey"
            columns: ["institucion_id"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          codigo_estudiantil: string
          created_at: string
          facultad_id: string | null
          id: string
          nombre: string
          programa_id: string | null
          semestre_actual: number
          tutorial_visto: boolean
        }
        Insert: {
          codigo_estudiantil: string
          created_at?: string
          facultad_id?: string | null
          id: string
          nombre: string
          programa_id?: string | null
          semestre_actual?: number
          tutorial_visto?: boolean
        }
        Update: {
          codigo_estudiantil?: string
          created_at?: string
          facultad_id?: string | null
          id?: string
          nombre?: string
          programa_id?: string | null
          semestre_actual?: number
          tutorial_visto?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_facultad_id_fkey"
            columns: ["facultad_id"]
            isOneToOne: false
            referencedRelation: "facultades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancelar_inscripcion: {
        Args: { p_materia_id: string; p_usuario_id: string }
        Returns: Json
      }
      confirmar_carga_academica: {
        Args: { p_usuario_id: string }
        Returns: Json
      }
      get_admin_facultad: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      incrementar_cupos: {
        Args: { materia_id_input: string }
        Returns: undefined
      }
      inscribir_materia: {
        Args: { p_materia_id: string; p_usuario_id: string }
        Returns: Json
      }
      resolver_solicitud: {
        Args: {
          p_accion: string
          p_comentario?: string
          p_inscripcion_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "estudiante"
      estado_inscripcion:
        | "tentativa"
        | "confirmada"
        | "aprobada"
        | "rechazada"
        | "cancelada"
      tipo_accion_historial:
        | "inscripcion_tentativa"
        | "inscripcion_cancelada"
        | "carga_confirmada"
        | "carga_aprobada"
        | "carga_rechazada"
        | "materia_aprobada"
        | "materia_rechazada"
      tipo_equivalencia: "compartida" | "equivalente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "estudiante"],
      estado_inscripcion: [
        "tentativa",
        "confirmada",
        "aprobada",
        "rechazada",
        "cancelada",
      ],
      tipo_accion_historial: [
        "inscripcion_tentativa",
        "inscripcion_cancelada",
        "carga_confirmada",
        "carga_aprobada",
        "carga_rechazada",
        "materia_aprobada",
        "materia_rechazada",
      ],
      tipo_equivalencia: ["compartida", "equivalente"],
    },
  },
} as const
