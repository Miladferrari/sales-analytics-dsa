import axios from 'axios'
import { NotificationPayload } from '@/types'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function sendTelegramNotification(
  payload: NotificationPayload
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured')
    return
  }

  let message = ''

  switch (payload.type) {
    case 'poor_call_alert':
      message = `🚨 *Poor Call Alert*\n\n` +
        `Sales Rep: *${payload.data.repName}*\n` +
        `Score: *${payload.data.score}/100*\n` +
        `Call ID: \`${payload.data.callId}\`\n\n` +
        `${payload.data.summary || 'Review needed'}\n\n` +
        `View details: ${process.env.NEXT_PUBLIC_APP_URL}/calls/${payload.data.callId}`
      break

    case 'excellent_call_alert':
      message = `🎉 *Excellent Call!*\n\n` +
        `Sales Rep: *${payload.data.repName}*\n` +
        `Score: *${payload.data.score}/100*\n` +
        `Call ID: \`${payload.data.callId}\`\n\n` +
        `${payload.data.summary || 'Great job!'}\n\n` +
        `View details: ${process.env.NEXT_PUBLIC_APP_URL}/calls/${payload.data.callId}`
      break

    case 'daily_summary':
      message = `📊 *Daily Sales Summary*\n\n` +
        `Total Calls Today: *${payload.data.stats?.callsToday || 0}*\n` +
        `Excellent Calls: *${payload.data.stats?.excellentCalls || 0}*\n` +
        `Poor Calls: *${payload.data.stats?.poorCalls || 0}*\n` +
        `Average Score: *${payload.data.stats?.averageScore?.toFixed(1) || 0}/100*\n\n` +
        `View dashboard: ${process.env.NEXT_PUBLIC_APP_URL}`
      break
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }
    )
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    throw new Error(
      `Failed to send Telegram notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
