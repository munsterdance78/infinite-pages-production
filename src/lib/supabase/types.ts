export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          subscription_tier: 'basic' | 'premium';
          subscription_status: string;
          stripe_customer_id: string | null;
          current_period_end: string | null;
          tokens_remaining: number;
          tokens_used_total: number;
          last_token_grant: string | null;
          stories_created: number;
          words_generated: number;
          onboarding_complete: boolean | null;
          writing_goals: string[] | null;
          preferred_genres: string[] | null;
          experience_level: string | null;
          writing_frequency: string | null;
          // Credit System Fields
          credits_balance: number;
          credits_earned_total: number;
          credits_spent_total: number;
          cache_hits: number;
          cache_discount_earned: number;
          // Creator Fields
          is_creator: boolean;
          creator_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
          total_earnings_usd: number;
          pending_payout_usd: number;
          stripe_connect_account_id: string | null;
          stripe_account_status: 'incomplete' | 'pending' | 'active' | null;
          stripe_charges_enabled: boolean | null;
          stripe_payouts_enabled: boolean | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          subscription_tier?: 'basic' | 'premium';
          subscription_status?: string;
          stripe_customer_id?: string | null;
          current_period_end?: string | null;
          tokens_remaining?: number;
          tokens_used_total?: number;
          last_token_grant?: string | null;
          stories_created?: number;
          words_generated?: number;
          onboarding_complete?: boolean | null;
          writing_goals?: string[] | null;
          preferred_genres?: string[] | null;
          experience_level?: string | null;
          writing_frequency?: string | null;
          credits_balance?: number;
          credits_earned_total?: number;
          credits_spent_total?: number;
          cache_hits?: number;
          cache_discount_earned?: number;
          is_creator?: boolean;
          creator_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
          total_earnings_usd?: number;
          pending_payout_usd?: number;
          stripe_connect_account_id?: string | null;
          stripe_account_status?: 'incomplete' | 'pending' | 'active' | null;
          stripe_charges_enabled?: boolean | null;
          stripe_payouts_enabled?: boolean | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          subscription_tier?: 'basic' | 'premium';
          subscription_status?: string;
          stripe_customer_id?: string | null;
          current_period_end?: string | null;
          tokens_remaining?: number;
          tokens_used_total?: number;
          last_token_grant?: string | null;
          stories_created?: number;
          words_generated?: number;
          onboarding_complete?: boolean | null;
          writing_goals?: string[] | null;
          preferred_genres?: string[] | null;
          experience_level?: string | null;
          writing_frequency?: string | null;
          credits_balance?: number;
          credits_earned_total?: number;
          credits_spent_total?: number;
          cache_hits?: number;
          cache_discount_earned?: number;
          is_creator?: boolean;
          creator_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
          total_earnings_usd?: number;
          pending_payout_usd?: number;
          stripe_connect_account_id?: string | null;
          stripe_account_status?: 'incomplete' | 'pending' | 'active' | null;
          stripe_charges_enabled?: boolean | null;
          stripe_payouts_enabled?: boolean | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          genre: string | null;
          premise: string | null;
          foundation: {
            premise?: string
            characters?: Array<{ name: string; role: string }>
            setting?: { time: string; place: string }
            themes?: string[]
            [key: string]: unknown
          } | null;
          outline: {
            acts?: Array<{ title: string; chapters: string[] }>
            plot_points?: string[]
            structure?: string
            [key: string]: unknown
          } | null;
          characters: {
            main?: Array<{
              name: string
              role: string
              description: string
              arc?: string
            }>
            supporting?: Array<{
              name: string
              role: string
              description?: string
            }>
            [key: string]: unknown
          };
          status: string;
          word_count: number;
          chapter_count: number;
          total_tokens_used: number;
          total_cost_usd: number;
          target_length: number;
          target_chapters: number;
          target_chapter_length: number;
          is_published: boolean | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          genre?: string | null;
          premise?: string | null;
          foundation?: {
            premise?: string
            characters?: Array<{ name: string; role: string }>
            setting?: { time: string; place: string }
            themes?: string[]
            [key: string]: unknown
          } | null;
          outline?: {
            acts?: Array<{ title: string; chapters: string[] }>
            plot_points?: string[]
            structure?: string
            [key: string]: unknown
          } | null;
          characters?: {
            main?: Array<{
              name: string
              role: string
              description: string
              arc?: string
            }>
            supporting?: Array<{
              name: string
              role: string
              description?: string
            }>
            [key: string]: unknown
          };
          status?: string;
          word_count?: number;
          chapter_count?: number;
          total_tokens_used?: number;
          total_cost_usd?: number;
          target_length?: number;
          target_chapters?: number;
          target_chapter_length?: number;
          is_published?: boolean | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          genre?: string | null;
          premise?: string | null;
          foundation?: {
            premise?: string
            characters?: Array<{ name: string; role: string }>
            setting?: { time: string; place: string }
            themes?: string[]
            [key: string]: unknown
          } | null;
          outline?: {
            acts?: Array<{ title: string; chapters: string[] }>
            plot_points?: string[]
            structure?: string
            [key: string]: unknown
          } | null;
          characters?: {
            main?: Array<{
              name: string
              role: string
              description: string
              arc?: string
            }>
            supporting?: Array<{
              name: string
              role: string
              description?: string
            }>
            [key: string]: unknown
          };
          status?: string;
          word_count?: number;
          chapter_count?: number;
          total_tokens_used?: number;
          total_cost_usd?: number;
          target_length?: number;
          target_chapters?: number;
          target_chapter_length?: number;
          is_published?: boolean | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          story_id: string;
          chapter_number: number;
          title: string | null;
          content: string | null;
          summary: string | null;
          word_count: number;
          tokens_used_input: number;
          tokens_used_output: number;
          generation_cost_usd: number;
          prompt_type: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      generation_logs: {
        Row: {
          id: string;
          user_id: string;
          story_id: string | null;
          chapter_id: string | null;
          operation_type: string;
          tokens_input: number;
          tokens_output: number;
          cost_usd: number;
          created_at: string;
        };
      };
      exports: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          format: string;
          status: string;
          file_url: string | null;
          file_size_bytes: number | null;
          created_at: string;
          expires_at: string;
        };
      };
      // Credit System Tables
      credit_packages: {
        Row: {
          id: string;
          name: string;
          description: string;
          credits_amount: number;
          price_usd: number;
          bonus_credits: number;
          stripe_price_id: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          credits_amount: number;
          price_usd: number;
          bonus_credits?: number;
          stripe_price_id: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          credits_amount?: number;
          price_usd?: number;
          bonus_credits?: number;
          stripe_price_id?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: 'purchase' | 'spend' | 'earn' | 'bonus' | 'refund';
          amount: number;
          balance_after: number;
          description: string;
          reference_id: string | null;
          reference_type: 'story_read' | 'cache_hit' | 'purchase' | 'creator_bonus' | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: 'purchase' | 'spend' | 'earn' | 'bonus' | 'refund';
          amount: number;
          balance_after: number;
          description: string;
          reference_id?: string | null;
          reference_type?: 'story_read' | 'cache_hit' | 'purchase' | 'creator_bonus' | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: 'purchase' | 'spend' | 'earn' | 'bonus' | 'refund';
          amount?: number;
          balance_after?: number;
          description?: string;
          reference_id?: string | null;
          reference_type?: 'story_read' | 'cache_hit' | 'purchase' | 'creator_bonus' | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          stripe_payment_intent_id: string;
          stripe_customer_id: string;
          package_id: string;
          amount_usd: number;
          credits_purchased: number;
          bonus_credits: number;
          status: 'pending' | 'succeeded' | 'failed' | 'canceled';
          payment_method: string | null;
          failure_reason: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_payment_intent_id: string;
          stripe_customer_id: string;
          package_id: string;
          amount_usd: number;
          credits_purchased: number;
          bonus_credits?: number;
          status?: 'pending' | 'succeeded' | 'failed' | 'canceled';
          payment_method?: string | null;
          failure_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_payment_intent_id?: string;
          stripe_customer_id?: string;
          package_id?: string;
          amount_usd?: number;
          credits_purchased?: number;
          bonus_credits?: number;
          status?: 'pending' | 'succeeded' | 'failed' | 'canceled';
          payment_method?: string | null;
          failure_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Creator Economy Tables
      creator_earnings: {
        Row: {
          id: string;
          creator_id: string;
          story_id: string;
          reader_id: string;
          credits_earned: number;
          usd_equivalent: number;
          transaction_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          story_id: string;
          reader_id: string;
          credits_earned: number;
          usd_equivalent: number;
          transaction_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          story_id?: string;
          reader_id?: string;
          credits_earned?: number;
          usd_equivalent?: number;
          transaction_id?: string;
          created_at?: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          creator_id: string;
          amount_usd: number;
          stripe_transfer_id: string | null;
          status: 'pending' | 'processing' | 'paid' | 'failed';
          period_start: string;
          period_end: string;
          earnings_count: number;
          failure_reason: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          amount_usd: number;
          stripe_transfer_id?: string | null;
          status?: 'pending' | 'processing' | 'paid' | 'failed';
          period_start: string;
          period_end: string;
          earnings_count: number;
          failure_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          amount_usd?: number;
          stripe_transfer_id?: string | null;
          status?: 'pending' | 'processing' | 'paid' | 'failed';
          period_start?: string;
          period_end?: string;
          earnings_count?: number;
          failure_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Content Pricing Tables
      story_pricing: {
        Row: {
          id: string;
          story_id: string;
          creator_id: string;
          price_per_chapter: number;
          bundle_discount: number;
          is_free_sample: boolean;
          free_chapters: number;
          premium_unlock_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          creator_id: string;
          price_per_chapter?: number;
          bundle_discount?: number;
          is_free_sample?: boolean;
          free_chapters?: number;
          premium_unlock_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          creator_id?: string;
          price_per_chapter?: number;
          bundle_discount?: number;
          is_free_sample?: boolean;
          free_chapters?: number;
          premium_unlock_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Reading & Access Tables
      story_purchases: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          creator_id: string;
          purchase_type: 'chapter' | 'bundle' | 'premium_unlock';
          chapters_unlocked: number[];
          credits_spent: number;
          creator_earnings: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_id: string;
          creator_id: string;
          purchase_type: 'chapter' | 'bundle' | 'premium_unlock';
          chapters_unlocked: number[];
          credits_spent: number;
          creator_earnings: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          story_id?: string;
          creator_id?: string;
          purchase_type?: 'chapter' | 'bundle' | 'premium_unlock';
          chapters_unlocked?: number[];
          credits_spent?: number;
          creator_earnings?: number;
          created_at?: string;
        };
      };
      // Library & Reading Progress Tables
      reading_progress: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          chapter_id: string;
          progress_percentage: number;
          last_read_at: string;
          reading_time_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_id: string;
          chapter_id: string;
          progress_percentage?: number;
          last_read_at?: string;
          reading_time_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          story_id?: string;
          chapter_id?: string;
          progress_percentage?: number;
          last_read_at?: string;
          reading_time_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_library: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          added_at: string;
          is_favorite: boolean;
          reading_status: 'want_to_read' | 'reading' | 'completed' | 'dropped';
          personal_rating: number | null;
          personal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_id: string;
          added_at?: string;
          is_favorite?: boolean;
          reading_status?: 'want_to_read' | 'reading' | 'completed' | 'dropped';
          personal_rating?: number | null;
          personal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          story_id?: string;
          added_at?: string;
          is_favorite?: boolean;
          reading_status?: 'want_to_read' | 'reading' | 'completed' | 'dropped';
          personal_rating?: number | null;
          personal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_usage: {
        Row: {
          id: string;
          user_id: string;
          subscription_tier: 'basic' | 'premium';
          credits_used_this_month: number;
          stories_read_this_month: number;
          downloads_this_month: number;
          period_start: string;
          period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_tier: 'basic' | 'premium';
          credits_used_this_month?: number;
          stories_read_this_month?: number;
          downloads_this_month?: number;
          period_start: string;
          period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_tier?: 'basic' | 'premium';
          credits_used_this_month?: number;
          stories_read_this_month?: number;
          downloads_this_month?: number;
          period_start?: string;
          period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Cover Generation Tables
      story_covers: {
        Row: {
          id: string;
          story_id: string;
          cover_url: string;
          cover_style: 'realistic' | 'artistic' | 'fantasy' | 'minimalist' | 'vintage';
          generation_prompt: string;
          is_primary: boolean;
          generation_cost: number;
          sd_model_used: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          cover_url: string;
          cover_style: 'realistic' | 'artistic' | 'fantasy' | 'minimalist' | 'vintage';
          generation_prompt: string;
          is_primary?: boolean;
          generation_cost?: number;
          sd_model_used?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          cover_url?: string;
          cover_style?: 'realistic' | 'artistic' | 'fantasy' | 'minimalist' | 'vintage';
          generation_prompt?: string;
          is_primary?: boolean;
          generation_cost?: number;
          sd_model_used?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cover_generation_queue: {
        Row: {
          id: string;
          story_id: string;
          user_id: string;
          generation_prompt: string;
          cover_style: 'realistic' | 'artistic' | 'fantasy' | 'minimalist' | 'vintage';
          status: 'pending' | 'generating' | 'completed' | 'failed';
          priority: number;
          retry_count: number;
          error_message: string | null;
          webui_task_id: string | null;
          estimated_completion: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          user_id: string;
          generation_prompt: string;
          cover_style: 'realistic' | 'artistic' | 'fantasy' | 'minimalist' | 'vintage';
          status?: 'pending' | 'generating' | 'completed' | 'failed';
          priority?: number;
          retry_count?: number;
          error_message?: string | null;
          webui_task_id?: string | null;
          estimated_completion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          user_id?: string;
          generation_prompt?: string;
          cover_style?: 'realistic' | 'artistic' | 'fantasy' | 'minimalist' | 'vintage';
          status?: 'pending' | 'generating' | 'completed' | 'failed';
          priority?: number;
          retry_count?: number;
          error_message?: string | null;
          webui_task_id?: string | null;
          estimated_completion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // AI Usage Transparency Tables
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          operation_type: 'foundation' | 'character' | 'cover' | 'chapter' | 'improvement';
          tokens_input: number;
          tokens_output: number;
          actual_cost_usd: number;
          charged_amount_usd: number;
          markup_percentage: number;
          ai_model_used: string;
          story_id: string | null;
          chapter_id: string | null;
          generation_time_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          operation_type: 'foundation' | 'character' | 'cover' | 'chapter' | 'improvement';
          tokens_input: number;
          tokens_output: number;
          actual_cost_usd: number;
          charged_amount_usd: number;
          markup_percentage?: number;
          ai_model_used: string;
          story_id?: string | null;
          chapter_id?: string | null;
          generation_time_seconds?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          operation_type?: 'foundation' | 'character' | 'cover' | 'chapter' | 'improvement';
          tokens_input?: number;
          tokens_output?: number;
          actual_cost_usd?: number;
          charged_amount_usd?: number;
          markup_percentage?: number;
          ai_model_used?: string;
          story_id?: string | null;
          chapter_id?: string | null;
          generation_time_seconds?: number;
          created_at?: string;
        };
      };
      // Cache System Tables
      cache_rewards: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          chapter_id: string;
          cache_key: string;
          credits_saved: number;
          original_cost: number;
          discounted_cost: number;
          hit_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_id: string;
          chapter_id: string;
          cache_key: string;
          credits_saved: number;
          original_cost: number;
          discounted_cost: number;
          hit_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          story_id?: string;
          chapter_id?: string;
          cache_key?: string;
          credits_saved?: number;
          original_cost?: number;
          discounted_cost?: number;
          hit_count?: number;
          created_at?: string;
        };
      };
      // Creator Payout System Tables
      creator_earnings_accumulation: {
        Row: {
          id: string;
          creator_id: string;
          total_accumulated_usd: number;
          last_payout_date: string | null;
          last_payout_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          total_accumulated_usd?: number;
          last_payout_date?: string | null;
          last_payout_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          total_accumulated_usd?: number;
          last_payout_date?: string | null;
          last_payout_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      monthly_payout_batches: {
        Row: {
          id: string;
          batch_date: string;
          total_creators_paid: number;
          total_amount_usd: number;
          stripe_batch_id: string | null;
          processing_status: 'pending' | 'processing' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_date: string;
          total_creators_paid?: number;
          total_amount_usd?: number;
          stripe_batch_id?: string | null;
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_date?: string;
          total_creators_paid?: number;
          total_amount_usd?: number;
          stripe_batch_id?: string | null;
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
        };
      };
      individual_payouts: {
        Row: {
          id: string;
          batch_id: string;
          creator_id: string;
          amount_usd: number;
          stripe_transfer_id: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          creator_id: string;
          amount_usd: number;
          stripe_transfer_id?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          creator_id?: string;
          amount_usd?: number;
          stripe_transfer_id?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
        };
      };
      // Subscription Management Tables
      subscription_logs: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          subscription_tier: string | null;
          subscription_status: string | null;
          credits_granted: number | null;
          stripe_session_id: string | null;
          stripe_subscription_id: string | null;
          stripe_invoice_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          subscription_tier?: string | null;
          subscription_status?: string | null;
          credits_granted?: number | null;
          stripe_session_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_invoice_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          subscription_tier?: string | null;
          subscription_status?: string | null;
          credits_granted?: number | null;
          stripe_session_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_invoice_id?: string | null;
          created_at?: string;
        };
      };
      // Character Management Tables
      character_voice_patterns: {
        Row: {
          id: string;
          character_name: string;
          story_id: string;
          speech_patterns: unknown[];
          vocabulary_style: string;
          tonal_characteristics: string;
          dialogue_examples: unknown[];
          consistency_markers: unknown[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          character_name: string;
          story_id: string;
          speech_patterns?: unknown[];
          vocabulary_style?: string;
          tonal_characteristics?: string;
          dialogue_examples?: unknown[];
          consistency_markers?: unknown[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          character_name?: string;
          story_id?: string;
          speech_patterns?: unknown[];
          vocabulary_style?: string;
          tonal_characteristics?: string;
          dialogue_examples?: unknown[];
          consistency_markers?: unknown[];
          created_at?: string;
          updated_at?: string;
        };
      };
      // Caching System Tables
      infinite_pages_cache: {
        Row: {
          id: string;
          content_type: string;
          user_id: string | null;
          content_hash: string;
          cached_content: Record<string, unknown>;
          metadata: Record<string, unknown>;
          hit_count: number;
          token_cost_saved: number;
          last_accessed: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_type: string;
          user_id?: string | null;
          content_hash: string;
          cached_content: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          hit_count?: number;
          token_cost_saved?: number;
          last_accessed?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_type?: string;
          user_id?: string | null;
          content_hash?: string;
          cached_content?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          hit_count?: number;
          token_cost_saved?: number;
          last_accessed?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      // AI Analytics Tables
      claude_analytics: {
        Row: {
          id: string;
          user_id: string | null;
          operation: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          total_tokens: number;
          cost: number;
          response_time: number;
          success: boolean;
          cached: boolean;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          operation: string;
          model: string;
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          cost?: number;
          response_time?: number;
          success?: boolean;
          cached?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          operation?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          cost?: number;
          response_time?: number;
          success?: boolean;
          cached?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      // Choice Books & Reading Analytics Tables
      reader_paths: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          session_id: string;
          choices_made: unknown[];
          current_chapter: string | null;
          path_completion: number;
          session_start: string;
          session_end: string | null;
          ending_reached: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_id: string;
          session_id: string;
          choices_made?: unknown[];
          current_chapter?: string | null;
          path_completion?: number;
          session_start?: string;
          session_end?: string | null;
          ending_reached?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          story_id?: string;
          session_id?: string;
          choices_made?: unknown[];
          current_chapter?: string | null;
          path_completion?: number;
          session_start?: string;
          session_end?: string | null;
          ending_reached?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      choice_analytics: {
        Row: {
          id: string;
          story_id: string;
          choice_point_id: string;
          choice_id: string;
          selection_count: number;
          average_decision_time: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          choice_point_id: string;
          choice_id: string;
          selection_count?: number;
          average_decision_time?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          choice_point_id?: string;
          choice_id?: string;
          selection_count?: number;
          average_decision_time?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Series Management Tables
      series: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          planned_books: number;
          universe_id: string;
          description: string;
          genre: string;
          target_audience: string;
          themes: unknown[];
          current_book_count: number;
          world_rules: Record<string, unknown>;
          character_relationships: unknown[];
          timeline: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          planned_books?: number;
          universe_id: string;
          description?: string;
          genre?: string;
          target_audience?: string;
          themes?: unknown[];
          current_book_count?: number;
          world_rules?: Record<string, unknown>;
          character_relationships?: unknown[];
          timeline?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          planned_books?: number;
          universe_id?: string;
          description?: string;
          genre?: string;
          target_audience?: string;
          themes?: unknown[];
          current_book_count?: number;
          world_rules?: Record<string, unknown>;
          character_relationships?: unknown[];
          timeline?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      series_facts: {
        Row: {
          id: string;
          series_id: string;
          facts_data: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          facts_data: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          facts_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      character_arcs: {
        Row: {
          id: string;
          series_id: string;
          character_name: string;
          overall_arc: string | null;
          current_book_development: Record<string, unknown>;
          personality_evolution: unknown[];
          key_relationships: unknown[];
          current_status: string;
          last_appearance_book: number;
          arc_completion_percentage: number;
          major_turning_points: unknown[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          character_name: string;
          overall_arc?: string | null;
          current_book_development?: Record<string, unknown>;
          personality_evolution?: unknown[];
          key_relationships?: unknown[];
          current_status?: string;
          last_appearance_book?: number;
          arc_completion_percentage?: number;
          major_turning_points?: unknown[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          character_name?: string;
          overall_arc?: string | null;
          current_book_development?: Record<string, unknown>;
          personality_evolution?: unknown[];
          key_relationships?: unknown[];
          current_status?: string;
          last_appearance_book?: number;
          arc_completion_percentage?: number;
          major_turning_points?: unknown[];
          created_at?: string;
          updated_at?: string;
        };
      };
      world_state_changes: {
        Row: {
          id: string;
          series_id: string;
          book_number: number;
          chapter_number: number | null;
          change_type: string;
          description: string;
          scope: string;
          consequences: unknown[];
          affects_future_books: boolean;
          reversible: boolean;
          caused_by: string | null;
          duration: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          book_number: number;
          chapter_number?: number | null;
          change_type: string;
          description: string;
          scope?: string;
          consequences?: unknown[];
          affects_future_books?: boolean;
          reversible?: boolean;
          caused_by?: string | null;
          duration?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          book_number?: number;
          chapter_number?: number | null;
          change_type?: string;
          description?: string;
          scope?: string;
          consequences?: unknown[];
          affects_future_books?: boolean;
          reversible?: boolean;
          caused_by?: string | null;
          duration?: string;
          created_at?: string;
        };
      };
      plot_threads: {
        Row: {
          id: string;
          series_id: string;
          name: string;
          description: string | null;
          introduced_book: number;
          current_status: string;
          priority: string;
          expected_resolution_book: number | null;
          characters_involved: unknown[];
          complexity: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          name: string;
          description?: string | null;
          introduced_book: number;
          current_status?: string;
          priority?: string;
          expected_resolution_book?: number | null;
          characters_involved?: unknown[];
          complexity?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          name?: string;
          description?: string | null;
          introduced_book?: number;
          current_status?: string;
          priority?: string;
          expected_resolution_book?: number | null;
          characters_involved?: unknown[];
          complexity?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      foreshadowing_elements: {
        Row: {
          id: string;
          series_id: string;
          element: string;
          introduced_book: number;
          introduced_chapter: number | null;
          payoff_book: number | null;
          payoff_chapter: number | null;
          subtlety_level: string;
          importance: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          element: string;
          introduced_book: number;
          introduced_chapter?: number | null;
          payoff_book?: number | null;
          payoff_chapter?: number | null;
          subtlety_level?: string;
          importance?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          element?: string;
          introduced_book?: number;
          introduced_chapter?: number | null;
          payoff_book?: number | null;
          payoff_chapter?: number | null;
          subtlety_level?: string;
          importance?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Error Monitoring Tables
      error_reports: {
        Row: {
          id: string;
          message: string;
          stack: string | null;
          category: string;
          severity: string;
          source: string;
          url: string | null;
          user_agent: string | null;
          user_id: string | null;
          session_id: string | null;
          component: string | null;
          operation: string | null;
          api_endpoint: string | null;
          status_code: number | null;
          response_time: number | null;
          memory_usage: number | null;
          custom_data: Record<string, unknown> | null;
          fingerprint: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          stack?: string | null;
          category: string;
          severity: string;
          source: string;
          url?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          component?: string | null;
          operation?: string | null;
          api_endpoint?: string | null;
          status_code?: number | null;
          response_time?: number | null;
          memory_usage?: number | null;
          custom_data?: Record<string, unknown> | null;
          fingerprint?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          stack?: string | null;
          category?: string;
          severity?: string;
          source?: string;
          url?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          component?: string | null;
          operation?: string | null;
          api_endpoint?: string | null;
          status_code?: number | null;
          response_time?: number | null;
          memory_usage?: number | null;
          custom_data?: Record<string, unknown> | null;
          fingerprint?: string | null;
          created_at?: string;
        };
      };
    };
  };
}