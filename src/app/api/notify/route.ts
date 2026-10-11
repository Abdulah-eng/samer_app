import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, customerCode, customerLabel, timestamp, hasImage } = body;

    const email = 'samermastouri21@gmail.com';

    const payload: Record<string, string> = {
      _subject: `🔔 New Live Chat Message${hasImage ? ' [📸 Image]' : ''}: ${customerCode || customerLabel || 'Customer'}`,
      _template: 'box',
      _captcha: 'false',
      'Redeem Code / Order': customerCode || 'N/A',
      'Customer Label': customerLabel || 'Customer',
      'Message': message || (hasImage ? '[Screenshot / Image Attached]' : ''),
      'Screenshot Attached': hasImage ? 'Yes (Open Admin Chat to view image)' : 'No',
      'Time': timestamp || new Date().toLocaleString(),
    };

    const res = await fetch(`https://formsubmit.co/ajax/${email}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: 'https://imostrada.com',
        Referer: 'https://imostrada.com/',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Email notification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
