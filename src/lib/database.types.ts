// Tipos gerados automaticamente do Supabase
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
          id: string
          user_id: string
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
          icon: string
          color: string
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
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      card_providers: {
        Row: {
          id: string
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
          id: string
          user_id: string
          provider_id: string
          account_id: string
          alias: string
          last_four_digits: string | null
          type: 'credit' | 'debit'
          is_active: boolean
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
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          id: string
          user_id: string
          name: string
          type: 'pix' | 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other'
          account_id: string
          card_id: string | null
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
          icon: string
          color: string
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
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          id: string
          user_id: string | null
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
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          description: string
          amount: number
          category_id: string | null
          payment_method_id: string | null
          account_id: string
          transaction_date: string
          installments: number
          current_installment: number
          is_installment: boolean
          parent_transaction_id: string | null
          notes: string | null
          is_confirmed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          description: string
          amount: number
          category_id?: string | null
          payment_method_id?: string | null
          account_id: string
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
          type?: 'income' | 'expense'
          description?: string
          amount?: number
          category_id?: string | null
          payment_method_id?: string | null
          account_id?: string
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
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      transfers: {
        Row: {
          id: string
          user_id: string
          from_account_id: string
          to_account_id: string
          amount: number
          description: string | null
          transfer_date: string
          fees: number
          from_transaction_id: string | null
          to_transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_account_id: string
          to_account_id: string
          amount: number
          description?: string | null
          transfer_date: string
          fees?: number
          from_transaction_id?: string | null
          to_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_account_id?: string
          to_account_id?: string
          amount?: number
          description?: string | null
          transfer_date?: string
          fees?: number
          from_transaction_id?: string | null
          to_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          category_id: string | null
          amount: number
          period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string
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
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
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
          user_uuid: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}