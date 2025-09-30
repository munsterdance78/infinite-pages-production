/**
 * Environment Variables - Exact match with Vercel configuration
 * These are the exact variable names used in your Vercel deployment
 */

export interface EnvironmentVariables {
  // STRIPE INTEGRATION
  STRIPE_CONNECT_CLIENT_ID: string
  STRIPE_SECRET_KEY: string
  STRIPE_PRICE_ID: string
  STRIPE_WEBHOOK_SECRET: string
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string

  // SUPABASE DATABASE & AUTH
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SUPABASE_ANON_KEY: string
  SUPABASE_URL: string

  // ANTHROPIC AI
  ANTHROPIC_API_KEY: string

  // SITE CONFIGURATION
  NEXT_PUBLIC_SITE_URL: string

  // SYSTEM
  NODE_ENV: 'development' | 'production' | 'test'
}

/**
 * Runtime environment validation
 * Ensures all required variables are present
 */
export function validateEnvironment(): EnvironmentVariables {
  const required = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ] as const

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return process.env as unknown as EnvironmentVariables
}

/**
 * Type-safe environment access
 */
export const env = {
  // Supabase - Use consistent URL variable
  SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'] || process.env['SUPABASE_URL']!,
  SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env['SUPABASE_ANON_KEY']!,
  SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY']!,

  // Stripe
  STRIPE_SECRET_KEY: process.env['STRIPE_SECRET_KEY']!,
  STRIPE_PRICE_ID: process.env['STRIPE_PRICE_ID']!,
  STRIPE_WEBHOOK_SECRET: process.env['STRIPE_WEBHOOK_SECRET']!,
  STRIPE_CONNECT_CLIENT_ID: process.env['STRIPE_CONNECT_CLIENT_ID']!,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']!,
  STRIPE_BASIC_MONTHLY_PRICE_ID: process.env['STRIPE_BASIC_MONTHLY_PRICE_ID'] || process.env['STRIPE_PRICE_ID']!,
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: process.env['STRIPE_PREMIUM_MONTHLY_PRICE_ID'] || process.env['STRIPE_PRICE_ID']!,
  STRIPE_BASIC_YEARLY_PRICE_ID: process.env['STRIPE_BASIC_YEARLY_PRICE_ID'] || process.env['STRIPE_PRICE_ID']!,
  STRIPE_PREMIUM_YEARLY_PRICE_ID: process.env['STRIPE_PREMIUM_YEARLY_PRICE_ID'] || process.env['STRIPE_PRICE_ID']!,

  // Anthropic
  ANTHROPIC_API_KEY: process.env['ANTHROPIC_API_KEY']!,

  // Site
  SITE_URL: process.env['NEXT_PUBLIC_SITE_URL']!,

  // System
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development'
} as const