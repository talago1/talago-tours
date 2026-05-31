function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function verifyPaymobEnv() {
  return {
    PAYMOB_API_KEY: requireEnv('PAYMOB_API_KEY'),
    PAYMOB_INTEGRATION_ID: requireEnv('PAYMOB_INTEGRATION_ID'),
    PAYMOB_HMAC_SECRET: requireEnv('PAYMOB_HMAC_SECRET'),
  };
}

export function verifyQrEnv() {
  return {
    QR_HMAC_SECRET: requireEnv('QR_HMAC_SECRET'),
  };
}
