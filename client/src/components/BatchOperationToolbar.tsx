import { Button } from "@/components/ui/button";
import { Trash2, FolderEdit, Share2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface BatchOperationToolbarProps {
  selectedCount: number;
  selectedIds: number[];
  onClearSelection: () => void;
  onOperationComplete: () => void;
}

const categoryLabels: Record<string, string> = {
  product_intro: '使用介紹',
  maintenance: '維修',
  case_study: '案例',
  faq: '常見問題',
  other: '其他',
};

export function BatchOperationToolbar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onOperationComplete,
}: BatchOperationToolbarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedShareStatus, setSelectedShareStatus] = useState<string>('');

  const batchDeleteMutation = trpc.videos.batchDelete.useMutation();
  const batchUpdateCategoryMutation = trpc.videos.batchUpdateCategory.useMutation();
  const batchUpdateShareStatusMutation = trpc.videos.batchUpdateShareStatus.useMutation();

  const handleBatchDelete = async () => {
    try {
      const result = await batchDeleteMutation.mutateAsync({ ids: selectedIds });
      toast.success(`成功刪除 ${result.successCount} 部影片${result.failedCount > 0 ? `，${result.failedCount} 部失敗` : ''}`);
      setDeleteDialogOpen(false);
      onClearSelection();
      onOperationComplete();
    } catch (error) {
      toast.error('批次刪除失敗');
    }
  };

  const handleBatchUpdateCategory = async () => {
    if (!selectedCategory) {
      toast.error('請選擇分類');
      return;
    }
    try {
      const result = await batchUpdateCategoryMutation.mutateAsync({
        ids: selectedIds,
        category: selectedCategory as any,
      });
      toast.success(`成功更新 ${result.successCount} 部影片${result.failedCount > 0 ? `，${result.failedCount} 部失敗` : ''}`);
      setCategoryDialogOpen(false);
      setSelectedCategory('');
      onClearSelection();
      onOperationComplete();
    } catch (error) {
      toast.error('批次更新分類失敗');
    }
  };

  const handleBatchUpdateShareStatus = async () => {
    if (!selectedShareStatus) {
      toast.error('請選擇分享狀態');
      return;
    }
    try {
      const result = await batchUpdateShareStatusMutation.mutateAsync({
        ids: selectedIds,
        shareStatus: selectedShareStatus as any,
      });
      toast.success(`成功更新 ${result.successCount} 部影片${result.failedCount > 0 ? `，${result.failedCount} 部失敗` : ''}`);
      setShareDialogOpen(false);
      setSelectedShareStatus('');
      onClearSelection();
      onOperationComplete();
    } catch (error) {
      toast.error('批次更新分享狀態失敗');
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground shadow-lg rounded-lg px-6 py-4 flex items-center gap-4">
        <span className="font-medium">已選擇 {selectedCount} 部影片</span>
        
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={batchDeleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            刪除
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCategoryDialogOpen(true)}
            disabled={batchUpdateCategoryMutation.isPending}
          >
            <FolderEdit className="h-4 w-4 mr-2" />
            修改分類
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShareDialogOpen(true)}
            disabled={batchUpdateShareStatusMutation.isPending}
          >
            <Share2 className="h-4 w-4 mr-2" />
            修改分享狀態
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 批次刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除選中的 {selectedCount} 部影片嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={batchDeleteMutation.isPending}
            >
              {batchDeleteMutation.isPending ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批次修改分類對話框 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批次修改分類</DialogTitle>
            <DialogDescription>
              為選中的 {selectedCount} 部影片設定新的分類。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="選擇分類" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleBatchUpdateCategory}
              disabled={batchUpdateCategoryMutation.isPending || !selectedCategory}
            >
              {batchUpdateCategoryMutation.isPending ? '更新中...' : '確認更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批次修改分享狀態對話框 */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批次修改分享狀態</DialogTitle>
            <DialogDescription>
              為選中的 {selectedCount} 部影片設定新的分享狀態。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedShareStatus} onValueChange={setSelectedShareStatus}>
              <SelectTrigger>
                <SelectValue placeholder="選擇分享狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">私密</SelectItem>
                <SelectItem value="public">公開</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleBatchUpdateShareStatus}
              disabled={batchUpdateShareStatusMutation.isPending || !selectedShareStatus}
            >
              {batchUpdateShareStatusMutation.isPending ? '更新中...' : '確認更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
