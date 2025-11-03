export const config = {
  microCMS: {
    serviceDomain: process.env.NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN || '',
    apiKey: process.env.NEXT_PUBLIC_MICROCMS_API_KEY || '',
  },
} as const;

// サーバーサイドでのみ環境変数の存在確認
if (typeof window === 'undefined') {
  if (!config.microCMS.serviceDomain) {
    console.warn('NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN is not set');
  }

  if (!config.microCMS.apiKey) {
    console.warn('NEXT_PUBLIC_MICROCMS_API_KEY is not set');
  }
}
