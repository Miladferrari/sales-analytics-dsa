/**
 * System Configuration Management
 *
 * Centralized access to system-wide settings stored in database.
 * Falls back to environment variables if database is empty.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Simple in-memory cache (30 second TTL for real-time updates)
let configCache: FathomConfig | null = null
let cacheTime = 0
const CACHE_TTL = 30 * 1000 // 30 seconds (reduced for better real-time sync)

export interface FathomConfig {
  apiKey: string | null
  webhookSecret: string | null
  connectionStatus?: string
  lastTested?: string | null
}

/**
 * Get Fathom API configuration from database
 * Falls back to environment variables if not configured in DB
 */
export async function getFathomConfig(): Promise<FathomConfig> {
  // Check cache first
  const now = Date.now()
  if (configCache && (now - cacheTime) < CACHE_TTL) {
    return configCache
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Fetch from database
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'fathom_api_key',
        'fathom_webhook_secret',
        'fathom_connection_status',
        'fathom_last_test'
      ])

    if (error) {
      console.error('Error fetching system settings:', error)
      return getFallbackConfig()
    }

    // Parse settings
    const settings = (data || []).reduce((acc, item) => {
      acc[item.setting_key] = item.setting_value
      return acc
    }, {} as Record<string, string | null>)

    const config: FathomConfig = {
      apiKey: settings.fathom_api_key || process.env.FATHOM_API_KEY || null,
      webhookSecret: settings.fathom_webhook_secret || process.env.FATHOM_WEBHOOK_SECRET || null,
      connectionStatus: settings.fathom_connection_status || 'not_configured',
      lastTested: settings.fathom_last_test || null
    }

    // Cache the result
    configCache = config
    cacheTime = now

    return config
  } catch (error) {
    console.error('Exception in getFathomConfig:', error)
    return getFallbackConfig()
  }
}

/**
 * Fallback to environment variables
 */
function getFallbackConfig(): FathomConfig {
  return {
    apiKey: process.env.FATHOM_API_KEY || null,
    webhookSecret: process.env.FATHOM_WEBHOOK_SECRET || null,
    connectionStatus: 'not_configured',
    lastTested: null
  }
}

/**
 * Update Fathom configuration in database
 */
export async function updateFathomConfig(config: {
  apiKey?: string
  webhookSecret?: string
  userId?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const updates = []

    if (config.apiKey !== undefined) {
      updates.push({
        setting_key: 'fathom_api_key',
        setting_value: config.apiKey,
        updated_at: new Date().toISOString(),
        updated_by: config.userId || null
      })
    }

    if (config.webhookSecret !== undefined) {
      updates.push({
        setting_key: 'fathom_webhook_secret',
        setting_value: config.webhookSecret,
        updated_at: new Date().toISOString(),
        updated_by: config.userId || null
      })
    }

    // Update each setting
    for (const update of updates) {
      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: update.setting_value,
          updated_at: update.updated_at,
          updated_by: update.updated_by
        })
        .eq('setting_key', update.setting_key)

      if (error) {
        console.error(`Error updating ${update.setting_key}:`, error)
        return { success: false, error: error.message }
      }
    }

    // Clear cache
    configCache = null
    cacheTime = 0

    return { success: true }
  } catch (error: any) {
    console.error('Exception in updateFathomConfig:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update connection status after test
 */
export async function updateFathomConnectionStatus(
  status: 'connected' | 'disconnected' | 'error',
  userId?: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  await supabase
    .from('system_settings')
    .update({
      setting_value: status,
      updated_at: new Date().toISOString(),
      updated_by: userId || null
    })
    .eq('setting_key', 'fathom_connection_status')

  await supabase
    .from('system_settings')
    .update({
      setting_value: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: userId || null
    })
    .eq('setting_key', 'fathom_last_test')

  // Clear cache
  configCache = null
  cacheTime = 0
}

/**
 * Clear config cache (useful after updates)
 */
export function clearConfigCache() {
  configCache = null
  cacheTime = 0
}

/**
 * Create a Fathom API client using database configuration
 * This ensures the client always uses the latest config from the database
 */
export async function createFathomClientFromDB() {
  const { createFathomClient } = await import('@/lib/fathom/api-client')

  // Get API key from database
  const config = await getFathomConfig()

  if (!config.apiKey) {
    throw new Error('Fathom API Key not configured in database. Please configure it in Settings → Fathom Koppeling.')
  }

  // Create and return client with database API key
  return createFathomClient(config.apiKey)
}
