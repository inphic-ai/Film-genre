import { trpc } from '../../lib/trpc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';

type CategorySelectProps = {
  value?: number | string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  includeDisabled?: boolean;
  className?: string;
};

export function CategorySelect({
  value,
  onValueChange,
  label,
  placeholder = '選擇分類',
  includeDisabled = false,
  className,
}: CategorySelectProps) {
  const { data: categories, isLoading } = trpc.videoCategories.list.useQuery({
    includeDisabled,
  });

  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <Select
        value={value?.toString()}
        onValueChange={onValueChange}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? '載入中...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              <div className="flex items-center gap-2">
                {category.color && (
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <span>{category.name}</span>
                {!category.isActive && (
                  <span className="text-xs text-muted-foreground">（已停用）</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
