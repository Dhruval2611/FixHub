/* ── Shared Receipt Download Utility ── */
/* Converts receipt HTML to a downloadable PDF using html2pdf.js.
   Used by Payment.js, Checkout.js, and YourBookings.js. */

/**
 * Download a receipt as PDF.
 * @param {string}  html     - Full HTML string for the receipt.
 * @param {string}  filename - PDF filename (without .pdf extension).
 */
const downloadReceiptPDF = async (html, filename = 'FixHub-Receipt') => {
  const html2pdf = (await import('html2pdf.js')).default;

  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden';
  document.body.appendChild(iframe);

  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();

  await new Promise((r) => setTimeout(r, 600));

  await html2pdf()
    .set({
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(iframe.contentDocument.body)
    .save();

  document.body.removeChild(iframe);
};

export default downloadReceiptPDF;
