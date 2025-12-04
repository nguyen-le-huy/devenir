import { PayOS } from '@payos/node';

const requiredVars = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];
const missingVars = requiredVars.filter((key) => !process.env[key]);

if (missingVars.length) {
  throw new Error(`Missing PayOS configuration for: ${missingVars.join(', ')}`);
}

const payosClient = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

export default payosClient;
