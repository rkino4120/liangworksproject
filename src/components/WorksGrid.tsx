'use client';

import { useState, memo } from 'react';
import { Work } from '@/types/work';
import WorkCard from './WorkCard';

interface WorksGridProps {
  initialWorks: Work[];
}

const WorksGrid = memo(function WorksGrid({ initialWorks }: WorksGridProps) {
  const [works] = useState<Work[]>(initialWorks);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          展示方法の一例
        </h2>
        <div className="w-16 h-0.5 bg-slate-300 mx-auto"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>

      {works.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600 text-lg">
            作品が見つかりません
          </p>
        </div>
      )}
    </div>
  );
});

export default WorksGrid;
