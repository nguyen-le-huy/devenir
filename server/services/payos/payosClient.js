import { PayOS } from '@payos/node';

const requiredVars = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
const missingVars = requiredVars.filter((key) => !process.env[key]);

let payosClient = null;

if (missingVars.length) {
  console.warn(`⚠️ PayOS disabled: Missing ${missingVars.join(', ')}`);
} else {
  payosClient = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  });
}

export default payosClient;

