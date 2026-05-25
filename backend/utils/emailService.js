const nodemailer = require('nodemailer');
const path = require('path');
const { PassThrough } = require('stream');
const { generateReceiptPDF } = require('./pdfGenerator');
require('dotenv').config({ path: path.join(__dirname, '../.env') });


// Create a pooled transporter for high-speed delivery
const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email Service Configuration Error:', error);
  } else {
    console.log('✅ Email Service is ready (Pooled Connection Enabled)');
  }
});

const headerStyle = `background:#111827;padding:48px;text-align:center;`;
const bodyStyle = `padding:48px;`;
const tableStyle = `background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 10px 25px rgba(0,0,0,0.05);`;
const wrapperStyle = `margin:0;padding:0;background-color:#F9FAFB;font-family:'Inter',sans-serif;`;

const emailBase = (headerHtml, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
</head>
<body style="${wrapperStyle}">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:60px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="${tableStyle}">
        <tr>
          <td style="${headerStyle}">${headerHtml}</td>
        </tr>
        <tr>
          <td style="${bodyStyle}">${bodyHtml}</td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, name) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') return;
  const firstName = name.split(' ')[0];
  try {
    await transporter.sendMail({
      from: `"FixHub Premium" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to FixHub - Your Premium Service Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:24px 16px;background-color:#F8FAFC;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;">
          <table width="100%" cellpadding="0" cellspacing="0" align="center" style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 20px -5px rgba(0,0,0,0.06);">
            <tr>
              <td style="background-color:#0F172A;padding:32px 24px;text-align:center;">
                <h1 style="color:#FFFFFF;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Welcome to FixHub</h1>
                <p style="color:#94A3B8;margin:6px 0 0;font-size:14px;font-weight:500;">Premium Professional Services</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px;">
                <p style="margin:0 0 12px;font-size:16px;color:#1E293B;font-weight:700;">Hello ${firstName},</p>
                <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                  Your account has been successfully activated. We're thrilled to have you join FixHub, where finding top-tier professionals is seamless and completely secure.
                </p>

                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:12px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="36" valign="top">
                        <div style="background:#0F172A;color:#FFFFFF;width:24px;height:24px;text-align:center;line-height:24px;border-radius:6px;font-size:12px;font-weight:700;">1</div>
                      </td>
                      <td>
                        <h3 style="margin:0 0 4px;font-size:14px;color:#0F172A;font-weight:700;">Verified Experts</h3>
                        <p style="margin:0;font-size:13px;color:#64748B;line-height:1.4;">Access professionals who have passed strict quality checks.</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="36" valign="top">
                        <div style="background:#0F172A;color:#FFFFFF;width:24px;height:24px;text-align:center;line-height:24px;border-radius:6px;font-size:12px;font-weight:700;">2</div>
                      </td>
                      <td>
                        <h3 style="margin:0 0 4px;font-size:14px;color:#0F172A;font-weight:700;">Instant Booking</h3>
                        <p style="margin:0;font-size:13px;color:#64748B;line-height:1.4;">Schedule, manage, and track your services entirely online.</p>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>
            <tr>
              <td style="background-color:#F1F5F9;padding:20px;text-align:center;border-top:1px solid #E2E8F0;">
                <p style="margin:0;font-size:12px;color:#64748B;font-weight:700;">FixHub Inc.</p>
                <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;">&copy; ${new Date().getFullYear()} All rights reserved. Do not reply to this email.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>`
    });
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
  }
};

/**
 * Send New Service Promotional Email (BCC Blast)
 */
const sendNewServicePromoEmail = async (bccList, service) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') return;
  try {
    // Send in chunks of 50 to prevent SMTP overwhelming and list bounce
    const chunkSize = 50;
    for (let i = 0; i < bccList.length; i += chunkSize) {
      const chunk = bccList.slice(i, i + chunkSize);
      
      await transporter.sendMail({
        from: `"FixHub Announcements" <${process.env.EMAIL_USER}>`,
        bcc: chunk, // Strict BCC usage absolutely protects user privacy
        subject: `✨ New Premium Service Added: ${service.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
          </head>
          <body style="margin:0;padding:24px 16px;background-color:#F8FAFC;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;">
            <table width="100%" cellpadding="0" cellspacing="0" align="center" style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 20px -5px rgba(0,0,0,0.06);">
              <tr>
                <td style="background-color:#0F172A;padding:32px 24px;text-align:center;">
                  <span style="display:inline-block;background:#38BDF8;color:#0F172A;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:20px;margin-bottom:12px;">New Service Catalog Addition</span>
                  <h1 style="color:#FFFFFF;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">${service.name}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 24px;">
                  <p style="margin:0 0 16px;font-size:16px;color:#1E293B;font-weight:700;">We've successfully expanded our catalog!</p>
                  <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
                    ${service.description}
                  </p>
                  
                  <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Introductory Price</p>
                    <h2 style="margin:0;font-size:28px;color:#0F172A;font-weight:800;letter-spacing:-1px;">₹${service.price}</h2>
                  </div>

                  <a href="http://localhost:3000/services" style="display:block;width:100%;text-align:center;background-color:#0F172A;color:#FFFFFF;text-decoration:none;padding:14px 0;border-radius:6px;font-size:15px;font-weight:600;">Book Now</a>
                </td>
              </tr>
              <tr>
                <td style="background-color:#F1F5F9;padding:20px;text-align:center;border-top:1px solid #E2E8F0;">
                  <p style="margin:0;font-size:12px;color:#64748B;font-weight:700;">FixHub Inc.</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;">You received this because you are an active subscriber or member with verified email permissions.</p>
                </td>
              </tr>
            </table>
          </body>
          </html>`
      });
    }
    console.log(`✅ Broadcast promo email sent to ${bccList.length} users securely for service: ${service.name}`);
  } catch (error) {
    console.error(`❌ Failed to send broadcast email for service ${service.name}:`, error);
  }
};

/**
 * Send Account Deletion OTP
 */
const sendDeleteAccountOtp = async (email, name, otp) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') return;
  try {
    await transporter.sendMail({
      from: `"FixHub Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FixHub - Account Deletion OTP',
      html: emailBase(
        `<h1 style="color:#FFFFFF;margin:0;font-size:28px;font-weight:700;">Account Deletion Request</h1>`,
        `<p style="font-size:16px;color:#4B5563;">Hello ${name},</p>
         <p style="font-size:16px;color:#4B5563;line-height:1.6;">
           Please use the authorization code below to confirm your account deletion. This code expires in 10 minutes.
         </p>
         <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:32px;text-align:center;margin:32px 0;">
           <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#991B1B;">${otp}</span>
         </div>
         <p style="font-size:14px;color:#6B7280;text-align:center;">If you did not request this, please ignore this email.</p>`
      )
    });
    console.log(`✅ Deletion OTP sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send deletion OTP to ${email}:`, error);
  }
};

/**
 * Send Subscription OTP (for purchase & cancellation verification)
 */
const sendSubscriptionOtpEmail = async (email, name, otp, action = 'subscription') => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') {
    console.log(`[DEV] Subscription OTP for ${email}: ${otp}`);
    return;
  }
  const isCancellation = action === 'cancellation';
  const accentColor = isCancellation ? '#DC2626' : '#10B981';
  const title = isCancellation ? 'Subscription Cancellation Verification' : 'Subscription Verification Code';
  const desc = isCancellation
    ? 'You have requested to cancel your FixHub subscription. Please use the code below to confirm this action.'
    : 'You are upgrading your FixHub subscription. Please use the code below to authorize the purchase.';
  try {
    await transporter.sendMail({
      from: `"FixHub Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `FixHub - ${title}`,
      html: emailBase(
        `<h1 style="color:#FFFFFF;margin:0;font-size:26px;font-weight:700;">${title}</h1>`,
        `<p style="font-size:16px;color:#4B5563;">Hello ${name},</p>
         <p style="font-size:16px;color:#4B5563;line-height:1.6;">${desc}</p>
         <div style="background:${isCancellation ? '#FEF2F2' : '#F0FDF4'};border:1px solid ${accentColor}40;border-radius:12px;padding:32px;text-align:center;margin:32px 0;">
           <div style="font-size:13px;color:#6B7280;margin-bottom:12px;letter-spacing:1px;text-transform:uppercase;">Your Verification Code</div>
           <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:${accentColor};">${otp}</span>
           <div style="font-size:13px;color:#6B7280;margin-top:12px;">Valid for 10 minutes</div>
         </div>
         <p style="font-size:14px;color:#6B7280;text-align:center;">If you did not request this, please ignore this email or contact support.</p>
         <div style="margin-top:32px;padding-top:32px;border-top:1px solid #E5E7EB;text-align:center;">
           <p style="font-size:14px;color:#9CA3AF;">&copy; ${new Date().getFullYear()} FixHub Inc.</p>
         </div>`
      )
    });
    console.log(`✅ Subscription OTP sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send subscription OTP to ${email}:`, error);
  }
};

/**
 * Send Subscription Purchase Confirmation
 */
const sendSubscriptionSuccessEmail = async (email, name, planName, expiryDate, amount) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') {
    console.log(`[DEV] Would send subscription success email to ${email} for ${planName}`);
    return;
  }
  const expiryStr = expiryDate ? new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
  try {
    await transporter.sendMail({
      from: `"FixHub Premium" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `FixHub - ${planName} Plan Activated! 🎉`,
      html: emailBase(
        `<h1 style="color:#FFFFFF;margin:0;font-size:28px;font-weight:700;">Subscription Activated!</h1>
         <p style="color:#9CA3AF;margin:8px 0 0;">Welcome to ${planName}</p>`,
        `<p style="font-size:16px;color:#4B5563;">Hello ${name},</p>
         <p style="font-size:16px;color:#4B5563;line-height:1.6;">
           Your <strong>${planName} Plan</strong> has been successfully activated. Enjoy all your premium benefits!
         </p>
         <div style="background:#F0FDF4;border:2px solid #10B981;border-radius:12px;padding:24px;margin:24px 0;">
           <table width="100%" cellpadding="0" cellspacing="0">
             <tr>
               <td style="color:#374151;font-size:15px;padding:6px 0;"><strong>Plan:</strong></td>
               <td style="color:#10B981;font-size:15px;font-weight:700;text-align:right;">${planName}</td>
             </tr>
             <tr>
               <td style="color:#374151;font-size:15px;padding:6px 0;"><strong>Amount Paid:</strong></td>
               <td style="color:#374151;font-size:15px;text-align:right;">₹${amount}</td>
             </tr>
             <tr>
               <td style="color:#374151;font-size:15px;padding:6px 0;"><strong>Valid Until:</strong></td>
               <td style="color:#374151;font-size:15px;text-align:right;">${expiryStr}</td>
             </tr>
           </table>
         </div>
         <p style="font-size:14px;color:#6B7280;">You now enjoy exclusive discounts and benefits. Thank you for being a valued FixHub member!</p>
         <div style="margin-top:32px;padding-top:32px;border-top:1px solid #E5E7EB;text-align:center;">
           <p style="font-size:14px;color:#9CA3AF;">&copy; ${new Date().getFullYear()} FixHub Inc.</p>
         </div>`
      )
    });
    console.log(`✅ Subscription success email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send subscription success email to ${email}:`, error);
  }
};

/**
 * Send Subscription Cancellation Confirmation
 */
const sendSubscriptionCancelledEmail = async (email, name, planName, reason) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') {
    console.log(`[DEV] Would send subscription cancellation email to ${email}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"FixHub Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `FixHub - Your Subscription Has Been Cancelled`,
      html: emailBase(
        `<h1 style="color:#FFFFFF;margin:0;font-size:28px;font-weight:700;">Subscription Cancelled</h1>`,
        `<p style="font-size:16px;color:#4B5563;">Hello ${name},</p>
         <p style="font-size:16px;color:#4B5563;line-height:1.6;">
           Your <strong>${planName} Plan</strong> has been cancelled as requested. Your account has been reverted to the <strong>Basic Plan</strong>.
         </p>
         ${reason ? `<div style="background:#FEF9C3;border:1px solid #FDE047;border-radius:8px;padding:16px;margin:20px 0;">
           <strong style="color:#713F12;">Reason provided:</strong> <span style="color:#713F12;">${reason}</span>
         </div>` : ''}
         <p style="font-size:15px;color:#4B5563;line-height:1.6;">
           We're sorry to see you go. If you change your mind, you can re-subscribe anytime from your Account Settings.
         </p>
         <div style="margin-top:32px;padding-top:32px;border-top:1px solid #E5E7EB;text-align:center;">
           <p style="font-size:14px;color:#9CA3AF;">&copy; ${new Date().getFullYear()} FixHub Inc.</p>
         </div>`
      )
    });
    console.log(`✅ Subscription cancellation email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send cancellation email to ${email}:`, error);
  }
};

/**
 * Build a shared receipt table HTML for booking emails
 */
const buildReceiptTable = (bookings, transactionId, paymentMethod, amount, date) => {
  const serviceRows = (bookings || []).map(b => `
    <tr>
      <td style="padding:10px 14px;font-size:14px;color:#374151;border-top:1px solid #F3F4F6;">${b.name || b.service?.name || b.service || 'Service'}</td>
      <td style="padding:10px 14px;font-size:14px;color:#6B7280;text-align:center;border-top:1px solid #F3F4F6;">${b.date ? new Date(b.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '-'}</td>
      <td style="padding:10px 14px;font-size:14px;color:#6B7280;text-align:center;border-top:1px solid #F3F4F6;">${b.time || '-'}</td>
      <td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:700;text-align:right;border-top:1px solid #F3F4F6;">₹${b.price || '-'}</td>
    </tr>`).join('');

  return `
    <div style="background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:12px;overflow:hidden;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background:#F3F4F6;">
            <th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;text-align:left;font-weight:700;">Service</th>
            <th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;text-align:center;font-weight:700;">Date</th>
            <th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;text-align:center;font-weight:700;">Time</th>
            <th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;text-align:right;font-weight:700;">Price</th>
          </tr>
        </thead>
        <tbody>${serviceRows}</tbody>
      </table>
      <div style="padding:12px 14px;border-top:2px solid #E5E7EB;display:flex;justify-content:space-between;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#6B7280;">Transaction ID</td>
            <td style="font-size:13px;color:#6B7280;text-align:center;">Payment Method</td>
            <td style="font-size:15px;font-weight:800;color:#111827;text-align:right;">Total: ₹${amount}</td>
          </tr>
          <tr>
            <td style="font-size:12px;font-family:monospace;color:#374151;padding-top:2px;">${transactionId}</td>
            <td style="font-size:12px;color:#374151;text-align:center;padding-top:2px;">${paymentMethod}</td>
            <td style="font-size:11px;color:#9CA3AF;text-align:right;padding-top:2px;">${date}</td>
          </tr>
        </table>
      </div>
    </div>`;
};

/**
 * Send Booking Confirmation Email (fires right after payment + bookings are created)
 */
const sendBookingConfirmationEmail = async ({ email, name, paymentId, bookings, transactionId, paymentMethod, amount }) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') {
    console.log(`[DEV] Would send booking confirmation email to ${email}`);
    return;
  }
  const firstName = (name || 'there').split(' ')[0];
  const date = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const receiptTable = buildReceiptTable(bookings, transactionId, paymentMethod, amount, date);
  
  // Generate PDF for attachment
  const pdfStream = new PassThrough();
  generateReceiptPDF({
    name, email, amount, transactionId, paymentMethod, date,
    confirmed: false,
    bookings
  }, pdfStream);

  try {
    await transporter.sendMail({
      from: `"FixHub Bookings" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `FixHub - Your service booking request received and admin will confirm it`,
      html: emailBase(
        `<h1 style="color:#FFFFFF;margin:0;font-size:28px;font-weight:800;">Booking Received!</h1>
         <p style="color:#9CA3AF;margin:8px 0 0;font-size:15px;">We've received your booking and it's pending admin confirmation.</p>`,
        `<p style="font-size:16px;color:#374151;">Hello ${firstName},</p>
         <p style="font-size:15px;color:#4B5563;line-height:1.65;">
           Thank you for booking with FixHub. Your payment of <strong>₹${amount}</strong> has been received and your booking is now <strong>pending confirmation</strong> by our team. You'll get another email once it's confirmed.
         </p>

         <div style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:14px;color:#1D4ED8;">
           ℹ️ Your booking is <strong>pending</strong>. Our team will confirm it shortly, usually within a few hours.
         </div>

         <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:8px;">Your Receipt</div>
         ${receiptTable}

         <div style="text-align:center;margin:28px 0 8px;">
           <a href="http://localhost:5000/api/payments/receipt/${paymentId}/pdf" style="display:inline-block;background:#111827;color:#ffffff;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;">
             Download Receipt (PDF) →
           </a>
         </div>
         <p style="font-size:13px;color:#9CA3AF;text-align:center;">The receipt is also attached to this email as a PDF.</p>

         <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E5E7EB;text-align:center;">
           <p style="font-size:13px;color:#9CA3AF;">© ${new Date().getFullYear()} FixHub Inc. · Questions? Reply to this email.</p>
         </div>`
      ),
      attachments: [{
        filename: `FixHub_Receipt_${transactionId || 'Booking'}.pdf`,
        content: pdfStream
      }]
    });
    console.log(`✅ Booking confirmation email (with PDF) sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send booking confirmation email to ${email}:`, error);
  }
};


/**
 * Send Booking Confirmed Email (fires when admin confirms a booking)
 */
const sendBookingConfirmedEmail = async ({ email, name, paymentId, bookings, transactionId, paymentMethod, amount, confirmedAt }) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') {
    console.log(`[DEV] Would send booking confirmed email to ${email}`);
    return;
  }
  const firstName = (name || 'there').split(' ')[0];
  const date = new Date(confirmedAt || Date.now()).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const receiptTable = buildReceiptTable(bookings, transactionId, paymentMethod, amount, date);

  // Generate PDF for attachment
  const pdfStream = new PassThrough();
  generateReceiptPDF({
    name, email, amount, transactionId, paymentMethod, date,
    confirmed: true,
    bookings
  }, pdfStream);

  try {
    await transporter.sendMail({
      from: `"FixHub Bookings" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `FixHub - Your Booking is Confirmed! ✅`,
      html: emailBase(
        `<div style="display:inline-block;background:#10B981;border-radius:8px;padding:4px 14px;font-size:12px;font-weight:700;letter-spacing:2px;color:#fff;margin-bottom:14px;text-transform:uppercase;">✓ Confirmed</div>
         <h1 style="color:#FFFFFF;margin:0;font-size:28px;font-weight:800;">Your Booking is Confirmed!</h1>
         <p style="color:#9CA3AF;margin:8px 0 0;font-size:15px;">A professional is on the way. See you soon!</p>`,
        `<p style="font-size:16px;color:#374151;">Hello ${firstName},</p>
         <p style="font-size:15px;color:#4B5563;line-height:1.65;">
           Great news! Your FixHub booking has been <strong style="color:#059669;">confirmed</strong> by our team. A qualified professional will arrive at your address at the scheduled time.
         </p>

         <div style="background:#F0FDF4;border:1.5px solid #6EE7B7;border-radius:10px;padding:14px 18px;margin:20px 0;font-size:14px;color:#065F46;">
           ✅ Booking <strong>confirmed</strong> on ${date}. Please ensure someone is available at the address at the scheduled time.
         </div>

         <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:8px;">Confirmed Receipt</div>
         ${receiptTable}

         <div style="text-align:center;margin:28px 0 8px;">
           <a href="http://localhost:5000/api/payments/receipt/${paymentId}/pdf" style="display:inline-block;background:#111827;color:#ffffff;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;">
             Download Official PDF Receipt →
           </a>
         </div>
         <p style="font-size:13px;color:#9CA3AF;text-align:center;">The confirmed receipt is also attached as a PDF.</p>

         <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E5E7EB;text-align:center;">
           <p style="font-size:13px;color:#9CA3AF;">© ${new Date().getFullYear()} FixHub Inc. · Need help? Reply to this email.</p>
         </div>`
      ),
      attachments: [{
        filename: `FixHub_Confirmed_Receipt_${transactionId || 'Booking'}.pdf`,
        content: pdfStream
      }]
    });
    console.log(`✅ Booking confirmed email (with PDF) sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send booking confirmed email to ${email}:`, error);
  }
};
/**
 * Send Subscription Extended Confirmation
 */
const sendSubscriptionExtendedEmail = async (email, name, planName, days, newExpiryDate) => {
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password') {
    console.log(`[DEV] Would send subscription extended email to ${email}`);
    return;
  }
  const expiryStr = newExpiryDate ? new Date(newExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
  try {
    await transporter.sendMail({
      from: `"FixHub Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `FixHub - Your Subscription Has Been Extended 📅`,
      html: emailBase(
        `<h1 style="color:#FFFFFF;margin:0;font-size:28px;font-weight:700;">Subscription Extended</h1>`,
        `<p style="font-size:16px;color:#4B5563;">Hello ${name},</p>
         <p style="font-size:16px;color:#4B5563;line-height:1.6;">
           Great news! Your <strong>${planName} Plan</strong> has been extended by <strong>${days} days</strong>.
         </p>
         <div style="background:#F0FDF4;border:2px solid #10B981;border-radius:12px;padding:24px;margin:24px 0;">
           <table width="100%" cellpadding="0" cellspacing="0">
             <tr>
               <td style="color:#374151;font-size:15px;padding:6px 0;"><strong>Extension:</strong></td>
               <td style="color:#6B7280;font-size:15px;text-align:right;">+${days} days added</td>
             </tr>
             <tr>
               <td style="color:#374151;font-size:15px;padding:6px 0;"><strong>New Expiry Date:</strong></td>
               <td style="color:#10B981;font-size:15px;font-weight:700;text-align:right;">${expiryStr}</td>
             </tr>
           </table>
         </div>
         <p style="font-size:15px;color:#4B5563;line-height:1.6;">
           Enjoy your continued premium benefits with FixHub!
         </p>
         <div style="margin-top:32px;padding-top:32px;border-top:1px solid #E5E7EB;text-align:center;">
           <p style="font-size:14px;color:#9CA3AF;">&copy; ${new Date().getFullYear()} FixHub Inc.</p>
         </div>`
      )
    });
    console.log(`✅ Subscription extended email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send extended email to ${email}:`, error);
  }
};


module.exports = {
  sendWelcomeEmail,
  sendDeleteAccountOtp,
  sendSubscriptionOtpEmail,
  sendSubscriptionSuccessEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionExtendedEmail,
  sendBookingConfirmationEmail,
  sendBookingConfirmedEmail,
  sendNewServicePromoEmail,
};
