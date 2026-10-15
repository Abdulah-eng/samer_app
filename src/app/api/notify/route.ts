import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type,
      action,
      message,
      customerCode,
      customerLabel,
      code,
      productName,
      orderNumber,
      platform,
      accountEmail,
      accountPassword,
      notes,
      deliveryType,
      timestamp,
      hasImage,
    } = body;

    const recipients = ['samermastouri21@gmail.com', 'mabdulaharshad@gmail.com'];
    let payload: Record<string, string> = {};

    const uniqueTag = Math.floor(1000 + Math.random() * 9000);

    if (type === 'topup' || action === 'topup_submitted') {
      payload = {
        _subject: `⚡ [TOP-UP #${uniqueTag}] Order #${orderNumber || 'N/A'} - ${productName || 'Top Up'}`,
        _template: 'box',
        _captcha: 'false',
        'Event': '⚡ Customer Submitted Top-Up Details',
        'Product': productName || 'Top-Up Service',
        'Redeem Code': code || 'N/A',
        'Store / Platform Order Number': orderNumber || 'N/A',
        'Platform Purchased From': platform || 'N/A',
        'Account Email': accountEmail || 'N/A',
        'Account Password': accountPassword || 'N/A',
        'Customer Notes': notes || 'None',
        'Reference ID': `#${uniqueTag}`,
        'Submitted At': timestamp || new Date().toLocaleString(),
      };
    } else if (type === 'redeem' || action === 'code_redeemed') {
      payload = {
        _subject: `🎁 [REDEEM #${uniqueTag}] ${code} - ${productName || 'Product'}`,
        _template: 'box',
        _captcha: 'false',
        'Event': '🎁 New Code Redeemed by Customer',
        'Redeem Code': code || 'N/A',
        'Product': productName || 'Digital Product',
        'Order Number': orderNumber || 'N/A',
        'Delivery Workflow': (deliveryType || 'account').toUpperCase(),
        'Status': 'Processing',
        'Reference ID': `#${uniqueTag}`,
        'Redeemed At': timestamp || new Date().toLocaleString(),
      };
    } else if (type === 'test' || action === 'test') {
      payload = {
        _subject: `🔔 [IMOSTRADA TEST #${uniqueTag}] Notification System is ACTIVE`,
        _template: 'box',
        _captcha: 'false',
        'Event': 'Notification System Test',
        'Status': 'ACTIVE & FUNCTIONAL',
        'Notification Targets': recipients.join(', '),
        'Reference ID': `#${uniqueTag}`,
        'Timestamp': timestamp || new Date().toLocaleString(),
      };
    } else {
      // Default: Live Chat Customer Message
      const identifier = customerCode || customerLabel || 'Customer';
      const snippet = (message || (hasImage ? '[Attached Photo]' : 'New customer message')).slice(0, 35);
      payload = {
        _subject: `💬 [LIVE CHAT #${uniqueTag}] ${identifier}: "${snippet}"`,
        _template: 'box',
        _captcha: 'false',
        'Event': '💬 Live Chat Customer Message',
        'Redeem Code / Order': customerCode || 'N/A',
        'Customer Identifier': customerLabel || 'Customer',
        'Message Text': message || (hasImage ? '[Screenshot / Image Attached]' : ''),
        'Photo Attached': hasImage ? 'Yes (Open Admin Chat to view image)' : 'No',
        'Message Reference': `#${uniqueTag}`,
        'Sent At': timestamp || new Date().toLocaleString(),
      };
    }

    const responses = await Promise.all(
      recipients.map(async (targetEmail) => {
        try {
          const res = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Origin: 'https://imostrada.shop',
              Referer: 'https://imostrada.shop/',
            },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          return { targetEmail, status: res.status, data };
        } catch (err: any) {
          return { targetEmail, error: err.message };
        }
      })
    );

    console.log('[NOTIFY Route Responses]:', JSON.stringify(responses));
    return NextResponse.json({ success: true, formSubmitResponses: responses });
  } catch (error: any) {
    console.error('Email notification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
