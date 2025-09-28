'use client';

import { Work } from '@/types/work';
import { categoryConfig, getCategoryValue, getCategoryName } from '@/lib/category-utils';
import Image from 'next/image';
import { memo } from 'react';

interface WorkCardProps {
  work: Work;
}

const WorkCard = memo(function WorkCard({ work }: WorkCardProps) {
  const categoryValue = getCategoryValue(work.category);
  const categoryName = getCategoryName(work.category);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {work.thumbnail ? (
        <div className="relative h-48 w-full">
          <Image
            src={work.thumbnail.url}
            alt={work.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"

          />
        </div>
      ) : (
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500">画像なし</span>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryConfig.colors[categoryValue] || 'bg-gray-100 text-gray-800'}`}>
            {categoryName || categoryValue}
          </span>
          <time className="text-xs text-gray-500">
            {new Date(work.publishedAt).toLocaleDateString('ja-JP')}
          </time>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {work.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {work.description}
        </p>
        
        <a
          href={work.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full text-center bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors duration-200"
        >
          デモを見る
        </a>
      </div>
    </div>
  );
});

export default WorkCard;