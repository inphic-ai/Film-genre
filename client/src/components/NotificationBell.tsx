import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function NotificationBell() {
  const [, setLocation] = useLocation();
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery();

  const unreadCount = unreadData?.count || 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-xl hover:bg-slate-100"
      onClick={() => setLocation("/notifications")}
    >
      <Bell className="h-5 w-5 text-slate-600" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs rounded-full bg-red-500"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
