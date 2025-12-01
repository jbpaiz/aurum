// ============================================
// AURUM - TIPOS TYPESCRIPT ATUALIZADOS
// ============================================
// Tipos consistentes com UUID para todas as entidades

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          id: string // UUID
          user_id: string // UUID
          name: string
          type: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
          bank: string | null
          icon: string
          color: string
          balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
          bank?: string | null
          icon?: string
          color?: string
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
          bank?: string | null
          icon?: string
          color?: string
          balance?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_providers: {
        Row: {
          id: string // TEXT (visa, mastercard, etc)
          name: string
          icon: string
          color: string
          popular_brands: string[] | null
          supported_types: string[]
          created_at: string
        }
        Insert: {
          id: string
          name: string
          icon: string
          color: string
          popular_brands?: string[] | null
          supported_types: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
          popular_brands?: string[] | null
          supported_types?: string[]
          created_at?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          id: string // UUID
          user_id: string // UUID
          provider_id: string // FK para card_providers
          account_id: string // UUID - FK para bank_accounts
          alias: string
          last_four_digits: string | null
          type: 'credit' | 'debit'
          is_active: boolean
          credit_limit: number | null
          current_balance: number | null
          due_day: number | null
          closing_day: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider_id: string
          account_id: string
          alias: string
          last_four_digits?: string | null
          type: 'credit' | 'debit'
          is_active?: boolean
          credit_limit?: number | null
          current_balance?: number | null
          due_day?: number | null
          closing_day?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider_id?: string
          account_id?: string
          alias?: string
          last_four_digits?: string | null
          type?: 'credit' | 'debit'
          is_active?: boolean
          credit_limit?: number | null
          current_balance?: number | null
          due_day?: number | null
          closing_day?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_provider_id_fkey"
            columns: ["provider_id"]
            referencedRelation: "card_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_methods: {
        Row: {
          id: string // UUID
          user_id: string // UUID
          name: string
          type: 'pix' | 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other'
          account_id: string // UUID - FK para bank_accounts
          card_id: string | null // UUID - FK para cards
          icon: string
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'pix' | 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other'
          account_id: string
          card_id?: string | null
          icon?: string
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'pix' | 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other'
          account_id?: string
          card_id?: string | null
          icon?: string
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_card_id_fkey"
            columns: ["card_id"]
            referencedRelation: "cards"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string // UUID
          user_id: string | null // UUID - null para categorias padrão
          name: string
          type: 'income' | 'expense' | 'both'
          icon: string | null
          color: string | null
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          type: 'income' | 'expense' | 'both'
          icon?: string | null
          color?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          type?: 'income' | 'expense' | 'both'
          icon?: string | null
          color?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string // UUID
          user_id: string // UUID
          type: 'income' | 'expense' | 'transfer' // ✅ INCLUINDO TRANSFER!
          description: string
          amount: number
          
          // Campos para income/expense
          category_id: string | null // UUID - FK para categories
          payment_method_id: string | null // UUID - FK para payment_methods
          account_id: string | null // UUID - FK para bank_accounts
          
          // Campos para transfer
          from_account_id: string | null // UUID - FK para bank_accounts
          to_account_id: string | null // UUID - FK para bank_accounts
          
          // Campos gerais
          transaction_date: string // DATE
          installments: number
          current_installment: number
          is_installment: boolean
          parent_transaction_id: string | null // UUID - FK para transactions
          notes: string | null
          is_confirmed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense' | 'transfer'
          description: string
          amount: number
          category_id?: string | null
          payment_method_id?: string | null
          account_id?: string | null
          from_account_id?: string | null
          to_account_id?: string | null
          transaction_date: string
          installments?: number
          current_installment?: number
          is_installment?: boolean
          parent_transaction_id?: string | null
          notes?: string | null
          is_confirmed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense' | 'transfer'
          description?: string
          amount?: number
          category_id?: string | null
          payment_method_id?: string | null
          account_id?: string | null
          from_account_id?: string | null
          to_account_id?: string | null
          transaction_date?: string
          installments?: number
          current_installment?: number
          is_installment?: boolean
          parent_transaction_id?: string | null
          notes?: string | null
          is_confirmed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_from_account_id_fkey"
            columns: ["from_account_id"]
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      budgets: {
        Row: {
          id: string // UUID
          user_id: string // UUID
          name: string
          category_id: string | null // UUID - FK para categories
          amount: number
          period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string // DATE
          end_date: string // DATE
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category_id?: string | null
          amount: number
          period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category_id?: string | null
          amount?: number
          period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_reports: {
        Row: {
          id: string
          user_id: string
          title: string
          period_start: string
          period_end: string
          total_income: number
          total_expense: number
          net_total: number
          filters: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          period_start: string
          period_end: string
          total_income?: number
          total_expense?: number
          net_total?: number
          filters?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          period_start?: string
          period_end?: string
          total_income?: number
          total_expense?: number
          net_total?: number
          filters?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_report_lines: {
        Row: {
          id: string
          report_id: string
          user_id: string
          transaction_id: string
          type: 'income' | 'expense'
          amount: number
          category: string | null
          description: string | null
          transaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          transaction_id: string
          type: 'income' | 'expense'
          amount: number
          category?: string | null
          description?: string | null
          transaction_date: string
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          transaction_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string | null
          description?: string | null
          transaction_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_report_lines_report_id_fkey"
            columns: ["report_id"]
            referencedRelation: "financial_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_report_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      task_projects: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string
          description: string | null
          color: string
          icon: string
          issue_counter: number
          sort_order: number
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          code: string
          description?: string | null
          color?: string
          icon?: string
          issue_counter?: number
          sort_order?: number
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          code?: string
          description?: string | null
          color?: string
          icon?: string
          issue_counter?: number
          sort_order?: number
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_boards: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          view_mode: string
          swimlane_mode: string
          filter: Json
          is_default: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          view_mode?: string
          swimlane_mode?: string
          filter?: Json
          is_default?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          view_mode?: string
          swimlane_mode?: string
          filter?: Json
          is_default?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_boards_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          }
        ]
      }
      task_sprints: {
        Row: {
          id: string
          project_id: string
          board_id: string
          name: string
          goal: string | null
          status: Database['public']['Enums']['task_sprint_status']
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string
          board_id: string
          name: string
          goal?: string | null
          status?: Database['public']['Enums']['task_sprint_status']
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          board_id?: string
          name?: string
          goal?: string | null
          status?: Database['public']['Enums']['task_sprint_status']
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_sprints_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "task_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_sprints_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          }
        ]
      }
      task_columns: {
        Row: {
          id: string
          board_id: string
          name: string
          slug: string
          category: Database['public']['Enums']['task_column_category']
          color: string
          wip_limit: number | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          name: string
          slug: string
          category?: Database['public']['Enums']['task_column_category']
          color?: string
          wip_limit?: number | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          name?: string
          slug?: string
          category?: Database['public']['Enums']['task_column_category']
          color?: string
          wip_limit?: number | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_columns_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "task_boards"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          board_id: string
          column_id: string
          sprint_id: string | null
          user_id: string
          key: string
          title: string
          description: string | null
          type: Database['public']['Enums']['task_type']
          priority: Database['public']['Enums']['task_priority']
          reporter_id: string | null
          assignee_id: string | null
          due_date: string | null
          start_date: string | null
          labels: string[]
          attachments: Json
          checklist: Json
          is_blocked: boolean
          blocked_reason: string | null
          story_points: number | null
          estimate_hours: number | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string
          board_id: string
          column_id: string
          sprint_id?: string | null
          user_id?: string
          key?: string
          title: string
          description?: string | null
          type?: Database['public']['Enums']['task_type']
          priority?: Database['public']['Enums']['task_priority']
          reporter_id?: string | null
          assignee_id?: string | null
          due_date?: string | null
          start_date?: string | null
          labels?: string[]
          attachments?: Json
          checklist?: Json
          is_blocked?: boolean
          blocked_reason?: string | null
          story_points?: number | null
          estimate_hours?: number | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          board_id?: string
          column_id?: string
          sprint_id?: string | null
          user_id?: string
          key?: string
          title?: string
          description?: string | null
          type?: Database['public']['Enums']['task_type']
          priority?: Database['public']['Enums']['task_priority']
          reporter_id?: string | null
          assignee_id?: string | null
          due_date?: string | null
          start_date?: string | null
          labels?: string[]
          attachments?: Json
          checklist?: Json
          is_blocked?: boolean
          blocked_reason?: string | null
          story_points?: number | null
          estimate_hours?: number | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "task_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_column_id_fkey"
            columns: ["column_id"]
            referencedRelation: "task_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            referencedRelation: "task_sprints"
            referencedColumns: ["id"]
          }
        ]
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          body: string
          attachments: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          body: string
          attachments?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          body?: string
          attachments?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_demo_data_for_user: {
        Args: {
          user_uuid: string // UUID
        }
        Returns: undefined
      }
      get_unified_transactions: {
        Args: {
          p_user_id: string // UUID
          p_limit?: number
        }
        Returns: {
          id: string // UUID
          type: string
          description: string
          amount: number
          category_name: string | null
          transaction_date: string
          account_name: string | null
          from_account_name: string | null
          to_account_name: string | null
          payment_method_name: string | null
          installments: number
          current_installment: number
          is_installment: boolean
          notes: string | null
          created_at: string
        }[]
      }
    }
    Enums: {
      task_priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest'
      task_type: 'task' | 'bug' | 'story' | 'epic'
      task_sprint_status: 'planned' | 'active' | 'completed'
      task_column_category: 'backlog' | 'todo' | 'in_progress' | 'waiting' | 'review' | 'done'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================
// TIPOS AUXILIARES PARA O FRONTEND
// ============================================

// Tipo para transação unificada no frontend
export interface UnifiedTransaction {
  id: string
  user_id: string
  type: 'income' | 'expense' | 'transfer'
  description: string
  amount: number
  
  // Para income/expense
  category_id?: string | null
  payment_method_id?: string | null
  account_id?: string | null
  
  // Para transfer
  from_account_id?: string | null
  to_account_id?: string | null
  
  // Campos gerais
  transaction_date: string
  installments?: number
  current_installment?: number
  is_installment?: boolean
  parent_transaction_id?: string | null
  notes?: string | null
  is_confirmed?: boolean
  created_at?: string
  updated_at?: string
}

// Tipo para conta bancária
export interface BankAccount {
  id: string
  user_id: string
  name: string
  type: 'checking' | 'savings' | 'wallet' | 'investment' | 'other'
  bank?: string | null
  icon: string
  color: string
  balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Tipo para categoria
export interface Category {
  id: string
  user_id?: string | null
  name: string
  type: 'income' | 'expense' | 'both'
  icon?: string | null
  color?: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// Tipo para método de pagamento
export interface PaymentMethod {
  id: string
  user_id: string
  name: string
  type: 'pix' | 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other'
  account_id: string
  card_id?: string | null
  icon: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Tipo para resultado da função get_unified_transactions
export interface UnifiedTransactionResult {
  id: string
  type: string
  description: string
  amount: number
  category_name: string | null
  transaction_date: string
  account_name: string | null
  from_account_name: string | null
  to_account_name: string | null
  payment_method_name: string | null
  installments: number
  current_installment: number
  is_installment: boolean
  notes: string | null
  created_at: string
}

export type { Database as default }
