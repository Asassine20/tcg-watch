export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Import necessary Supabase types
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js"

export interface Database {
  public: {
    Tables: {
      contact_requests: {
        Row: {
          company_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          message_body: string | null
          phone: string | null
          updated_at: Date | null
        }
        Insert: {
          company_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          message_body?: string | null
          phone?: string | null
          updated_at?: Date | null
        }
        Update: {
          company_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          message_body?: string | null
          phone?: string | null
          updated_at?: Date | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          company_name: string | null
          website: string | null
          unsubscribed: boolean
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: Date | null
          company_name?: string | null
          website?: string | null
          unsubscribed: boolean
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          company_name?: string | null
          website?: string | null
          unsubscribed: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          stripe_customer_id: string
          updated_at: Date | null
          user_id: string
        }
        Insert: {
          stripe_customer_id: string
          updated_at?: Date | null
          user_id: string
        }
        Update: {
          stripe_customer_id?: string
          updated_at?: Date | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: number
          category_id: number | null
          group_id: number | null
          set_name: string | null
          abbreviation: string | null
          product_id: number
          name: string
          clean_name: string
          image_url: string
          url: string
          low_price: number | null
          mid_price: number | null
          high_price: number | null
          market_price: number | null
          direct_low_price: number | null
          prev_low_price: number | null
          prev_mid_price: number | null
          prev_high_price: number | null
          prev_market_price: number | null
          prev_direct_low_price: number | null
          sub_type_name: string | null
          prev_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          category_id?: number | null
          group_id?: number | null
          set_name?: string | null
          abbreviation?: string | null
          product_id: number
          name: string
          clean_name: string
          image_url: string
          url: string
          low_price?: number | null
          mid_price?: number | null
          high_price?: number | null
          market_price?: number | null
          direct_low_price?: number | null
          prev_low_price?: number | null
          prev_mid_price?: number | null
          prev_high_price?: number | null
          prev_market_price?: number | null
          prev_direct_low_price?: number | null
          sub_type_name?: string | null
          prev_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          category_id?: number | null
          group_id?: number | null
          set_name?: string | null
          abbreviation?: string | null
          product_id?: number
          name?: string
          clean_name?: string
          image_url?: string
          url?: string
          low_price?: number | null
          mid_price?: number | null
          high_price?: number | null
          market_price?: number | null
          direct_low_price?: number | null
          prev_low_price?: number | null
          prev_mid_price?: number | null
          prev_high_price?: number | null
          prev_market_price?: number | null
          prev_direct_low_price?: number | null
          sub_type_name?: string | null
          prev_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_distinct_group_ids: {
        Args: Record<string, never>
        Returns: {
          group_id: number | null
        }[]
      }
      get_products_by_group_id: {
        Args: {
          p_group_id: number
        }
        Returns: {
          id: number
          product_id: number
          name: string
          clean_name: string
          image_url: string
          url: string
          low_price: number | null
          mid_price: number | null
          high_price: number | null
          market_price: number | null
          direct_low_price: number | null
          prev_low_price: number | null
          prev_mid_price: number | null
          prev_high_price: number | null
          prev_market_price: number | null
          prev_direct_low_price: number | null
          group_id: number | null
          set_name: string | null
        }[]
      }
      update_product_prices: {
        Args: {
          p_id: number
          p_new_low_price: number | null
          p_new_mid_price: number | null
          p_new_high_price: number | null
          p_new_market_price: number | null
          p_new_direct_low_price: number | null
          p_prev_date: string // Date in 'YYYY-MM-DD' format
        }
        Returns: boolean
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
