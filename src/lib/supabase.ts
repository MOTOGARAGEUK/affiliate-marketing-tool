import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client for client-side operations (singleton)
let browserClient: ReturnType<typeof createBrowserClient> | null = null
export const supabase = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

// Server client for server-side operations (singleton)
let serverClient: ReturnType<typeof createClient> | null = null
export const createServerClient = () => {
  if (!serverClient) {
    serverClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return serverClient
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          name: string
          type: 'signup' | 'purchase'
          commission: number
          commission_type: 'fixed' | 'percentage'
          status: 'active' | 'inactive'
          description: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'signup' | 'purchase'
          commission: number
          commission_type: 'fixed' | 'percentage'
          status?: 'active' | 'inactive'
          description: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'signup' | 'purchase'
          commission?: number
          commission_type?: 'fixed' | 'percentage'
          status?: 'active' | 'inactive'
          description?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      affiliates: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          status: 'pending' | 'active' | 'inactive'
          program_id: string
          referral_code: string
          referral_link: string
          total_referrals: number
          total_earnings: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          status?: 'pending' | 'active' | 'inactive'
          program_id: string
          referral_code?: string
          referral_link?: string
          total_referrals?: number
          total_earnings?: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          status?: 'pending' | 'active' | 'inactive'
          program_id?: string
          referral_code?: string
          referral_link?: string
          total_referrals?: number
          total_earnings?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          affiliate_id: string
          program_id: string
          customer_email: string
          customer_name: string | null
          status: 'pending' | 'approved' | 'rejected'
          commission: number
          referral_code: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          affiliate_id: string
          program_id: string
          customer_email: string
          customer_name?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          commission: number
          referral_code: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          affiliate_id?: string
          program_id?: string
          customer_email?: string
          customer_name?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          commission?: number
          referral_code?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      payouts: {
        Row: {
          id: string
          affiliate_id: string
          amount: number
          status: 'pending' | 'paid' | 'failed'
          method: 'bank' | 'paypal' | 'stripe'
          reference: string
          user_id: string
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          affiliate_id: string
          amount: number
          status?: 'pending' | 'paid' | 'failed'
          method: 'bank' | 'paypal' | 'stripe'
          reference: string
          user_id: string
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          affiliate_id?: string
          amount?: number
          status?: 'pending' | 'paid' | 'failed'
          method?: 'bank' | 'paypal' | 'stripe'
          reference?: string
          user_id?: string
          created_at?: string
          paid_at?: string | null
        }
      }
      integrations: {
        Row: {
          id: string
          name: string
          type: 'sharetribe' | 'shopify' | 'woocommerce' | 'custom'
          status: 'connected' | 'disconnected' | 'error'
          config: Record<string, any>
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'sharetribe' | 'shopify' | 'woocommerce' | 'custom'
          status?: 'connected' | 'disconnected' | 'error'
          config: Record<string, any>
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'sharetribe' | 'shopify' | 'woocommerce' | 'custom'
          status?: 'connected' | 'disconnected' | 'error'
          config?: Record<string, any>
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 