interface CategoryObject {
  id: string;
  name: string;
}

type Category = CategoryObject | string;

// カテゴリ設定とユーティリティ関数
export const categoryConfig = {
  colors: {
    threejs: 'bg-green-100 text-green-800',
    babylonjs: 'bg-blue-100 text-blue-800',
  } as Record<string, string>,
  
  labels: {
    threejs: 'Three.js',
    babylonjs: 'Babylon.js',
  } as Record<string, string>,
  
  options: [
    { value: 'all', label: 'すべて' },
    { value: 'threejs', label: 'Three.js' },
    { value: 'babylonjs', label: 'Babylon.js' },
  ],
};

export const getCategoryValue = (category: Category): string => {
  return typeof category === 'object' ? category.id : category;
};

export const getCategoryName = (category: Category): string => {
  if (typeof category === 'object') {
    return category.name;
  }
  return categoryConfig.labels[category] || category;
};
