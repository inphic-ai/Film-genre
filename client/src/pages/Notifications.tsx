import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch notifications
  const { data, isLoading, refetch } = trpc.notifications.list.useQuery({
    limit,
    offset: page * limit,
    isRead: filter === "unread" ? false : undefined,
  });

  // Fetch unread count
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery();

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: number) => {
    deleteMutation.mutate({ notificationId });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REVIEW_APPROVED":
        return <CheckCheck className="w-5 h-5 text-green-600" />;
      case "REVIEW_REJECTED":
        return <Bell className="w-5 h-5 text-red-600" />;
      case "SYSTEM_ANNOUNCEMENT":
        return <Bell className="w-5 h-5 text-blue-600" />;
      case "MENTION":
        return <Bell className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "REVIEW_APPROVED":
        return "bg-green-100 text-green-800";
      case "REVIEW_REJECTED":
        return "bg-red-100 text-red-800";
      case "SYSTEM_ANNOUNCEMENT":
        return "bg-blue-100 text-blue-800";
      case "MENTION":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "REVIEW_APPROVED":
        return "審核通過";
      case "REVIEW_REJECTED":
        return "審核拒絕";
      case "SYSTEM_ANNOUNCEMENT":
        return "系統公告";
      case "MENTION":
        return "提及";
      default:
        return type;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">通知中心</h1>
            <p className="text-muted-foreground mt-1">
              {unreadData?.count ? `您有 ${unreadData.count} 則未讀通知` : "所有通知已讀"}
            </p>
          </div>
          <Button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || !unreadData?.count}
            variant="outline"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            全部標記為已讀
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => {
              setFilter("all");
              setPage(0);
            }}
          >
            全部通知
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => {
              setFilter("unread");
              setPage(0);
            }}
          >
            未讀通知
            {unreadData?.count ? (
              <Badge className="ml-2" variant="secondary">
                {unreadData.count}
              </Badge>
            ) : null}
          </Button>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data?.notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === "unread" ? "沒有未讀通知" : "沒有任何通知"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {data?.notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-colors ${
                  !notification.isRead ? "bg-blue-50/50 border-blue-200" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <Badge className={getNotificationBadgeColor(notification.type)}>
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="default" className="bg-blue-600">
                              未讀
                            </Badge>
                          )}
                        </div>
                        {notification.content && (
                          <p className="text-sm text-muted-foreground">{notification.content}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notification.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > limit && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              上一頁
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              第 {page + 1} 頁，共 {Math.ceil(data.total / limit)} 頁
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasMore}
            >
              下一頁
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
