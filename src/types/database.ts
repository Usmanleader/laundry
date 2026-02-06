// Washerman Karachi Database Types
// Auto-generated types compatible with Supabase client

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          address_line1: string
          address_line2: string | null
          area: string
          city: string
          postal_code: string | null
          delivery_instructions: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          address_line1: string
          address_line2?: string | null
          area: string
          city?: string
          postal_code?: string | null
          delivery_instructions?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          address_line1?: string
          address_line2?: string | null
          area?: string
          city?: string
          postal_code?: string | null
          delivery_instructions?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      driver_locations: {
        Row: {
          id: string
          driver_id: string
          latitude: number
          longitude: number
          heading: number | null
          speed: number | null
          accuracy: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          latitude: number
          longitude: number
          heading?: number | null
          speed?: number | null
          accuracy?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          latitude?: number
          longitude?: number
          heading?: number | null
          speed?: number | null
          accuracy?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          service_id: string
          quantity: number
          weight_kg: number | null
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          service_id: string
          quantity?: number
          weight_kg?: number | null
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          service_id?: string
          quantity?: number
          weight_kg?: number | null
          unit_price?: number
          total_price?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      order_tracking: {
        Row: {
          id: string
          order_id: string
          status: string
          notes: string | null
          updated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          notes?: string | null
          updated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          notes?: string | null
          updated_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tracking_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          pickup_address_id: string
          delivery_address_id: string
          status: string
          payment_method: string
          payment_status: string
          subtotal: number
          delivery_fee: number
          discount_amount: number
          total_amount: number
          promo_code: string | null
          preferred_pickup_time: string | null
          preferred_delivery_time: string | null
          actual_pickup_time: string | null
          actual_delivery_time: string | null
          special_instructions: string | null
          assigned_driver_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number?: string
          pickup_address_id: string
          delivery_address_id: string
          status?: string
          payment_method?: string
          payment_status?: string
          subtotal?: number
          delivery_fee?: number
          discount_amount?: number
          total_amount?: number
          promo_code?: string | null
          preferred_pickup_time?: string | null
          preferred_delivery_time?: string | null
          actual_pickup_time?: string | null
          actual_delivery_time?: string | null
          special_instructions?: string | null
          assigned_driver_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          pickup_address_id?: string
          delivery_address_id?: string
          status?: string
          payment_method?: string
          payment_status?: string
          subtotal?: number
          delivery_fee?: number
          discount_amount?: number
          total_amount?: number
          promo_code?: string | null
          preferred_pickup_time?: string | null
          preferred_delivery_time?: string | null
          actual_pickup_time?: string | null
          actual_delivery_time?: string | null
          special_instructions?: string | null
          assigned_driver_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pickup_address_id_fkey"
            columns: ["pickup_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          date_of_birth: string | null
          gender: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      promotions: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: string
          discount_value: number
          min_order_amount: number
          max_discount_amount: number | null
          usage_limit: number | null
          times_used: number
          valid_from: string
          valid_until: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: string
          discount_value: number
          min_order_amount?: number
          max_discount_amount?: number | null
          usage_limit?: number | null
          times_used?: number
          valid_from?: string
          valid_until: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          min_order_amount?: number
          max_discount_amount?: number | null
          usage_limit?: number | null
          times_used?: number
          valid_from?: string
          valid_until?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          user_id: string | null
          order_id: string
          rating: number
          review_text: string | null
          response_text: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_id: string
          rating: number
          review_text?: string | null
          response_text?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_id?: string
          rating?: number
          review_text?: string | null
          response_text?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          base_price: number
          price_per_kg: number | null
          price_per_unit: number | null
          price_type: string | null
          estimated_hours: number | null
          estimated_duration: string | null
          turnaround_hours: number | null
          image_url: string | null
          features: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          base_price?: number
          price_per_kg?: number | null
          price_per_unit?: number | null
          price_type?: string | null
          estimated_hours?: number | null
          estimated_duration?: string | null
          turnaround_hours?: number | null
          image_url?: string | null
          features?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          base_price?: number
          price_per_kg?: number | null
          price_per_unit?: number | null
          price_type?: string | null
          estimated_hours?: number | null
          estimated_duration?: string | null
          turnaround_hours?: number | null
          image_url?: string | null
          features?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================
// CONVENIENCE TYPE EXPORTS
// =============================================

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

// Shorthand types for common usage
export type Profile = Tables<'profiles'>
export type Address = Tables<'addresses'>
export type Service = Tables<'services'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type OrderTracking = Tables<'order_tracking'>
export type Promotion = Tables<'promotions'>
export type Notification = Tables<'notifications'>
export type Review = Tables<'reviews'>
export type DriverLocation = Tables<'driver_locations'>
