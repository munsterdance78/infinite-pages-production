import type { createClient } from '@/lib/database/supabase'
import type { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export type SupabaseClient = ReturnType<typeof createClient>

export interface AuthenticatedUser {
  id: string
  email?: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
}

export interface AuthenticatedRequest {
  user: AuthenticatedUser
  supabase: SupabaseClient
}

export interface AuthError {
  error: string
  status: number
}

export type AuthResult = AuthenticatedRequest | NextResponse