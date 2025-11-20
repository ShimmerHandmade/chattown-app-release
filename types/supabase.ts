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
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          bio: string
          avatar_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          bio?: string
          avatar_color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          bio?: string
          avatar_color?: string
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
          created_by?: string
        }
      }
      room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          text?: string
          created_at?: string
        }
      }
      push_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
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
