// サーバーサイド専用の設定
// API Routeでのみ使用し、クライアントサイドでは使用しない
export const config = {
  microCMS: {
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN || '',
    apiKey: process.env.MICROCMS_API_KEY || '',
  },
} as const;
