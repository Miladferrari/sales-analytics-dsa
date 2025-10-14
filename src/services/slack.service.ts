import axios from 'axios'
import { NotificationPayload } from '@/types'

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export async function sendSlackNotification(
  payload: NotificationPayload
): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('Slack webhook URL not configured')
    return
  }

  let blocks: any[] = []

  switch (payload.type) {
    case 'poor_call_alert':
      blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Poor Call Alert',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sales Rep:*\n${payload.data.repName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Score:*\n${payload.data.score}/100`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.data.summary || 'Review needed',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Call Details',
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/calls/${payload.data.callId}`,
            },
          ],
        },
      ]
      break

    case 'excellent_call_alert':
      blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎉 Excellent Call!',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sales Rep:*\n${payload.data.repName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Score:*\n${payload.data.score}/100`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.data.summary || 'Great job!',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Call Details',
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/calls/${payload.data.callId}`,
            },
          ],
        },
      ]
      break

    case 'daily_summary':
      blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Daily Sales Summary',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Calls:*\n${payload.data.stats?.callsToday || 0}`,
            },
            {
              type: 'mrkdwn',
              text: `*Excellent Calls:*\n${payload.data.stats?.excellentCalls || 0}`,
            },
            {
              type: 'mrkdwn',
              text: `*Poor Calls:*\n${payload.data.stats?.poorCalls || 0}`,
            },
            {
              type: 'mrkdwn',
              text: `*Average Score:*\n${payload.data.stats?.averageScore?.toFixed(1) || 0}/100`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Dashboard',
              },
              url: process.env.NEXT_PUBLIC_APP_URL,
            },
          ],
        },
      ]
      break
  }

  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      blocks,
    })
  } catch (error) {
    console.error('Error sending Slack notification:', error)
    throw new Error(
      `Failed to send Slack notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
