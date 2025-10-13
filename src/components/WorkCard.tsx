'use client';

import { Work } from '@/types/work';
import { categoryConfig, getCategoryValue, getCategoryName } from '@/lib/category-utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { memo } from 'react';

interface WorkCardProps {
  work: Work;
}

const WorkCard = memo(function WorkCard({ work }: WorkCardProps) {
  const categoryValue = getCategoryValue(work.category);
  const categoryName = getCategoryName(work.category);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      {work.thumbnail ? (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={work.thumbnail.url}
            alt={work.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-48 bg-slate-100 flex items-center justify-center">
          <span className="text-slate-500">画像なし</span>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {categoryName || categoryValue}
          </Badge>
          <time className="text-xs text-slate-500">
            {new Date(work.publishedAt).toLocaleDateString('ja-JP')}
          </time>
        </div>
        <CardTitle className="text-lg leading-tight line-clamp-2">
          {work.title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <CardDescription className="line-clamp-3">
          {work.description}
        </CardDescription>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full" size="sm">
          <a
            href={work.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            デモを見る
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
});

export default WorkCard;
