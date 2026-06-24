const dns = require('dns');

const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (hostname.includes('notion.')) {
    const cb = typeof options === 'function' ? options : callback;
    const opt = typeof options === 'function' ? {} : options;
    console.log(`🔄 [DNS Bypass] Overriding ${hostname} lookup to 208.103.161.1`);
    
    if (opt.all) {
      return cb(null, [{ address: '208.103.161.1', family: 4 }]);
    } else {
      return cb(null, '208.103.161.1', 4);
    }
  }
  return originalLookup(hostname, options, callback);
};

console.log('Testing connection with broad DNS bypass...');

async function testFetch() {
  try {
    console.log('Fetching api.notion.com...');
    const res = await fetch('https://api.notion.com');
    console.log('✅ Fetch api.notion.com success, status:', res.status);
    console.log('Final URL:', res.url);
  } catch (err) {
    console.error('❌ Fetch api.notion.com failed:', err);
  }
}

testFetch();
