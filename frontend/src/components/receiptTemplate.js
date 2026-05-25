/* =====================================================
   receiptTemplate.js  -  FixHub PDF Receipt Templates
   =====================================================
   TABLE-based layout + 100% inline styles.
   Required for html2pdf.js (html2canvas) compatibility.
   Body width fixed at 794px to match A4 PDF output.

   ONLY black (#000, #111, #333, #666, #999) and white
   (#FFF, #FAFAFA, #F5F5F5, #EEE, #DDD) are used.
   Status pills use light tinted backgrounds.
   ===================================================== */

/* -- Helpers -- */
const fmt = (v) => {
  if (v == null) return '\u2014';
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : String(v);
};

const statusStyle = (s) => {
  const map = {
    pending:   { label: 'Pending',   text: '#92400E', bg: '#FEF9C3' },
    confirmed: { label: 'Confirmed', text: '#166534', bg: '#DCFCE7' },
    completed: { label: 'Completed', text: '#1E40AF', bg: '#DBEAFE' },
    cancelled: { label: 'Cancelled', text: '#991B1B', bg: '#FEE2E2' },
  };
  return map[s] || map.pending;
};

/* -- Font stack -- */
const F = "'Segoe UI', Helvetica, Arial, sans-serif";


/* ====================================================
   PAYMENT / CHECKOUT RECEIPT
   ==================================================== */
export const paymentReceiptHTML = (data) => {
  const services = Array.isArray(data.bookings) ? data.bookings : (data.bookingsData || []);

  /* Build service rows */
  const svcRows = services.map((b, i) => {
    const name  = b.serviceId?.name  || b.name  || 'Service';
    const price = b.serviceId?.price || b.price || 0;
    const qty   = b.quantity || 1;
    return `
    <tr>
      <td style="padding:12px 16px;font-size:12px;color:#999;border-bottom:1px solid #EEE;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111;border-bottom:1px solid #EEE;">${name}</td>
      <td style="padding:12px 16px;font-size:12px;color:#666;text-align:center;border-bottom:1px solid #EEE;">${qty}</td>
      <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#111;text-align:right;border-bottom:1px solid #EEE;">&#8377;${fmt(price)}</td>
    </tr>`;
  }).join('');

  const fallbackRow = `
    <tr>
      <td style="padding:12px 16px;font-size:12px;color:#999;border-bottom:1px solid #EEE;">01</td>
      <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111;border-bottom:1px solid #EEE;">Booked Services</td>
      <td style="padding:12px 16px;font-size:12px;color:#666;text-align:center;border-bottom:1px solid #EEE;">1</td>
      <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#111;text-align:right;border-bottom:1px solid #EEE;">&#8377;${fmt(data.amount)}</td>
    </tr>`;

  const ss = statusStyle(data.status || 'pending');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{width:100%;font-family:${F};background:#FFF;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
</head><body>

<!-- ============ OUTER WRAPPER ============ -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF;border-collapse:collapse;font-family:${F};">

  <!-- -------- TOP ACCENT LINE -------- -->
  <tr><td colspan="2" style="height:4px;background:#000;"></td></tr>

  <!-- -------- HEADER -------- -->
  <tr>
    <td colspan="2" style="padding:36px 48px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;">
          <div style="font-size:28px;font-weight:900;color:#000;letter-spacing:-1px;line-height:1;">FixHub</div>
          <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Service Booking Platform</div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="font-size:22px;font-weight:300;color:#000;letter-spacing:3px;text-transform:uppercase;">Receipt</div>
          <div style="margin-top:8px;">
            <span style="display:inline-block;padding:4px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${ss.text};background:${ss.bg};border-radius:3px;">${ss.label}</span>
          </div>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- -------- DIVIDER -------- -->
  <tr><td colspan="2" style="padding:0 48px;"><div style="height:1px;background:#DDD;"></div></td></tr>

  <!-- -------- TWO-COLUMN INFO -------- -->
  <tr>
    <td colspan="2" style="padding:24px 48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>

        <!-- Left: Customer -->
        <td style="width:50%;vertical-align:top;padding-right:20px;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:10px;">Issued To</div>
          <div style="font-size:15px;font-weight:700;color:#000;margin-bottom:3px;">${data.customerInfo?.name || '\u2014'}</div>
          <div style="font-size:12px;color:#666;line-height:1.7;">
            ${data.customerInfo?.email || '\u2014'}<br/>
            ${data.customerInfo?.phone || '\u2014'}
          </div>
        </td>

        <!-- Right: Receipt details -->
        <td style="width:50%;vertical-align:top;padding-left:20px;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:10px;">Receipt Details</div>
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="font-size:11px;color:#999;padding:3px 0;width:90px;">Transaction</td>
              <td style="font-size:12px;font-weight:600;color:#111;padding:3px 0;font-family:'Courier New',monospace;">${data.transactionId || '\u2014'}</td>
            </tr>
            <tr>
              <td style="font-size:11px;color:#999;padding:3px 0;">Date</td>
              <td style="font-size:12px;font-weight:600;color:#111;padding:3px 0;">${data.date || '\u2014'}</td>
            </tr>
            <tr>
              <td style="font-size:11px;color:#999;padding:3px 0;">Payment</td>
              <td style="font-size:12px;font-weight:600;color:#111;padding:3px 0;">${data.method || 'Cash on Service'}</td>
            </tr>
          </table>
        </td>

      </tr></table>
    </td>
  </tr>

  <!-- -------- DIVIDER -------- -->
  <tr><td colspan="2" style="padding:0 48px;"><div style="height:1px;background:#DDD;"></div></td></tr>

  <!-- -------- SERVICES TABLE -------- -->
  <tr>
    <td colspan="2" style="padding:20px 48px 0;">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:12px;">Services</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:10px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:left;border-top:2px solid #000;border-bottom:1px solid #DDD;width:44px;">#</th>
            <th style="padding:10px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:left;border-top:2px solid #000;border-bottom:1px solid #DDD;">Description</th>
            <th style="padding:10px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:center;border-top:2px solid #000;border-bottom:1px solid #DDD;width:60px;">Qty</th>
            <th style="padding:10px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:right;border-top:2px solid #000;border-bottom:1px solid #DDD;width:110px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${svcRows || fallbackRow}
        </tbody>
      </table>
    </td>
  </tr>

  <!-- -------- TOTAL SECTION -------- -->
  <tr>
    <td colspan="2" style="padding:4px 48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:60%;"></td>
          <td style="width:40%;padding-top:8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;font-size:11px;color:#666;">Subtotal</td>
                <td style="padding:6px 0;font-size:12px;font-weight:600;color:#333;text-align:right;">&#8377;${fmt(data.amount)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:11px;color:#666;">Tax</td>
                <td style="padding:6px 0;font-size:12px;font-weight:600;color:#333;text-align:right;">&#8377;0</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:4px 0;"><div style="height:2px;background:#000;"></div></td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:14px;font-weight:800;color:#000;text-transform:uppercase;letter-spacing:0.5px;">Total</td>
                <td style="padding:10px 0;font-size:20px;font-weight:900;color:#000;text-align:right;letter-spacing:-0.5px;">&#8377;${fmt(data.amount)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- -------- NOTES -------- -->
  <tr>
    <td colspan="2" style="padding:0 48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border:1px solid #EEE;border-collapse:collapse;">
        <tr>
          <td style="padding:16px 20px;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:8px;">Important Notes</div>
            <div style="font-size:11px;color:#666;line-height:1.8;">
              &#8226; Matching vendors have been notified of your booking.<br/>
              &#8226; A vendor will accept your request and you'll be notified.<br/>
              &#8226; Please keep this receipt for your records.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- -------- FOOTER DIVIDER -------- -->
  <tr><td colspan="2" style="padding:0 48px;"><div style="height:1px;background:#DDD;"></div></td></tr>

  <!-- -------- FOOTER -------- -->
  <tr>
    <td colspan="2" style="padding:20px 48px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <div style="font-size:14px;font-weight:800;color:#000;">FixHub</div>
          <div style="font-size:10px;color:#999;margin-top:2px;">support@fixhub.in</div>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <div style="font-size:10px;color:#BBB;line-height:1.6;">
            Thank you for choosing FixHub<br/>
            This is a computer-generated receipt
          </div>
        </td>
      </tr></table>
    </td>
  </tr>

</table>
</body></html>`;
};


/* ====================================================
   CHECKOUT RECEIPT  (delegates to payment)
   ==================================================== */
export const checkoutReceiptHTML = (data) => paymentReceiptHTML(data);


/* ====================================================
   BOOKING RECEIPT  (single-service / Your Bookings)
   ==================================================== */
export const bookingReceiptHTML = (booking) => {
  const svcName  = booking.service?.name  || 'Service';
  const svcPrice = booking.service?.price || 0;
  const ss = statusStyle(booking.status || 'pending');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{width:100%;font-family:${F};background:#FFF;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
</head><body>

<!-- ============ OUTER WRAPPER ============ -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF;border-collapse:collapse;font-family:${F};">

  <!-- -------- HEADER -------- -->
  <tr>
    <td colspan="2" style="padding:36px 48px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;">
          <div style="font-size:28px;font-weight:900;color:#000;letter-spacing:-1px;line-height:1;">FixHub</div>
          <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Service Booking Platform</div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="font-size:22px;font-weight:300;color:#000;letter-spacing:3px;text-transform:uppercase;">Receipt</div>
          <div style="margin-top:8px;">
            <span style="display:inline-block;padding:4px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${ss.text};background:${ss.bg};border-radius:3px;">${ss.label}</span>
          </div>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- -------- DIVIDER -------- -->
  <tr><td colspan="2" style="padding:0 48px;"><div style="height:1px;background:#DDD;"></div></td></tr>

  <!-- -------- BOOKING INFO -------- -->
  <tr>
    <td colspan="2" style="padding:24px 48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>

        <!-- Left: Booking details -->
        <td style="width:50%;vertical-align:top;padding-right:20px;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:10px;">Booking Details</div>
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="font-size:11px;color:#999;padding:3px 0;width:80px;">Booking ID</td>
              <td style="font-size:11px;font-weight:600;color:#111;padding:3px 0;font-family:'Courier New',monospace;">${booking._id || '\u2014'}</td>
            </tr>
            <tr>
              <td style="font-size:11px;color:#999;padding:3px 0;">Booked On</td>
              <td style="font-size:12px;font-weight:600;color:#111;padding:3px 0;">${booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014'}</td>
            </tr>
            <tr>
              <td style="font-size:11px;color:#999;padding:3px 0;">Status</td>
              <td style="padding:3px 0;">
                <span style="display:inline-block;padding:2px 10px;font-size:10px;font-weight:700;color:${ss.text};background:${ss.bg};border-radius:3px;">${ss.label}</span>
              </td>
            </tr>
          </table>
        </td>

        <!-- Right: Schedule -->
        <td style="width:50%;vertical-align:top;padding-left:20px;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:10px;">Schedule</div>
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="font-size:11px;color:#999;padding:3px 0;width:80px;">Date</td>
              <td style="font-size:12px;font-weight:600;color:#111;padding:3px 0;">${booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014'}</td>
            </tr>
            <tr>
              <td style="font-size:11px;color:#999;padding:3px 0;">Time</td>
              <td style="font-size:12px;font-weight:600;color:#111;padding:3px 0;">${booking.time || '\u2014'}</td>
            </tr>
            ${booking.address ? `<tr>
              <td style="font-size:11px;color:#999;padding:3px 0;vertical-align:top;">Address</td>
              <td style="font-size:12px;font-weight:600;color:#111;padding:3px 0;line-height:1.5;">${booking.address}</td>
            </tr>` : ''}
          </table>
        </td>

      </tr></table>
    </td>
  </tr>

  <!-- -------- DIVIDER -------- -->
  <tr><td colspan="2" style="padding:0 48px;"><div style="height:1px;background:#DDD;"></div></td></tr>

  <!-- -------- SERVICE TABLE -------- -->
  <tr>
    <td colspan="2" style="padding:20px 48px 0;">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:12px;">Service</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:10px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:left;border-top:2px solid #000;border-bottom:1px solid #DDD;width:44px;">#</th>
            <th style="padding:10px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:left;border-top:2px solid #000;border-bottom:1px solid #DDD;">Description</th>
            <th style="padding:10px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:center;border-top:2px solid #000;border-bottom:1px solid #DDD;width:60px;">Qty</th>
            <th style="padding:10px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;text-align:right;border-top:2px solid #000;border-bottom:1px solid #DDD;width:110px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:12px 16px;font-size:12px;color:#999;border-bottom:1px solid #EEE;">01</td>
            <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111;border-bottom:1px solid #EEE;">${svcName}</td>
            <td style="padding:12px 16px;font-size:12px;color:#666;text-align:center;border-bottom:1px solid #EEE;">1</td>
            <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#111;text-align:right;border-bottom:1px solid #EEE;">&#8377;${fmt(svcPrice)}</td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  <!-- -------- TOTAL SECTION -------- -->
  <tr>
    <td colspan="2" style="padding:4px 48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:60%;"></td>
          <td style="width:40%;padding-top:8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;font-size:11px;color:#666;">Subtotal</td>
                <td style="padding:6px 0;font-size:12px;font-weight:600;color:#333;text-align:right;">&#8377;${fmt(svcPrice)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:11px;color:#666;">Tax</td>
                <td style="padding:6px 0;font-size:12px;font-weight:600;color:#333;text-align:right;">&#8377;0</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:4px 0;"><div style="height:2px;background:#000;"></div></td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:14px;font-weight:800;color:#000;text-transform:uppercase;letter-spacing:0.5px;">Total</td>
                <td style="padding:10px 0;font-size:20px;font-weight:900;color:#000;text-align:right;letter-spacing:-0.5px;">&#8377;${fmt(svcPrice)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- -------- NOTES -------- -->
  ${booking.notes ? `
  <tr>
    <td colspan="2" style="padding:0 48px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;border:1px solid #EEE;border-collapse:collapse;">
        <tr>
          <td style="padding:16px 20px;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:8px;">Your Notes</div>
            <div style="font-size:11px;color:#666;line-height:1.8;">${booking.notes}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- -------- FOOTER DIVIDER -------- -->
  <tr><td colspan="2" style="padding:0 48px;"><div style="height:1px;background:#DDD;"></div></td></tr>

  <!-- -------- FOOTER -------- -->
  <tr>
    <td colspan="2" style="padding:20px 48px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <div style="font-size:14px;font-weight:800;color:#000;">FixHub</div>
          <div style="font-size:10px;color:#999;margin-top:2px;">support@fixhub.in</div>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <div style="font-size:10px;color:#BBB;line-height:1.6;">
            Thank you for choosing FixHub<br/>
            This is a computer-generated receipt
          </div>
        </td>
      </tr></table>
    </td>
  </tr>

</table>
</body></html>`;
};


export default { paymentReceiptHTML, checkoutReceiptHTML, bookingReceiptHTML };
