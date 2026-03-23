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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categoria_itens: {
        Row: {
          categoria_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          categoria_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          categoria_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categoria_itens_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          created_at: string
          id: string
          id_contrato: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_contrato: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          id_contrato?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipamento_previsoes: {
        Row: {
          categoria_item_id: string
          created_at: string
          equipamento_id: string
          id: string
          quantidade_prevista: number
          updated_at: string
        }
        Insert: {
          categoria_item_id: string
          created_at?: string
          equipamento_id: string
          id?: string
          quantidade_prevista?: number
          updated_at?: string
        }
        Update: {
          categoria_item_id?: string
          created_at?: string
          equipamento_id?: string
          id?: string
          quantidade_prevista?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_previsoes_categoria_item_id_fkey"
            columns: ["categoria_item_id"]
            isOneToOne: false
            referencedRelation: "categoria_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamento_previsoes_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamento_sentidos: {
        Row: {
          created_at: string
          equipamento_id: string
          faixa_numero: number
          id: string
          is_principal: boolean | null
          sentido_id: string
        }
        Insert: {
          created_at?: string
          equipamento_id: string
          faixa_numero?: number
          id?: string
          is_principal?: boolean | null
          sentido_id: string
        }
        Update: {
          created_at?: string
          equipamento_id?: string
          faixa_numero?: number
          id?: string
          is_principal?: boolean | null
          sentido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_sentidos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamento_sentidos_sentido_id_fkey"
            columns: ["sentido_id"]
            isOneToOne: false
            referencedRelation: "sentidos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          conexao_instalada: boolean | null
          contrato_id: string
          created_at: string
          croqui_caracterizacao_url: string | null
          declaracao_conformidade_url: string | null
          endereco: string
          energia_instalada: boolean | null
          estudo_viabilidade_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          municipio: string
          nao_intrusivo: boolean | null
          numero_serie: string
          prev_afericao: number | null
          prev_ajustes: number | null
          prev_bases: number | null
          prev_bracos_projetados: number | null
          prev_conectorizacao: number | null
          prev_defensas: number | null
          prev_lacos: number | null
          prev_placas: number | null
          prev_pontaletes: number | null
          prev_postes_colapsiveis: number | null
          prev_postes_horizontal: number | null
          prev_postes_infra: number | null
          prev_semi_porticos: number | null
          prev_tae_100: number | null
          prev_tae_80: number | null
          projeto_croqui_url: string | null
          quantidade_faixas: number | null
          relatorio_vdm_url: string | null
          sentido_id: string | null
          tem_infraestrutura: boolean | null
          tem_operacional: boolean | null
          tem_sinalizacao_horizontal: boolean | null
          tem_sinalizacao_vertical: boolean | null
          tem_upload_arquivos: boolean | null
          tipo_conexao: string | null
          tipo_energia: string | null
          tipo_equipamento: string | null
          updated_at: string
          velocidade: string | null
        }
        Insert: {
          conexao_instalada?: boolean | null
          contrato_id: string
          created_at?: string
          croqui_caracterizacao_url?: string | null
          declaracao_conformidade_url?: string | null
          endereco: string
          energia_instalada?: boolean | null
          estudo_viabilidade_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio: string
          nao_intrusivo?: boolean | null
          numero_serie: string
          prev_afericao?: number | null
          prev_ajustes?: number | null
          prev_bases?: number | null
          prev_bracos_projetados?: number | null
          prev_conectorizacao?: number | null
          prev_defensas?: number | null
          prev_lacos?: number | null
          prev_placas?: number | null
          prev_pontaletes?: number | null
          prev_postes_colapsiveis?: number | null
          prev_postes_horizontal?: number | null
          prev_postes_infra?: number | null
          prev_semi_porticos?: number | null
          prev_tae_100?: number | null
          prev_tae_80?: number | null
          projeto_croqui_url?: string | null
          quantidade_faixas?: number | null
          relatorio_vdm_url?: string | null
          sentido_id?: string | null
          tem_infraestrutura?: boolean | null
          tem_operacional?: boolean | null
          tem_sinalizacao_horizontal?: boolean | null
          tem_sinalizacao_vertical?: boolean | null
          tem_upload_arquivos?: boolean | null
          tipo_conexao?: string | null
          tipo_energia?: string | null
          tipo_equipamento?: string | null
          updated_at?: string
          velocidade?: string | null
        }
        Update: {
          conexao_instalada?: boolean | null
          contrato_id?: string
          created_at?: string
          croqui_caracterizacao_url?: string | null
          declaracao_conformidade_url?: string | null
          endereco?: string
          energia_instalada?: boolean | null
          estudo_viabilidade_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio?: string
          nao_intrusivo?: boolean | null
          numero_serie?: string
          prev_afericao?: number | null
          prev_ajustes?: number | null
          prev_bases?: number | null
          prev_bracos_projetados?: number | null
          prev_conectorizacao?: number | null
          prev_defensas?: number | null
          prev_lacos?: number | null
          prev_placas?: number | null
          prev_pontaletes?: number | null
          prev_postes_colapsiveis?: number | null
          prev_postes_horizontal?: number | null
          prev_postes_infra?: number | null
          prev_semi_porticos?: number | null
          prev_tae_100?: number | null
          prev_tae_80?: number | null
          projeto_croqui_url?: string | null
          quantidade_faixas?: number | null
          relatorio_vdm_url?: string | null
          sentido_id?: string | null
          tem_infraestrutura?: boolean | null
          tem_operacional?: boolean | null
          tem_sinalizacao_horizontal?: boolean | null
          tem_sinalizacao_vertical?: boolean | null
          tem_upload_arquivos?: boolean | null
          tipo_conexao?: string | null
          tipo_energia?: string | null
          tipo_equipamento?: string | null
          updated_at?: string
          velocidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamentos_sentido_id_fkey"
            columns: ["sentido_id"]
            isOneToOne: false
            referencedRelation: "sentidos"
            referencedColumns: ["id"]
          },
        ]
      }
      infraestrutura_itens: {
        Row: {
          categoria_item_id: string | null
          created_at: string
          data: string | null
          equipamento_id: string
          foto_url: string | null
          id: string
          quantidade: number
          tipo: string
          updated_at: string
        }
        Insert: {
          categoria_item_id?: string | null
          created_at?: string
          data?: string | null
          equipamento_id: string
          foto_url?: string | null
          id?: string
          quantidade?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          categoria_item_id?: string | null
          created_at?: string
          data?: string | null
          equipamento_id?: string
          foto_url?: string | null
          id?: string
          quantidade?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "infraestrutura_itens_categoria_item_id_fkey"
            columns: ["categoria_item_id"]
            isOneToOne: false
            referencedRelation: "categoria_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infraestrutura_itens_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais_recebidos: {
        Row: {
          contrato_id: string
          created_at: string
          data_recebimento: string
          id: string
          observacao: string | null
          quantidade: number
          tipo_material: string
          updated_at: string
        }
        Insert: {
          contrato_id: string
          created_at?: string
          data_recebimento: string
          id?: string
          observacao?: string | null
          quantidade?: number
          tipo_material: string
          updated_at?: string
        }
        Update: {
          contrato_id?: string
          created_at?: string
          data_recebimento?: string
          id?: string
          observacao?: string | null
          quantidade?: number
          tipo_material?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_recebidos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      operacional_itens: {
        Row: {
          categoria_item_id: string | null
          created_at: string
          data: string | null
          equipamento_id: string
          foto_url: string | null
          id: string
          observacao: string | null
          quantidade: number
          tipo: string
          updated_at: string
        }
        Insert: {
          categoria_item_id?: string | null
          created_at?: string
          data?: string | null
          equipamento_id: string
          foto_url?: string | null
          id?: string
          observacao?: string | null
          quantidade?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          categoria_item_id?: string | null
          created_at?: string
          data?: string | null
          equipamento_id?: string
          foto_url?: string | null
          id?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operacional_itens_categoria_item_id_fkey"
            columns: ["categoria_item_id"]
            isOneToOne: false
            referencedRelation: "categoria_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacional_itens_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sentidos: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      sinalizacao_horizontal_itens: {
        Row: {
          categoria_item_id: string | null
          created_at: string
          data: string | null
          endereco: string
          equipamento_id: string
          foto_url: string | null
          id: string
          lado: string
          latitude: number | null
          longitude: number | null
          qtd_laminas: number | null
          qtd_postes: number | null
          sentido_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          categoria_item_id?: string | null
          created_at?: string
          data?: string | null
          endereco: string
          equipamento_id: string
          foto_url?: string | null
          id?: string
          lado: string
          latitude?: number | null
          longitude?: number | null
          qtd_laminas?: number | null
          qtd_postes?: number | null
          sentido_id?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          categoria_item_id?: string | null
          created_at?: string
          data?: string | null
          endereco?: string
          equipamento_id?: string
          foto_url?: string | null
          id?: string
          lado?: string
          latitude?: number | null
          longitude?: number | null
          qtd_laminas?: number | null
          qtd_postes?: number | null
          sentido_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinalizacao_horizontal_itens_categoria_item_id_fkey"
            columns: ["categoria_item_id"]
            isOneToOne: false
            referencedRelation: "categoria_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinalizacao_horizontal_itens_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinalizacao_horizontal_itens_sentido_id_fkey"
            columns: ["sentido_id"]
            isOneToOne: false
            referencedRelation: "sentidos"
            referencedColumns: ["id"]
          },
        ]
      }
      sinalizacao_vertical_blocos: {
        Row: {
          categoria: string
          categoria_item_id: string | null
          created_at: string
          data: string | null
          endereco: string
          equipamento_id: string
          foto_url: string | null
          id: string
          instalacao: string
          lado: string
          latitude: number | null
          longitude: number | null
          qtd_perfis_metalicos: number | null
          qtd_pontaletes: number | null
          qtd_postes_colapsiveis: number | null
          sentido_id: string | null
          subtipo: string
          tipo: string
          total_m2: number | null
          updated_at: string
        }
        Insert: {
          categoria?: string
          categoria_item_id?: string | null
          created_at?: string
          data?: string | null
          endereco: string
          equipamento_id: string
          foto_url?: string | null
          id?: string
          instalacao: string
          lado: string
          latitude?: number | null
          longitude?: number | null
          qtd_perfis_metalicos?: number | null
          qtd_pontaletes?: number | null
          qtd_postes_colapsiveis?: number | null
          sentido_id?: string | null
          subtipo: string
          tipo: string
          total_m2?: number | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          categoria_item_id?: string | null
          created_at?: string
          data?: string | null
          endereco?: string
          equipamento_id?: string
          foto_url?: string | null
          id?: string
          instalacao?: string
          lado?: string
          latitude?: number | null
          longitude?: number | null
          qtd_perfis_metalicos?: number | null
          qtd_pontaletes?: number | null
          qtd_postes_colapsiveis?: number | null
          sentido_id?: string | null
          subtipo?: string
          tipo?: string
          total_m2?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinalizacao_vertical_blocos_categoria_item_id_fkey"
            columns: ["categoria_item_id"]
            isOneToOne: false
            referencedRelation: "categoria_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinalizacao_vertical_blocos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinalizacao_vertical_blocos_sentido_id_fkey"
            columns: ["sentido_id"]
            isOneToOne: false
            referencedRelation: "sentidos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_delete: { Args: { _user_id: string }; Returns: boolean }
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operador" | "consulta"
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
      app_role: ["admin", "operador", "consulta"],
    },
  },
} as const
