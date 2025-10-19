/**
 * Retry helper with exponential backoff for Fathom API calls
 * Handles rate limiting (429) and temporary errors
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a fetch request with exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = { ...DEFAULT_OPTIONS, ...retryOptions }
  let lastError: Error | null = null
  let delay = config.initialDelay

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If rate limited (429), retry with backoff
      if (response.status === 429) {
        if (attempt < config.maxRetries) {
          console.warn(`⚠️ Rate limited (429), retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries})`)
          await sleep(delay)
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
          continue
        }
        throw new Error(`Rate limit exceeded after ${config.maxRetries} retries`)
      }

      // If server error (5xx), retry
      if (response.status >= 500 && response.status < 600) {
        if (attempt < config.maxRetries) {
          console.warn(`⚠️ Server error (${response.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries})`)
          await sleep(delay)
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
          continue
        }
        throw new Error(`Server error ${response.status} after ${config.maxRetries} retries`)
      }

      // Success or client error (don't retry 4xx except 429)
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < config.maxRetries) {
        console.warn(`⚠️ Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries})`)
        await sleep(delay)
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}

/**
 * Add delay between API calls to prevent rate limiting
 */
export async function rateLimitDelay(ms: number = 200): Promise<void> {
  await sleep(ms)
}
