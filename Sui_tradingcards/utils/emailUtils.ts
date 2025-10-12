// Email utility using Amazon SES SMTP
import nodemailer from 'nodemailer';

// Create transporter with Amazon SES SMTP
const transporter = nodemailer.createTransport({
  host: process.env.AMAZON_SES_HOST,
  port: parseInt(process.env.AMAZON_SES_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.AMAZON_SES_USER,
    pass: process.env.AMAZON_SES_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send email via Amazon SES
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Send email
    const info = await transporter.sendMail({
      from: process.env.GAMISODES_FROM || 'noreply@gamisodes.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });

    console.log('✅ Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, walletAddress: string, customMessage?: string): Promise<{ success: boolean; error?: string }> {
  const subject = '🎴 Welcome to NFT Collection Portal!';
  
  // Convert line breaks to HTML <br> tags for HTML version
  const customMessageHtml = customMessage ? customMessage.replace(/\n/g, '<br>') : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .wallet-box {
          background: white;
          border: 2px solid #667eea;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-family: monospace;
          word-break: break-all;
        }
        .custom-message {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎴 Welcome to NFT Collection Portal!</h1>
      </div>
      <div class="content">
        ${customMessage && customMessage.trim() ? `<div class="custom-message"><strong>📝 Message from Gamisodes:</strong><br><br>${customMessageHtml}</div>` : ''}
        
        <h2>Your Account is Ready!</h2>
        <p>Hello,</p>
        <p>Your NFT Collection Portal account has been successfully created. We've generated a custodial wallet for you to collect your pre-assigned NFTs.</p>
        
        <h3>Your Custodial Wallet Address:</h3>
        <div class="wallet-box">
          ${walletAddress}
        </div>
        
        <p><strong>What's next?</strong></p>
        <ul>
          <li>✅ Log in to the portal with your email</li>
          <li>🎴 View your reserved NFTs</li>
          <li>🚀 Click "Collect" to mint them to your wallet</li>
          <li>🌟 Enjoy your digital collectibles!</li>
        </ul>
        
        <center>
          <a href="http://localhost:3000/portal" class="button">Access Portal →</a>
        </center>
        
        <p><strong>Important:</strong> Your wallet and private keys are securely stored and encrypted. You don't need to manage any keys manually.</p>
      </div>
      <div class="footer">
        <p>© 2025 Gamisodes | NFT Collection Portal</p>
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to NFT Collection Portal!

${customMessage && customMessage.trim() ? `📝 MESSAGE FROM GAMISODES:\n${customMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` : ''}Your account has been successfully created.

Your Custodial Wallet Address:
${walletAddress}

What's next?
- Log in to the portal with your email
- View your reserved NFTs
- Click "Collect" to mint them to your wallet
- Enjoy your digital collectibles!

Access Portal: http://localhost:3000/portal

© 2025 Gamisodes | NFT Collection Portal
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

/**
 * Send NFT collection confirmation email
 */
export async function sendCollectionConfirmationEmail(
  email: string,
  nftTitle: string,
  transactionDigest: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const subject = `🎉 You've collected: ${nftTitle}`;
  
  // Convert line breaks to HTML <br> tags for HTML version
  const customMessageHtml = customMessage ? customMessage.replace(/\n/g, '<br>') : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .nft-box {
          background: white;
          border: 2px solid #10b981;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
        .custom-message {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          font-size: 16px;
        }
        .tx-hash {
          background: #f0f0f0;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
          margin: 15px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 5px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 NFT Collected Successfully!</h1>
      </div>
      <div class="content">
        ${customMessage && customMessage.trim() ? `<div class="custom-message"><strong>📝 Message from Gamisodes:</strong><br><br>${customMessageHtml}</div>` : ''}
        
        <div class="nft-box">
          <h2>🎴 ${nftTitle}</h2>
          <p>This NFT has been minted to your wallet!</p>
        </div>
        
        <h3>Transaction Details:</h3>
        <div class="tx-hash">
          ${transactionDigest}
        </div>
        
        <p><strong>What you can do now:</strong></p>
        <ul>
          <li>✅ View your NFT in the portal</li>
          <li>🔍 Check the transaction on Sui Explorer</li>
          <li>🎴 Collect more NFTs from your collection</li>
          <li>💎 Show off your digital collectibles!</li>
        </ul>
        
        <center>
          <a href="http://localhost:3000/portal" class="button">View Portal</a>
          <a href="https://suiexplorer.com/txblock/${transactionDigest}?network=testnet" class="button">View on Explorer</a>
        </center>
        
        <p><em>Congratulations on growing your collection!</em></p>
      </div>
      <div class="footer">
        <p>© 2025 Gamisodes | NFT Collection Portal</p>
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
🎉 NFT Collected Successfully!

${customMessage && customMessage.trim() ? `📝 MESSAGE FROM GAMISODES:\n${customMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` : ''}NFT: ${nftTitle}

This NFT has been minted to your wallet!

Transaction: ${transactionDigest}

View on Explorer: https://suiexplorer.com/txblock/${transactionDigest}?network=testnet
Access Portal: http://localhost:3000/portal

© 2025 Gamisodes | NFT Collection Portal
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

/**
 * Send test email
 */
export async function sendTestEmail(email: string, customMessage?: string): Promise<{ success: boolean; error?: string }> {
  const subject = 'Important Message from Gamisodes';
  
  // Convert line breaks to HTML <br> tags for HTML version
  const customMessageHtml = customMessage ? customMessage.replace(/\n/g, '<br>') : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .custom-message {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
          font-size: 16px;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Gamisodes</h1>
      </div>
      <div class="content">
        ${customMessage && customMessage.trim() ? `<div class="custom-message">${customMessageHtml}</div>` : ''}
        
        <p>Thank you for being part of the Gamisodes community.</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
        
        <p>Best regards,<br>The Gamisodes Team</p>
      </div>
      <div class="footer">
        <p>© 2025 Gamisodes | NFT Collection Portal</p>
        <p>This email was sent to ${email}</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Gamisodes

${customMessage && customMessage.trim() ? `${customMessage}\n\n` : ''}Thank you for being part of the Gamisodes community.

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Best regards,
The Gamisodes Team

© 2025 Gamisodes | NFT Collection Portal
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

