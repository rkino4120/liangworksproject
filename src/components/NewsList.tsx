'use client';

import { useState } from 'react';
import { News } from '@/lib/microcms';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

type NewsListProps = {
  news: News[];
};

export default function NewsList({ news }: NewsListProps) {
  const [openItems, setOpenItems] = useState<Set<string | number>>(new Set());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const toggleItem = (id: string | number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (news.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        現在お知らせはありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex-shrink-0 pt-1">
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <time className="text-sm text-slate-500 flex-shrink-0">
                    {formatDate(item.publishedAt)}
                  </time>
                  <h3 className="text-lg font-semibold text-slate-800 leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>
              <div className="flex-shrink-0 pt-1">
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>
            
            {isOpen && (
              <div className="px-4 pb-4 pl-16">
                <div 
                  className="text-slate-600 leading-relaxed prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.body }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
