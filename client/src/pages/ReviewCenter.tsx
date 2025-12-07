import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Search } from "lucide-react";

export default function ReviewCenter() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // All hooks must be called before any conditional returns
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [sortBy, setSortBy] = useState<"createdAt_desc" | "createdAt_asc">("createdAt_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingIds, setRejectingIds] = useState<number[]>([]);

  // Fetch notes
  const { data: notes = [], refetch } = trpc.timelineNotes.listPendingNotes.useQuery({
    status: statusFilter,
    sortBy,
  });

  // Mutations
  const approveMutation = trpc.timelineNotes.approve.useMutation({
    onSuccess: () => {
      toast.success("筆記已核准");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = trpc.timelineNotes.reject.useMutation({
    onSuccess: () => {
      toast.success("筆記已拒絕");
      refetch();
      setRejectDialogOpen(false);
      setRejectReason("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const batchApproveMutation = trpc.timelineNotes.batchApprove.useMutation({
    onSuccess: () => {
      toast.success(`已核准 ${selectedIds.length} 筆筆記`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const batchRejectMutation = trpc.timelineNotes.batchReject.useMutation({
    onSuccess: () => {
      toast.success(`已拒絕 ${selectedIds.length} 筆筆記`);
      setSelectedIds([]);
      setRejectDialogOpen(false);
      setRejectReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Redirect if not logged in or not admin/staff
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    if (!user) {
      setLocation("/login");
      return;
    }
    if (user.role === "viewer") {
      toast.error("您沒有權限存取審核中心");
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Early return after all hooks
  if (loading || !user || user.role === "viewer") {
    return null;
  }

  // Handlers
  const handleApprove = (id: number) => {
    approveMutation.mutate({ id });
  };

  const handleReject = (id: number) => {
    setRejectingIds([id]);
    setRejectDialogOpen(true);
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    batchApproveMutation.mutate({ ids: selectedIds });
  };

  const handleBatchReject = () => {
    if (selectedIds.length === 0) return;
    setRejectingIds(selectedIds);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!rejectReason || rejectReason.length < 10) {
      toast.error("拒絕原因至少需要 10 個字");
      return;
    }

    if (rejectingIds.length === 1) {
      rejectMutation.mutate({ id: rejectingIds[0], reason: rejectReason });
    } else {
      batchRejectMutation.mutate({ ids: rejectingIds, reason: rejectReason });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotes.map((note) => note.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filter notes by search query
  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("zh-TW");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">待審核</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">已核准</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">已拒絕</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">時間軸筆記審核中心</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "管理所有待審核的時間軸筆記" : "查看您的時間軸筆記"}
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋筆記內容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="狀態篩選" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部</SelectItem>
            <SelectItem value="PENDING">待審核</SelectItem>
            <SelectItem value="APPROVED">已核准</SelectItem>
            <SelectItem value="REJECTED">已拒絕</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="排序" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">最新優先</SelectItem>
            <SelectItem value="createdAt_asc">最舊優先</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch Actions */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">已選中 {selectedIds.length} 筆</span>
          <Button
            onClick={handleBatchApprove}
            disabled={batchApproveMutation.isPending}
            size="sm"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            批次核准
          </Button>
          <Button
            onClick={handleBatchReject}
            disabled={batchRejectMutation.isPending}
            variant="destructive"
            size="sm"
          >
            <XCircle className="mr-2 h-4 w-4" />
            批次拒絕
          </Button>
        </div>
      )}

      {/* Notes Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedIds.length === filteredNotes.length && filteredNotes.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>影片標題</TableHead>
              <TableHead className="w-[100px]">時間</TableHead>
              <TableHead>筆記內容</TableHead>
              <TableHead className="w-[120px]">建立者</TableHead>
              <TableHead className="w-[180px]">建立時間</TableHead>
              <TableHead className="w-[100px]">狀態</TableHead>
              {isAdmin && <TableHead className="w-[150px]">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  尚無筆記
                </TableCell>
              </TableRow>
            ) : (
              filteredNotes.map((note) => (
                <TableRow key={note.id}>
                  {isAdmin && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(note.id)}
                        onCheckedChange={() => toggleSelect(note.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <button
                      onClick={() => setLocation(`/video/${note.videoId}`)}
                      className="text-primary hover:underline text-left"
                    >
                      {note.videoTitle || `影片 #${note.videoId}`}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono">{formatTime(note.timeSeconds)}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{note.content}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{note.userName || "未知"}</span>
                      <Badge variant="secondary" className="text-xs w-fit">
                        {note.userRole === "admin" ? "Admin" : note.userRole === "staff" ? "Staff" : "Viewer"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(note.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(note.status)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      {note.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(note.id)}
                            disabled={approveMutation.isPending}
                            size="sm"
                            variant="outline"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleReject(note.id)}
                            disabled={rejectMutation.isPending}
                            size="sm"
                            variant="outline"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒絕筆記</DialogTitle>
            <DialogDescription>
              請輸入拒絕原因（至少 10 個字）
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="例如：內容不符合規範、包含不當言論等..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || batchRejectMutation.isPending}
            >
              確認拒絕
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
