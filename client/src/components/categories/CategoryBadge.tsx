import { trpc } from '../../lib/trpc';
import { Badge } from '../ui/badge';

type CategoryBadgeProps = {
  categoryId: number;
  className?: string;
};

export function CategoryBadge({ categoryId, className }: CategoryBadgeProps) {
  const { data: categories } = trpc.videoCategories.list.useQuery({
    includeDisabled: true,
  });

  const category = categories?.find((c) => c.id === categoryId);

  if (!category) {
    return <Badge variant="secondary" className={className}>未分類</Badge>;
  }

  return (
    <Badge
      variant="secondary"
      className={className}
      style={{
        backgroundColor: category.color ? `${category.color}20` : undefined,
        borderColor: category.color || undefined,
        color: category.color || undefined,
      }}
    >
      {category.name}
    </Badge>
  );
}
