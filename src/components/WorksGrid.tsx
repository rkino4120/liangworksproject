'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Work } from '@/types/work';
import { categoryConfig, getCategoryValue } from '@/lib/category-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 justify-center">
        {categoryConfig.options.map((category) => (
          <Button
            key={category.value}
            onClick={() => handleCategoryChange(category.value)}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            className="rounded-full"
          >
            {category.label}
          </Button>
        ))}
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredWorks.length}件の作品
          </Badge>
          {selectedCategory !== 'all' && (
            <Badge variant="outline" className="text-sm">
              {categoryConfig.options.find(c => c.value === selectedCategory)?.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorks.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>

      {filteredWorks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600 text-lg">
            該当する作品が見つかりません
          </p>
        </div>
      )}
    </div>
  );
});

export default WorksGrid;
