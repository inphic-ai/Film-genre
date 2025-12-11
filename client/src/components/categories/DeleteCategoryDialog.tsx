import { trpc } from '../../lib/trpc';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

type Category = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DeleteCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSuccess: () => void;
};

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const deleteMutation = trpc.videoCategories.delete.useMutation({
    onSuccess: () => {
      toast.success('分類已刪除（軟刪除）');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const handleDelete = () => {
    if (!category) return;
    deleteMutation.mutate({ id: category.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            刪除分類
          </DialogTitle>
          <DialogDescription>
            此操作將軟刪除分類（標記為停用），不會影響已分類的影片。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-foreground">
            確定要刪除以下分類嗎？
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium text-foreground">{category?.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              類型：{category?.type}
            </p>
            {category?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? '刪除中...' : '確認刪除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
