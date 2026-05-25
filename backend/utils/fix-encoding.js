const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const files = [
  path.join(root, 'frontend/src/components/Payment.js'),
  path.join(root, 'frontend/src/components/Checkout.js'),
  path.join(root, 'frontend/src/components/YourBookings.js'),
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  // rupee ₹  — UTF-8 E2 82 B9, mangled via Win-1252: U+00E2 U+201A U+00B9
  c = c.split('\u00e2\u201a\u00b9').join('&#8377;');
  // times ×  — UTF-8 C3 97, mangled: U+00C3 U+2014
  c = c.split('\u00c3\u2014').join('&times;');
  // em dash — — UTF-8 E2 80 94, mangled: U+00E2 U+201D U+20AC (94=\u201d, 80=\u20ac reversed)
  // Actually check pattern from file: let's cover common em/en dash patterns
  c = c.split('\u00e2\u20ac\u201d').join('&mdash;');  // UTF-8 E2 80 94
  c = c.split('\u00e2\u20ac\u201c').join('&ndash;');  // UTF-8 E2 80 93
  // middle dot · — UTF-8 C2 B7, mangled: U+00C2 U+00B7
  c = c.split('\u00c2\u00b7').join('&middot;');
  fs.writeFileSync(f, c, 'utf8');
  console.log('Fixed: ' + f.split('/').pop());
});
