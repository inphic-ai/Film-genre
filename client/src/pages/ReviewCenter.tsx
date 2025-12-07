import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { CheckCircle2, XCircle, Search, TrendingUp, Clock, FileText } from "lucide-react";

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

  // Fetch review stats (admin only)
  const { data: reviewStats } = trpc.reviewCenter.getReviewStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Fetch audit history (admin only)
  const { data: auditHistory } = trpc.reviewCenter.getAuditHistory.useQuery(
    { limit: 50, offset: 0 },
    { enabled: user?.role === "admin" }
  );

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
    <DashboardLayout>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">審核中心</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "管理所有時間軸筆記審核與統計" : "查看您的時間軸筆記"}
          </p>
        </div>

        {/* Admin-only tabs */}
        {isAdmin ? (
          <Tabs defaultValue="review" className="space-y-6">
            <TabsList>
              <TabsTrigger value="review">
                <FileText className="mr-2 h-4 w-4" />
                筆記審核
              </TabsTrigger>
              <TabsTrigger value="stats">
                <TrendingUp className="mr-2 h-4 w-4" />
                審核統計
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="mr-2 h-4 w-4" />
                審核歷史
              </TabsTrigger>
            </TabsList>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6">
              {/* Filters and Search */}
              <div className="flex flex-wrap gap-4">
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
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
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
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedIds.length === filteredNotes.length && filteredNotes.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>影片標題</TableHead>
                      <TableHead className="w-[100px]">時間</TableHead>
                      <TableHead>筆記內容</TableHead>
                      <TableHead className="w-[120px]">建立者</TableHead>
                      <TableHead className="w-[180px]">建立時間</TableHead>
                      <TableHead className="w-[100px]">狀態</TableHead>
                      <TableHead className="w-[150px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          尚無筆記
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNotes.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(note.id)}
                              onCheckedChange={() => toggleSelect(note.id)}
                            />
                          </TableCell>
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-6">
              {reviewStats && (
                <>
                  {/* Overview Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">總筆記數</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reviewStats.total}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">待審核</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{reviewStats.pending}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">已核准</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{reviewStats.approved}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">通過率</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reviewStats.approvalRate}%</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>最近 7 天審核趨勢</CardTitle>
                      <CardDescription>核准與拒絕筆記數量變化</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reviewStats.recentTrend.approvals.length === 0 && reviewStats.recentTrend.rejections.length === 0 ? (
                          <p className="text-sm text-muted-foreground">最近 7 天無審核記錄</p>
                        ) : (
                          <div className="space-y-2">
                            {reviewStats.recentTrend.approvals.map((item) => (
                              <div key={item.date} className="flex items-center justify-between">
                                <span className="text-sm">{item.date}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-green-600">核准: {item.count}</span>
                                  <span className="text-sm text-red-600">
                                    拒絕: {reviewStats.recentTrend.rejections.find((r) => r.date === item.date)?.count || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Reject Reasons */}
                  <Card>
                    <CardHeader>
                      <CardTitle>常見拒絕原因關鍵字</CardTitle>
                      <CardDescription>最常出現在拒絕原因中的關鍵字（前 10 名）</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {reviewStats.topRejectReasons.length === 0 ? (
                        <p className="text-sm text-muted-foreground">尚無拒絕記錄</p>
                      ) : (
                        <div className="space-y-2">
                          {reviewStats.topRejectReasons.map((reason, index) => (
                            <div key={reason.keyword} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{index + 1}</Badge>
                                <span className="text-sm">{reason.keyword}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{reason.count} 次</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>審核歷史記錄</CardTitle>
                  <CardDescription>最近 50 筆審核操作記錄</CardDescription>
                </CardHeader>
                <CardContent>
                  {auditHistory && auditHistory.logs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>操作時間</TableHead>
                          <TableHead>操作者</TableHead>
                          <TableHead>操作類型</TableHead>
                          <TableHead>資源類型</TableHead>
                          <TableHead>資源 ID</TableHead>
                          <TableHead>詳細資訊</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditHistory.logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">{formatDate(log.createdAt)}</TableCell>
                            <TableCell>{log.userName || "系統"}</TableCell>
                            <TableCell>
                              <Badge variant={
                                log.action.includes("approve") ? "default" : 
                                log.action.includes("reject") ? "destructive" : "secondary"
                              }>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.resourceType || "-"}</TableCell>
                            <TableCell>{log.resourceId || "-"}</TableCell>
                            <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                              {log.details || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">尚無審核歷史記錄</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Staff view - only show review tab
          <div className="space-y-6">
            {/* Same review content as admin but without tabs */}
            <div className="flex flex-wrap gap-4">
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

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>影片標題</TableHead>
                    <TableHead className="w-[100px]">時間</TableHead>
                    <TableHead>筆記內容</TableHead>
                    <TableHead className="w-[120px]">建立者</TableHead>
                    <TableHead className="w-[180px]">建立時間</TableHead>
                    <TableHead className="w-[100px]">狀態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        尚無筆記
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotes.map((note) => (
                      <TableRow key={note.id}>
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

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
    </DashboardLayout>
  );
}
