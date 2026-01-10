/**
 * Script để test response headers từ production domain
 * Chạy: node test-headers.js
 */

import https from 'https';

const domains = [
  'https://www.devenir.shop',
  'https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api'
];

console.log('🔍 Testing Response Headers...\n');

domains.forEach(url => {
  console.log(`📡 Testing: ${url}`);
  
  https.get(url, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:');
    console.log('  Cross-Origin-Opener-Policy:', res.headers['cross-origin-opener-policy'] || '❌ NOT SET');
    console.log('  Cross-Origin-Embedder-Policy:', res.headers['cross-origin-embedder-policy'] || '❌ NOT SET');
    console.log('  Cross-Origin-Resource-Policy:', res.headers['cross-origin-resource-policy'] || '❌ NOT SET');
    console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin'] || '❌ NOT SET');
    console.log('---\n');
  }).on('error', (e) => {
    console.error('❌ Error:', e.message);
    console.log('---\n');
  });
});

console.log('\n✅ Giá trị mong muốn:');
console.log('  Cross-Origin-Opener-Policy: same-origin-allow-popups');
console.log('  Cross-Origin-Embedder-Policy: (không cần set hoặc unsafe-none)');
console.log('  Cross-Origin-Resource-Policy: cross-origin');
