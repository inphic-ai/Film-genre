import { useState } from "react";
import { Filter, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { VideoSuggestionCard } from "./VideoSuggestionCard";
import { AddSuggestionForm } from "./AddSuggestionForm";
import type {
  SuggestionListProps,
  SuggestionPriority,
  SuggestionStatus,
  Suggestion,
} from "./types";

export function VideoSuggestionsList({ videoId }: SuggestionListProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<
    SuggestionPriority | "ALL"
  >("ALL");
  const [filterStatus, setFilterStatus] = useState<SuggestionStatus | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Fetch suggestions
  const { data, isLoading, error } = trpc.videoSuggestions.listByVideo.useQuery(
    {
      videoId,
      priority: filterPriority === "ALL" ? undefined : filterPriority,
      status: filterStatus === "ALL" ? undefined : filterStatus,
      limit,
      offset,
    }
  );

  // Fetch count
  const { data: countData } = trpc.videoSuggestions.getCount.useQuery({
    videoId,
    priority: filterPriority === "ALL" ? undefined : filterPriority,
    status: filterStatus === "ALL" ? undefined : filterStatus,
  });

  // Delete mutation
  const deleteMutation = trpc.videoSuggestions.delete.useMutation({
    onSuccess: () => {
      toast.success("建議已刪除");
      utils.videoSuggestions.listByVideo.invalidate();
      utils.videoSuggestions.getCount.invalidate();
    },
    onError: (error) => {
      toast.error("刪除失敗", {
        description: error.message,
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = trpc.videoSuggestions.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("狀態已更新");
      utils.videoSuggestions.listByVideo.invalidate();
      utils.videoSuggestions.getCount.invalidate();
    },
    onError: (error) => {
      toast.error("更新失敗", {
        description: error.message,
      });
    },
  });

  // Handle delete
  const handleDelete = (suggestionId: number) => {
    deleteMutation.mutate({ id: suggestionId });
  };

  // Handle status update
  const handleStatusUpdate = async (
    suggestionId: number,
    status: SuggestionStatus
  ) => {
    updateStatusMutation.mutate({ id: suggestionId, status });
  };

  // Handle edit (placeholder for future implementation)
  const handleEdit = (suggestion: Suggestion) => {
    toast.info("編輯功能開發中", {
      description: `建議 ID: ${suggestion.id}`,
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilterPriority("ALL");
    setFilterStatus("ALL");
    setPage(1);
  };

  // Calculate total pages
  const totalPages = countData
    ? Math.ceil(countData.total / limit)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header with filters and add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">影片建議</h3>
          {countData && (
            <span className="text-sm text-gray-500">
              （共 {countData.total} 則）
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority Filter */}
          <Select
            value={filterPriority}
            onValueChange={(value) => {
              setFilterPriority(value as SuggestionPriority | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">所有優先級</SelectItem>
              <SelectItem value="HIGH">高優先級</SelectItem>
              <SelectItem value="MEDIUM">中優先級</SelectItem>
              <SelectItem value="LOW">低優先級</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filterStatus}
            onValueChange={(value) => {
              setFilterStatus(value as SuggestionStatus | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">所有狀態</SelectItem>
              <SelectItem value="PENDING">待處理</SelectItem>
              <SelectItem value="READ">已讀</SelectItem>
              <SelectItem value="RESOLVED">已解決</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {(filterPriority !== "ALL" || filterStatus !== "ALL") && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              清除篩選
            </Button>
          )}

          {/* Add Button */}
          {user && (
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  提交建議
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>提交影片建議</DialogTitle>
                  <DialogDescription>
                    發現影片有需要改進的地方？歡迎提出您的建議！
                  </DialogDescription>
                </DialogHeader>
                <AddSuggestionForm
                  videoId={videoId}
                  onSuccess={() => setShowAddForm(false)}
                  onCancel={() => setShowAddForm(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">載入建議時發生錯誤</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data && data.suggestions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">
            {filterPriority !== "ALL" || filterStatus !== "ALL"
              ? "沒有符合篩選條件的建議"
              : "目前沒有任何建議"}
          </p>
          {user && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              成為第一個提交建議的人
            </Button>
          )}
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && !error && data && data.suggestions.length > 0 && (
        <div className="space-y-4">
          {data.suggestions.map((suggestion) => (
            <VideoSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              currentUserId={user?.id}
              currentUserRole={user?.role}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一頁
          </Button>
          <span className="text-sm text-gray-600">
            第 {page} / {totalPages} 頁
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            下一頁
          </Button>
        </div>
      )}
    </div>
  );
}
