'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Work } from '@/lib/microcms';
import { categoryConfig, getCategoryValue } from '@/lib/category-utils';
import WorkCard from './WorkCard';

interface WorksGridProps {
  initialWorks: Work[];
}

const WorksGrid = memo(function WorksGrid({ initialWorks }: WorksGridProps) {
  const [works] = useState<Work[]>(initialWorks);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredWorks = useMemo(() => {
    if (selectedCategory === 'all') {
      return works;
    }
    return works.filter(work => {
      const categoryValue = getCategoryValue(work.category);
      return categoryValue === selectedCategory;
    });
  }, [works, selectedCategory]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  return (
    <div>
      {/* カテゴリフィルター */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {categoryConfig.options.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedCategory === category.value
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* 作品数表示 */}
      <div className="text-center mb-6">
        <p className="text-gray-600">
          {filteredWorks.length}件の作品
          {selectedCategory !== 'all' && (
            <span className="ml-2 text-sm">
              ({categoryConfig.options.find(c => c.value === selectedCategory)?.label})
            </span>
          )}
        </p>
      </div>

      {/* 作品グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorks.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>

      {/* 作品がない場合のメッセージ */}
      {filteredWorks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            該当する作品が見つかりませんでした
          </p>
        </div>
      )}
    </div>
  );
});

export default WorksGrid;