/* ── Shared ReceiptPreview ── */
/* Sandboxed iframe that renders receipt HTML inline.
   Used by Payment.js, Checkout.js, and anywhere a receipt preview is needed. */

import React, { useRef, useEffect, useCallback } from 'react';

const ReceiptPreview = ({ html, maxWidth = '100%' }) => {
  const iframeRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (doc && doc.body) {
        iframe.style.height = doc.body.scrollHeight + 'px';
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
    adjustHeight();
    const t = setTimeout(adjustHeight, 400);
    return () => clearTimeout(t);
  }, [html, adjustHeight]);

  return (
    <iframe
      ref={iframeRef}
      title="Receipt Preview"
      style={{
        width: '100%',
        maxWidth,
        border: 'none',
        overflow: 'hidden',
        display: 'block',
        background: 'transparent',
      }}
      scrolling="no"
      sandbox="allow-same-origin"
    />
  );
};

export default ReceiptPreview;
