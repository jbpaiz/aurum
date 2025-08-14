import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          category: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          category: string
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          description?: string
          category?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'income' | 'expense'
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'income' | 'expense'
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'income' | 'expense'
          color?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
