import { useEffect } from 'react';

interface MetaOptions {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
  ogUrl?: string;
  keywords?: string;
}

export const usePageMeta = (options: MetaOptions) => {
  useEffect(() => {
    console.log('usePageMeta called with:', options);
    
    // DOM要素が利用可能になるのを待つ
    const timer = setTimeout(() => {
      console.log('Setting page meta...');
      
      // タイトル設定
      document.title = options.title;
      console.log('Title set to:', options.title);

      // meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', options.description);

      // keywords
      if (options.keywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', options.keywords);
      }

      // OGP設定
      const ogTitle = options.ogTitle || options.title;
      let ogTitleMeta = document.querySelector('meta[property="og:title"]');
      if (!ogTitleMeta) {
        ogTitleMeta = document.createElement('meta');
        ogTitleMeta.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitleMeta);
      }
      ogTitleMeta.setAttribute('content', ogTitle);

      const ogDescription = options.ogDescription || options.description;
      let ogDescriptionMeta = document.querySelector('meta[property="og:description"]');
      if (!ogDescriptionMeta) {
        ogDescriptionMeta = document.createElement('meta');
        ogDescriptionMeta.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescriptionMeta);
      }
      ogDescriptionMeta.setAttribute('content', ogDescription);

      // og:type
      let ogTypeMeta = document.querySelector('meta[property="og:type"]');
      if (!ogTypeMeta) {
        ogTypeMeta = document.createElement('meta');
        ogTypeMeta.setAttribute('property', 'og:type');
        document.head.appendChild(ogTypeMeta);
      }
      ogTypeMeta.setAttribute('content', options.ogType || 'website');

      // og:image
      if (options.ogImage) {
        let ogImageMeta = document.querySelector('meta[property="og:image"]');
        if (!ogImageMeta) {
          ogImageMeta = document.createElement('meta');
          ogImageMeta.setAttribute('property', 'og:image');
          document.head.appendChild(ogImageMeta);
        }
        ogImageMeta.setAttribute('content', options.ogImage);
      }

      // og:url
      if (options.ogUrl) {
        let ogUrlMeta = document.querySelector('meta[property="og:url"]');
        if (!ogUrlMeta) {
          ogUrlMeta = document.createElement('meta');
          ogUrlMeta.setAttribute('property', 'og:url');
          document.head.appendChild(ogUrlMeta);
        }
        ogUrlMeta.setAttribute('content', options.ogUrl);
      }

      // Twitter Card
      let twitterCardMeta = document.querySelector('meta[name="twitter:card"]');
      if (!twitterCardMeta) {
        twitterCardMeta = document.createElement('meta');
        twitterCardMeta.setAttribute('name', 'twitter:card');
        document.head.appendChild(twitterCardMeta);
      }
      twitterCardMeta.setAttribute('content', 'summary_large_image');
      
      console.log('Page meta set successfully');
    }, 100);

    return () => clearTimeout(timer);
  }, [options]);
};