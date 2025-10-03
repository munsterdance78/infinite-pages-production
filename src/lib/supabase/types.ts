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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_tier: 'basic' | 'premium'
          subscription_status: string
          stripe_customer_id: string | null
          current_period_end: string | null
          tokens_remaining: number
          tokens_used_total: number
          last_token_grant: string | null
          stories_created: number
          words_generated: number
          onboarding_complete: boolean | null
          writing_goals: string[] | null
          preferred_genres: string[] | null
          experience_level: string | null
          writing_frequency: string | null
          credits_balance: number
          credits_earned_total: number
          credits_spent_total: number
          cache_hits: number
          cache_discount_earned: number
          is_creator: boolean
          creator_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null
          total_earnings_usd: number
          pending_payout_usd: number
          stripe_connect_account_id: string | null
          stripe_account_status: 'incomplete' | 'pending' | 'active' | null
          stripe_charges_enabled: boolean | null
          stripe_payouts_enabled: boolean | null
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_tier?: 'basic' | 'premium'
          subscription_status?: string
          stripe_customer_id?: string | null
          current_period_end?: string | null
          tokens_remaining?: number
          tokens_used_total?: number
          last_token_grant?: string | null
          stories_created?: number
          words_generated?: number
          onboarding_complete?: boolean | null
          writing_goals?: string[] | null
          preferred_genres?: string[] | null
          experience_level?: string | null
          writing_frequency?: string | null
          credits_balance?: number
          credits_earned_total?: number
          credits_spent_total?: number
          cache_hits?: number
          cache_discount_earned?: number
          is_creator?: boolean
          creator_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | null
          total_earnings_usd?: number
          pending_payout_usd?: number
          stripe_connect_account_id?: string | null
          stripe_account_status?: 'incomplete' | 'pending' | 'active' | null
          stripe_charges_enabled?: boolean | null
          stripe_payouts_enabled?: boolean | null
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          subscription_tier?: 'basic' | 'premium'
          subscription_status?: string
          stripe_customer_id?: string | null
          current_period_end?: string | null
          tokens_remaining?: number
          tokens_used_total?: number
          last_token_grant?: string | null
          stories_created?: number
          words_generated?: number
          onboarding_complete?: boolean | null
          writing_goals?: string[] | null
          preferred_genres?: string[] | null
          experience_level?: string | null
          writing_frequency?: string | null
          credits_balance?: number
          credits_earned_total?: number
          credits_spent_total?: number
          cache_hits?: number
          cache_discount_earned?: number
          is_creator?: boolean
          creator_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | null
          total_earnings_usd?: number
          pending_payout_usd?: number
          stripe_connect_account_id?: string | null
          stripe_account_status?: 'incomplete' | 'pending' | 'active' | null
          stripe_charges_enabled?: boolean | null
          stripe_payouts_enabled?: boolean | null
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          title: string
          genre: string | null
          premise: string | null
          foundation: Json | null
          outline: Json | null
          characters: Json
          status: string
          word_count: number
          chapter_count: number
          total_tokens_used: number
          total_cost_usd: number
          target_length: number
          target_chapters: number
          target_chapter_length: number
          is_published: boolean | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          genre?: string | null
          premise?: string | null
          foundation?: Json | null
          outline?: Json | null
          characters?: Json
          status?: string
          word_count?: number
          chapter_count?: number
          total_tokens_used?: number
          total_cost_usd?: number
          target_length?: number
          target_chapters?: number
          target_chapter_length?: number
          is_published?: boolean | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          genre?: string | null
          premise?: string | null
          foundation?: Json | null
          outline?: Json | null
          characters?: Json
          status?: string
          word_count?: number
          chapter_count?: number
          total_tokens_used?: number
          total_cost_usd?: number
          target_length?: number
          target_chapters?: number
          target_chapter_length?: number
          is_published?: boolean | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          story_id: string
          chapter_number: number
          title: string | null
          content: string | null
          summary: string | null
          word_count: number
          tokens_used_input: number
          tokens_used_output: number
          generation_cost_usd: number
          prompt_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          chapter_number: number
          title?: string | null
          content?: string | null
          summary?: string | null
          word_count?: number
          tokens_used_input?: number
          tokens_used_output?: number
          generation_cost_usd?: number
          prompt_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          chapter_number?: number
          title?: string | null
          content?: string | null
          summary?: string | null
          word_count?: number
          tokens_used_input?: number
          tokens_used_output?: number
          generation_cost_usd?: number
          prompt_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generation_logs: {
        Row: {
          id: string
          user_id: string
          story_id: string | null
          chapter_id: string | null
          operation_type: string
          tokens_input: number
          tokens_output: number
          cost_usd: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id?: string | null
          chapter_id?: string | null
          operation_type: string
          tokens_input: number
          tokens_output: number
          cost_usd: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string | null
          chapter_id?: string | null
          operation_type?: string
          tokens_input?: number
          tokens_output?: number
          cost_usd?: number
          created_at?: string
        }
      }
      story_reads: {
        Row: {
          id: string
          reader_id: string
          story_id: string
          creator_id: string
          credits_paid: number
          unlocked_at: string
        }
        Insert: {
          id?: string
          reader_id: string
          story_id: string
          creator_id: string
          credits_paid?: number
          unlocked_at?: string
        }
        Update: {
          id?: string
          reader_id?: string
          story_id?: string
          creator_id?: string
          credits_paid?: number
          unlocked_at?: string
        }
      }
      character_facts: {
        Row: {
          id: string
          story_id: string
          chapter_id: string | null
          character_name: string
          physical_description: string | null
          personality_traits: string[] | null
          goals_longterm: string[] | null
          relationships: Json | null
          confidence: number | null
          extraction_model: string | null
          extraction_cost_usd: number | null
          genre_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          chapter_id?: string | null
          character_name: string
          physical_description?: string | null
          personality_traits?: string[] | null
          goals_longterm?: string[] | null
          relationships?: Json | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          chapter_id?: string | null
          character_name?: string
          physical_description?: string | null
          personality_traits?: string[] | null
          goals_longterm?: string[] | null
          relationships?: Json | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      location_facts: {
        Row: {
          id: string
          story_id: string
          chapter_id: string | null
          location_name: string
          physical_layout: string | null
          atmosphere_mood: string | null
          danger_level: string | null
          confidence: number | null
          extraction_model: string | null
          extraction_cost_usd: number | null
          genre_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          chapter_id?: string | null
          location_name: string
          physical_layout?: string | null
          atmosphere_mood?: string | null
          danger_level?: string | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          chapter_id?: string | null
          location_name?: string
          physical_layout?: string | null
          atmosphere_mood?: string | null
          danger_level?: string | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      plot_event_facts: {
        Row: {
          id: string
          story_id: string
          chapter_id: string | null
          event_name: string
          event_description: string
          chapter_position: number | null
          significance: string | null
          tension_level: string | null
          confidence: number | null
          extraction_model: string | null
          extraction_cost_usd: number | null
          genre_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          chapter_id?: string | null
          event_name: string
          event_description: string
          chapter_position?: number | null
          significance?: string | null
          tension_level?: string | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          chapter_id?: string | null
          event_name?: string
          event_description?: string
          chapter_position?: number | null
          significance?: string | null
          tension_level?: string | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      world_rule_facts: {
        Row: {
          id: string
          story_id: string
          chapter_id: string | null
          rule_name: string
          rule_description: string
          category: string | null
          implications: string | null
          confidence: number | null
          extraction_model: string | null
          extraction_cost_usd: number | null
          genre_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          chapter_id?: string | null
          rule_name: string
          rule_description: string
          category?: string | null
          implications?: string | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          chapter_id?: string | null
          rule_name?: string
          rule_description?: string
          category?: string | null
          implications?: string | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      timeline_facts: {
        Row: {
          id: string
          story_id: string
          chapter_id: string | null
          event_name: string
          chronological_order: number | null
          time_reference: string | null
          is_flashback: boolean | null
          confidence: number | null
          extraction_model: string | null
          extraction_cost_usd: number | null
          genre_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          chapter_id?: string | null
          event_name: string
          chronological_order?: number | null
          time_reference?: string | null
          is_flashback?: boolean | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          chapter_id?: string | null
          event_name?: string
          chronological_order?: number | null
          time_reference?: string | null
          is_flashback?: boolean | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      theme_facts: {
        Row: {
          id: string
          story_id: string
          chapter_id: string | null
          theme_name: string
          motif_description: string | null
          message_meaning: string | null
          narrative_voice: string | null
          confidence: number | null
          extraction_model: string | null
          extraction_cost_usd: number | null
          genre_metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          chapter_id?: string | null
          theme_name: string
          motif_description?: string | null
          message_meaning?: string | null
          narrative_voice?: string | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          chapter_id?: string | null
          theme_name?: string
          motif_description?: string | null
          message_meaning?: string | null
          narrative_voice?: string | null
          confidence?: number | null
          extraction_model?: string | null
          extraction_cost_usd?: number | null
          genre_metadata?: Json | null
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
