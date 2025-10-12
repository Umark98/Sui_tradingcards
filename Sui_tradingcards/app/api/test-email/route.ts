// Test email API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail, sendWelcomeEmail, sendCollectionConfirmationEmail } from '@/utils/emailUtils';

export async function POST(request: NextRequest) {
  try {
    const { email, type, customMessage, data } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'test':
        result = await sendTestEmail(email, customMessage);
        break;

      case 'welcome':
        const walletAddress = data?.walletAddress || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        result = await sendWelcomeEmail(email, walletAddress, customMessage);
        break;

      case 'collection':
        const nftTitle = data?.nftTitle || 'Test NFT';
        const txDigest = data?.transactionDigest || '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        result = await sendCollectionConfirmationEmail(email, nftTitle, txDigest, customMessage);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use: test, welcome, or collection' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email sent successfully to ${email}`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check email configuration
export async function GET() {
  return NextResponse.json({
    configured: !!(
      process.env.AMAZON_SES_HOST &&
      process.env.AMAZON_SES_USER &&
      process.env.AMAZON_SES_PASS
    ),
  });
}

