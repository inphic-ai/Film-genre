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
import { Users, FileText, Settings, Trash2, Edit, FolderTree } from "lucide-react";

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // User management state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  // Audit logs state
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");

  // Category management state
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Fetch users
  const { data: usersData, refetch: refetchUsers } = trpc.adminSettings.listUsers.useQuery(
    { limit: 50, offset: 0 },
    { enabled: user?.role === "admin" }
  );

  // Fetch audit logs
  const { data: auditLogsData } = trpc.adminSettings.getAuditLogs.useQuery(
    {
      limit: 50,
      offset: 0,
      action: actionFilter === "all" ? undefined : actionFilter || undefined,
      resourceType: resourceTypeFilter === "all" ? undefined : resourceTypeFilter || undefined,
    },
    { enabled: user?.role === "admin" }
  );

  // Fetch audit stats
  const { data: auditStats } = trpc.adminSettings.getAuditStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Fetch categories
  const { data: categories, refetch: refetchCategories } = trpc.categories.list.useQuery();

  // Mutations
  const updateUserRoleMutation = trpc.adminSettings.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("使用者角色已更新");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserMutation = trpc.adminSettings.updateUser.useMutation({
    onSuccess: () => {
      toast.success("使用者資訊已更新");
      setEditDialogOpen(false);
      setEditingUser(null);
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = trpc.adminSettings.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("使用者已刪除");
      setDeleteDialogOpen(false);
      setDeletingUserId(null);
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLocation("/login");
      return;
    }
    if (user.role !== "admin") {
      toast.error("您沒有權限存取系統管理");
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading || !user || user.role !== "admin") {
    return null;
  }

  // Handlers
  const handleEditUser = (userData: any) => {
    setEditingUser(userData);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    setDeletingUserId(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingUserId) {
      deleteUserMutation.mutate({ userId: deletingUserId });
    }
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      userId: editingUser.id,
      name: editingUser.name,
      email: editingUser.email,
    });
  };

  const handleRoleChange = (userId: number, role: "admin" | "staff" | "viewer") => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  // Category mutations
  const updateCategoryMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("分類已更新");
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      refetchCategories();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEditCategory = (category: any) => {
    setEditingCategory({ ...category });
    setCategoryDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("分類名稱不可為空");
      return;
    }
    updateCategoryMutation.mutate({
      key: editingCategory.key,
      name: editingCategory.name,
      description: editingCategory.description || "",
    });
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("zh-TW");
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "staff":
        return <Badge variant="secondary">Staff</Badge>;
      case "viewer":
        return <Badge variant="outline">Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">系統管理</h1>
          <p className="text-muted-foreground">
            管理使用者、查看操作日誌、系統設定
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              使用者管理
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="mr-2 h-4 w-4" />
              操作日誌
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderTree className="mr-2 h-4 w-4" />
              分類管理
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              系統設定
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>使用者列表</CardTitle>
                <CardDescription>管理系統使用者與權限</CardDescription>
              </CardHeader>
              <CardContent>
                {usersData && usersData.users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>姓名</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>登入方式</TableHead>
                        <TableHead>建立時間</TableHead>
                        <TableHead>最後登入</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData.users.map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell>{userData.id}</TableCell>
                          <TableCell>{userData.name || "-"}</TableCell>
                          <TableCell>{userData.email || "-"}</TableCell>
                          <TableCell>
                            <Select
                              value={userData.role}
                              onValueChange={(role: any) => handleRoleChange(userData.id, role)}
                              disabled={userData.id === user.id}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{userData.loginMethod || "-"}</TableCell>
                          <TableCell className="text-sm">{formatDate(userData.createdAt)}</TableCell>
                          <TableCell className="text-sm">{formatDate(userData.lastSignedIn)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditUser(userData)}
                                size="sm"
                                variant="outline"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteUser(userData.id)}
                                size="sm"
                                variant="outline"
                                disabled={userData.id === user.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">尚無使用者</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            {/* Stats Cards */}
            {auditStats && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">總操作數</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{auditStats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">最近 7 天操作</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {auditStats.recentTrend.reduce((sum, item) => sum + item.count, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">操作類型數</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{auditStats.actionDistribution.length}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <div className="flex gap-4">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="操作類型篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="UPDATE_USER_ROLE">更新使用者角色</SelectItem>
                  <SelectItem value="UPDATE_USER">更新使用者資訊</SelectItem>
                  <SelectItem value="DELETE_USER">刪除使用者</SelectItem>
                  <SelectItem value="approve_note">核准筆記</SelectItem>
                  <SelectItem value="reject_note">拒絕筆記</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="資源類型篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="USER">使用者</SelectItem>
                  <SelectItem value="VIDEO">影片</SelectItem>
                  <SelectItem value="NOTE">筆記</SelectItem>
                  <SelectItem value="PRODUCT">商品</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>操作日誌</CardTitle>
                <CardDescription>最近 50 筆操作記錄</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogsData && auditLogsData.logs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作時間</TableHead>
                        <TableHead>操作者</TableHead>
                        <TableHead>操作類型</TableHead>
                        <TableHead>資源類型</TableHead>
                        <TableHead>資源 ID</TableHead>
                        <TableHead>IP 位址</TableHead>
                        <TableHead>詳細資訊</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogsData.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">{formatDate(log.createdAt)}</TableCell>
                          <TableCell>{log.userName || "系統"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.resourceType || "-"}</TableCell>
                          <TableCell>{log.resourceId || "-"}</TableCell>
                          <TableCell className="text-sm">{log.ipAddress || "-"}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {log.details || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">尚無操作日誌</p>
                )}
              </CardContent>
            </Card>

            {/* Action Distribution */}
            {auditStats && auditStats.actionDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>操作類型分佈（前 10 名）</CardTitle>
                  <CardDescription>最常見的操作類型統計</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {auditStats.actionDistribution.map((item, index) => (
                      <div key={item.action} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="text-sm">{item.action}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.count} 次</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>分類管理</CardTitle>
                <CardDescription>管理影片分類名稱與描述</CardDescription>
              </CardHeader>
              <CardContent>
                {categories && categories.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>分類 Key</TableHead>
                        <TableHead>分類名稱</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <Badge variant="outline">{category.key}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">尚無分類</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>系統設定</CardTitle>
                <CardDescription>管理系統全域設定</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  系統設定功能開發中...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯使用者</DialogTitle>
              <DialogDescription>
                修改使用者基本資訊
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">姓名</label>
                <Input
                  value={editingUser?.name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editingUser?.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending}
              >
                確認更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>刪除使用者</DialogTitle>
              <DialogDescription>
                確定要刪除此使用者嗎？此操作無法復原。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteUserMutation.isPending}
              >
                確認刪除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯分類</DialogTitle>
              <DialogDescription>
                修改分類名稱與描述（Key 不可修改）
              </DialogDescription>
            </DialogHeader>
            {editingCategory && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">分類 Key</label>
                  <Input
                    value={editingCategory.key}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">分類名稱 *</label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    placeholder="請輸入分類名稱"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">描述</label>
                  <Input
                    value={editingCategory.description || ""}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, description: e.target.value })
                    }
                    placeholder="請輸入分類描述（可選）"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateCategory}>
                儲存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
