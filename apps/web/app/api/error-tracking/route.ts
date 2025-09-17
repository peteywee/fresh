import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the error with timestamp and request details
    const errorData = {
      timestamp: new Date().toISOString(),
      url: body.url || 'unknown',
      message: body.message || 'No message',
      stack: body.stack || 'No stack trace',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referrer: request.headers.get('referer') || 'unknown',
      ...body,
    };

    console.error('CLIENT ERROR REPORT:', JSON.stringify(errorData, null, 2));

    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, etc.

    return NextResponse.json(
      {
        success: true,
        message: 'Error logged successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to log client error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to log error',
      },
      { status: 500 }
    );
  }
}
