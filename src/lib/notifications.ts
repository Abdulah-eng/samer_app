/**
 * Unified Email Notification Dispatcher
 * Sends instant notifications to both mabdulaharshad@gmail.com and samermastouri21@gmail.com
 * Executes directly from client-side with keepalive to avoid Vercel serverless IP blocks.
 */

export const NOTIFICATION_RECIPIENTS = [
  'mabdulaharshad@gmail.com',
  'samermastouri21@gmail.com',
];

export interface NotificationData {
  type: 'chat' | 'redeem' | 'topup' | 'test';
  action?: string;
  message?: string;
  hasImage?: boolean;
  customerCode?: string;
  customerLabel?: string;
  code?: string;
  productName?: string;
  orderNumber?: string;
  platform?: string;
  accountEmail?: string;
  accountPassword?: string;
  notes?: string;
  deliveryType?: string;
  timestamp?: string;
}

export async function dispatchNotificationEmail(data: NotificationData): Promise<void> {
  if (typeof window === 'undefined') return;

  const tag = Math.floor(1000 + Math.random() * 9000);
  const time = data.timestamp || new Date().toLocaleString();
  let formPayload: Record<string, string> = {};

  if (data.type === 'topup' || data.action === 'topup_submitted') {
    formPayload = {
      _subject: `⚡ [TOP-UP #${tag}] Order #${data.orderNumber || 'N/A'} - ${data.productName || 'Top Up'}`,
      _template: 'box',
      _captcha: 'false',
      'Event': '⚡ Customer Submitted Top-Up Details',
      'Product': data.productName || 'Top-Up Service',
      'Redeem Code': data.code || 'N/A',
      'Store / Platform Order Number': data.orderNumber || 'N/A',
      'Platform Purchased From': data.platform || 'N/A',
      'Account Email': data.accountEmail || 'N/A',
      'Account Password': data.accountPassword || 'N/A',
      'Customer Notes': data.notes || 'None',
      'Reference ID': `#${tag}`,
      'Submitted At': time,
    };
  } else if (data.type === 'redeem' || data.action === 'code_redeemed') {
    formPayload = {
      _subject: `🎁 [REDEEM #${tag}] ${data.code || 'Code'} - ${data.productName || 'Product'}`,
      _template: 'box',
      _captcha: 'false',
      'Event': '🎁 New Code Redeemed by Customer',
      'Redeem Code': data.code || 'N/A',
      'Product': data.productName || 'Digital Product',
      'Order Number': data.orderNumber || 'N/A',
      'Delivery Workflow': (data.deliveryType || 'account').toUpperCase(),
      'Status': 'Processing',
      'Reference ID': `#${tag}`,
      'Redeemed At': time,
    };
  } else if (data.type === 'test' || data.action === 'test') {
    formPayload = {
      _subject: `🔔 [IMOSTRADA TEST #${tag}] Notification System is ACTIVE`,
      _template: 'box',
      _captcha: 'false',
      'Event': 'Notification System Test',
      'Status': 'ACTIVE & FUNCTIONAL',
      'Recipients': NOTIFICATION_RECIPIENTS.join(', '),
      'Reference ID': `#${tag}`,
      'Timestamp': time,
    };
  } else {
    // Default: Live Chat Customer Message
    const identifier = data.customerCode || data.customerLabel || 'Customer';
    const snippet = (data.message || (data.hasImage ? '[Attached Photo]' : 'New customer message')).slice(0, 35);
    formPayload = {
      _subject: `💬 [LIVE CHAT #${tag}] ${identifier}: "${snippet}"`,
      _template: 'box',
      _captcha: 'false',
      'Event': '💬 Live Chat Customer Message',
      'Customer': data.customerLabel || 'Customer',
      'Redeem Code / Order': data.customerCode || 'N/A',
      'Message Text': data.message || (data.hasImage ? '[Screenshot / Image Attached]' : ''),
      'Photo Attached': data.hasImage ? 'Yes (Open Admin Chat to view image)' : 'No',
      'Reference ID': `#${tag}`,
      'Sent At': time,
    };
  }

  // 1. Direct browser-side FormSubmit AJAX with keepalive to both recipients
  for (const email of NOTIFICATION_RECIPIENTS) {
    try {
      fetch(`https://formsubmit.co/ajax/${email}`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formPayload),
      }).catch((err) => {
        console.warn(`[Direct FormSubmit warning for ${email}]:`, err);
      });
    } catch {
      // non-blocking
    }
  }

  // 2. Also ping server /api/notify as redundant channel
  try {
    fetch('/api/notify', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch {
    // non-blocking
  }
}
