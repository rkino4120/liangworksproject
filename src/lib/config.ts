export const config = {
  microCMS: {
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
    apiKey: process.env.MICROCMS_API_KEY!,
  },
} as const;

// 環境変数の存在確認
if (!config.microCMS.serviceDomain) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is required');
}

if (!config.microCMS.apiKey) {
  throw new Error('MICROCMS_API_KEY is required');
}
