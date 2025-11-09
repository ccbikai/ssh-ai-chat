import { joinURL } from 'ufo'
import env from '@/config/env'
import logger from '@/utils/logger'

interface TrackParams {
  path?: string
  event?: string
  locale?: string
  username?: string
  columns?: number
  rows?: number
  ip?: string
}

interface TrackData {
  [key: string]: any
}

export async function track(params: TrackParams, data?: TrackData): Promise<Response | void> {
  if (!env.UMAMI_HOST || !env.UMAMI_SITE_ID) {
    env.SSH_SERVER_MODE && logger.info({ ip: params.ip, username: params.username, params, data }, 'UMAMI_HOST and UMAMI_SITE_ID is not set')
    return
  }

  try {
    const body = JSON.stringify({
      type: 'event',
      payload: {
        hostname: env.SERVER_NAME,
        language: params.locale?.replaceAll('_', '-'),
        referrer: `https://${params.username}.github.io`,
        screen: `${params.columns ?? 0}x${params.rows ?? 0}`,
        url: params.path,
        website: env.UMAMI_SITE_ID,
        name: params.event,
        ip: params.ip,
        data,
      },
    })

    logger.debug({ ip: params.ip, username: params.username, body }, 'send track info to umami')
    const response = await fetch(joinURL(env.UMAMI_HOST, '/api/send'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', // Mock User-Agent
      },
      body,
    })
    // logger.debug({ ip: params.ip, username: params.username, result: await response.text() }, 'receive response from umami')
    return response
  }
  catch (error) {
    console.error('Failed to track event', error)
  }
}
