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
      cargas_academicas: {
        Row: {
          admin_id: string | null
          comentario_admin: string | null
          estado: string
          fecha_respuesta: string | null
          fecha_solicitud: string
          id: string
          usuario_id: string
        }
        Insert: {
          admin_id?: string | null
          comentario_admin?: string | null
          estado?: string
          fecha_respuesta?: string | null
          fecha_solicitud?: string
          id?: string
          usuario_id: string
        }
        Update: {
          admin_id?: string | null
          comentario_admin?: string | null
          estado?: string
          fecha_respuesta?: string | null
          fecha_solicitud?: string
          id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      carreras: {
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
            foreignKeyName: "carreras_facultad_id_fkey"
            columns: ["facultad_id"]
            isOneToOne: false
            referencedRelation: "facultades"
            referencedColumns: ["id"]
          },
        ]
      }
      facultades: {
        Row: {
          id: string
          nombre: string
        }
        Insert: {
          id?: string
          nombre: string
        }
        Update: {
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      inscripciones: {
        Row: {
          admin_id: string | null
          comentario_admin: string | null
          created_at: string
          estado: string
          fecha_respuesta: string | null
          fecha_solicitud: string | null
          id: string
          materia_id: string
          tipo: string | null
          usuario_id: string
        }
        Insert: {
          admin_id?: string | null
          comentario_admin?: string | null
          created_at?: string
          estado?: string
          fecha_respuesta?: string | null
          fecha_solicitud?: string | null
          id?: string
          materia_id: string
          tipo?: string | null
          usuario_id: string
        }
        Update: {
          admin_id?: string | null
          comentario_admin?: string | null
          created_at?: string
          estado?: string
          fecha_respuesta?: string | null
          fecha_solicitud?: string | null
          id?: string
          materia_id?: string
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
      materias: {
        Row: {
          carrera_id: string
          codigo: string
          creditos: number
          cupos_disponibles: number
          cupos_totales: number
          horario: string
          id: string
          nombre: string
          semestre: number
        }
        Insert: {
          carrera_id: string
          codigo: string
          creditos: number
          cupos_disponibles?: number
          cupos_totales?: number
          horario: string
          id?: string
          nombre: string
          semestre: number
        }
        Update: {
          carrera_id?: string
          codigo?: string
          creditos?: number
          cupos_disponibles?: number
          cupos_totales?: number
          horario?: string
          id?: string
          nombre?: string
          semestre?: number
        }
        Relationships: [
          {
            foreignKeyName: "materias_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: false
            referencedRelation: "carreras"
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
          carrera_id: string | null
          codigo_estudiantil: string
          created_at: string
          facultad_id: string | null
          id: string
          nombre: string
          semestre_actual: number
          tutorial_visto: boolean
        }
        Insert: {
          carrera_id?: string | null
          codigo_estudiantil: string
          created_at?: string
          facultad_id?: string | null
          id: string
          nombre: string
          semestre_actual?: number
          tutorial_visto?: boolean
        }
        Update: {
          carrera_id?: string | null
          codigo_estudiantil?: string
          created_at?: string
          facultad_id?: string | null
          id?: string
          nombre?: string
          semestre_actual?: number
          tutorial_visto?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: false
            referencedRelation: "carreras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_facultad_id_fkey"
            columns: ["facultad_id"]
            isOneToOne: false
            referencedRelation: "facultades"
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
    },
  },
} as const
