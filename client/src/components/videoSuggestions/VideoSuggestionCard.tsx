import { useState } from "react";
import { Pencil, Trash2, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type SuggestionCardProps,
  type SuggestionStatus,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from "./types";

export function VideoSuggestionCard({
  suggestion,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
  onStatusUpdate,
}: SuggestionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Check if current user can edit/delete this suggestion
  const isOwner = currentUserId === suggestion.userId;
  const isAdmin = currentUserRole === "admin";
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;
  const canUpdateStatus = isAdmin;

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete(suggestion.id);
    }
    setShowDeleteDialog(false);
  };

  // Handle status update
  const handleStatusChange = async (newStatus: SuggestionStatus) => {
    if (!onStatusUpdate) return;
    
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(suggestion.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const priorityConfig = PRIORITY_CONFIG[suggestion.priority];
  const statusConfig = STATUS_CONFIG[suggestion.status];

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {suggestion.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0`}
                >
                  {priorityConfig.label}
                </Badge>
                <Badge
                  className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                >
                  {statusConfig.label}
                </Badge>
              </CardDescription>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(suggestion)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {suggestion.content}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{suggestion.userName || "未知使用者"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDate(suggestion.createdAt)}</span>
            </div>
          </div>

          {canUpdateStatus && onStatusUpdate && (
            <Select
              value={suggestion.status}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">待處理</SelectItem>
                <SelectItem value="READ">已讀</SelectItem>
                <SelectItem value="RESOLVED">已解決</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除建議？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。確定要刪除這個建議嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
