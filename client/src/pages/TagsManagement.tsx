import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Tag as TagIcon, Loader2 } from "lucide-react";
import { toast as showToast } from "sonner";

export default function TagsManagement() {
  const toast = (opts: { title: string; description?: string; variant?: string }) => {
    if (opts.variant === "destructive") {
      showToast.error(opts.title, { description: opts.description });
    } else {
      showToast.success(opts.title, { description: opts.description });
    }
  };
  const utils = trpc.useUtils();
  
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  
  // View controls
  const [tagTypeFilter, setTagTypeFilter] = useState<"ALL" | "KEYWORD" | "PRODUCT_CODE">("ALL");
  const [sortBy, setSortBy] = useState<"usage_desc" | "usage_asc" | "created_desc">("usage_desc");
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formTagType, setFormTagType] = useState<"KEYWORD" | "PRODUCT_CODE">("KEYWORD");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#3B82F6");
  
  const { data: allTags, isLoading } = trpc.tags.list.useQuery();
  const { data: tagStats } = trpc.tags.getStats.useQuery();
  
  const createMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      utils.tags.getStats.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "標籤已建立" });
    },
    onError: (error) => {
      toast({ title: "建立失敗", description: error.message, variant: "destructive" });
    },
  });
  
  const updateMutation = trpc.tags.update.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      utils.tags.getStats.invalidate();
      setIsEditDialogOpen(false);
      setEditingTag(null);
      resetForm();
      toast({ title: "標籤已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = trpc.tags.delete.useMutation({
    onSuccess: () => {
      utils.tags.list.invalidate();
      utils.tags.getStats.invalidate();
      toast({ title: "標籤已刪除" });
    },
    onError: (error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    },
  });
  
  const resetForm = () => {
    setFormName("");
    setFormTagType("KEYWORD");
    setFormDescription("");
    setFormColor("#3B82F6");
  };
  
  const handleCreate = () => {
    createMutation.mutate({
      name: formName,
      tagType: formTagType,
      description: formDescription || undefined,
      color: formColor,
    });
  };
  
  const handleEdit = (tag: any) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormTagType(tag.tagType);
    setFormDescription(tag.description || "");
    setFormColor(tag.color || "#3B82F6");
    setIsEditDialogOpen(true);
  };
  
  const handleUpdate = () => {
    if (!editingTag) return;
    updateMutation.mutate({
      id: editingTag.id,
      name: formName,
      tagType: formTagType,
      description: formDescription || undefined,
      color: formColor,
    });
  };
  
  const handleDelete = (tag: any) => {
    if (!confirm(`確定要刪除標籤「${tag.name}」嗎？`)) return;
    deleteMutation.mutate({ id: tag.id });
  };
  
  const filteredTags = allTags
    ?.filter(tag => {
      // Search filter
      const matchesSearch = tag.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchKeyword.toLowerCase());
      if (!matchesSearch) return false;
      
      // Tag type filter
      if (tagTypeFilter === "ALL") return true;
      return tag.tagType === tagTypeFilter;
    })
    .sort((a, b) => {
      // Sort by usage count or created date
      if (sortBy === "usage_desc") {
        return (b.usageCount || 0) - (a.usageCount || 0);
      } else if (sortBy === "usage_asc") {
        return (a.usageCount || 0) - (b.usageCount || 0);
      } else {
        // created_desc
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">標籤管理</h1>
            <p className="text-muted-foreground mt-1">管理影片標籤與分類</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                新增標籤
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增標籤</DialogTitle>
                <DialogDescription>建立新的影片標籤</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">標籤名稱</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="例如：維修、安裝、故障排除"
                  />
                </div>
                <div>
                  <Label htmlFor="tagType">標籤類型</Label>
                  <Select value={formTagType} onValueChange={(v) => setFormTagType(v as "KEYWORD" | "PRODUCT_CODE")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KEYWORD">關鍵字</SelectItem>
                      <SelectItem value="PRODUCT_CODE">商品編號</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">描述（選填）</Label>
                  <Textarea
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="標籤的詳細說明"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="color">顏色</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={!formName.trim() || createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  建立
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Statistics */}
        {tagStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">總標籤數</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tagStats.totalTags}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">關鍵字標籤</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allTags?.filter(t => t.tagType === 'KEYWORD').length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">商品編號標籤</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allTags?.filter(t => t.tagType === 'PRODUCT_CODE').length || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋標籤名稱或描述..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* View Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Tag Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">標籤類型：</span>
              <div className="flex gap-2">
                <Button
                  variant={tagTypeFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTagTypeFilter("ALL")}
                >
                  全部
                </Button>
                <Button
                  variant={tagTypeFilter === "PRODUCT_CODE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTagTypeFilter("PRODUCT_CODE")}
                >
                  商品編號
                </Button>
                <Button
                  variant={tagTypeFilter === "KEYWORD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTagTypeFilter("KEYWORD")}
                >
                  關鍵字
                </Button>
              </div>
            </div>
            
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">排序：</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage_desc">使用次數（高到低）</SelectItem>
                  <SelectItem value="usage_asc">使用次數（低到高）</SelectItem>
                  <SelectItem value="created_desc">建立時間（新到舊）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Tags List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags?.map((tag) => (
            <Card key={tag.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-muted-foreground" style={{ color: tag.color || undefined }} />
                    <CardTitle className="text-base">{tag.name}</CardTitle>
                  </div>
                  <Badge variant={tag.tagType === "PRODUCT_CODE" ? "default" : "secondary"}>
                    {tag.tagType === "PRODUCT_CODE" ? "商品編號" : "關鍵字"}
                  </Badge>
                </div>
                {tag.description && (
                  <CardDescription className="mt-2 text-sm">{tag.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    使用次數：{tag.usageCount}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯標籤</DialogTitle>
              <DialogDescription>修改標籤資訊</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">標籤名稱</Label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-tagType">標籤類型</Label>
                <Select value={formTagType} onValueChange={(v) => setFormTagType(v as "KEYWORD" | "PRODUCT_CODE")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KEYWORD">關鍵字</SelectItem>
                    <SelectItem value="PRODUCT_CODE">商品編號</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">描述（選填）</Label>
                <Textarea
                  id="edit-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">顏色</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleUpdate} disabled={!formName.trim() || updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
