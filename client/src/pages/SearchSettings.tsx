import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Settings } from "lucide-react";

export default function SearchSettings() {
  const { data: settings, isLoading } = trpc.searchSettings.get.useQuery();
  const updateMutation = trpc.searchSettings.update.useMutation({
    onSuccess: () => {
      toast.success("搜尋設定已儲存");
      utils.searchSettings.get.invalidate();
    },
    onError: (error) => {
      toast.error(`儲存失敗：${error.message}`);
    },
  });

  const utils = trpc.useUtils();

  const [triggerMode, setTriggerMode] = useState<"realtime" | "debounce" | "manual">("debounce");
  const [debounceDelay, setDebounceDelay] = useState(500);
  const [searchEngine, setSearchEngine] = useState<"fulltext" | "tags" | "ai" | "hybrid">("hybrid");

  // Sync with server data
  useEffect(() => {
    if (settings) {
      setTriggerMode(settings.triggerMode);
      setDebounceDelay(settings.debounceDelay);
      setSearchEngine(settings.searchEngine);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      triggerMode,
      debounceDelay,
      searchEngine,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">搜尋設定</h1>
            <p className="text-muted-foreground">調整全域搜尋行為與效能</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* 搜尋觸發模式 */}
          <Card>
            <CardHeader>
              <CardTitle>搜尋觸發模式</CardTitle>
              <CardDescription>
                控制搜尋 API 何時執行查詢
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger-mode">觸發模式</Label>
                <Select value={triggerMode} onValueChange={(value: any) => setTriggerMode(value)}>
                  <SelectTrigger id="trigger-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">即時搜尋（Realtime）</SelectItem>
                    <SelectItem value="debounce">延遲搜尋（Debounce）</SelectItem>
                    <SelectItem value="manual">手動搜尋（Manual）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {triggerMode === "realtime" && "每次輸入都立即執行搜尋（可能影響效能）"}
                  {triggerMode === "debounce" && "輸入停止後延遲執行搜尋（平衡效能與體驗）"}
                  {triggerMode === "manual" && "按 Enter 或點擊搜尋按鈕才執行搜尋（最省資源）"}
                </p>
              </div>

              {/* Debounce 延遲時間（僅在 debounce 模式顯示） */}
              {triggerMode === "debounce" && (
                <div className="space-y-2">
                  <Label htmlFor="debounce-delay">延遲時間（毫秒）</Label>
                  <Input
                    id="debounce-delay"
                    type="number"
                    min="0"
                    step="100"
                    value={debounceDelay}
                    onChange={(e) => setDebounceDelay(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    建議值：300-1000 毫秒（預設 500）
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 搜尋引擎選擇 */}
          <Card>
            <CardHeader>
              <CardTitle>搜尋引擎</CardTitle>
              <CardDescription>
                選擇搜尋演算法（影響搜尋結果與效能）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-engine">搜尋引擎</Label>
                <Select value={searchEngine} onValueChange={(value: any) => setSearchEngine(value)}>
                  <SelectTrigger id="search-engine">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fulltext">全文搜尋（Full-Text Search）</SelectItem>
                    <SelectItem value="tags">標籤搜尋（Tags Search）</SelectItem>
                    <SelectItem value="ai">AI 智慧搜尋（AI Search）</SelectItem>
                    <SelectItem value="hybrid">混合搜尋（Hybrid）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {searchEngine === "fulltext" && "使用 PostgreSQL tsvector 全文搜尋（快速、準確）"}
                  {searchEngine === "tags" && "僅搜尋標籤（適合分類瀏覽）"}
                  {searchEngine === "ai" && "使用 AI 理解自然語言查詢（智慧、靈活）"}
                  {searchEngine === "hybrid" && "結合多種搜尋引擎（最全面，推薦）"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 儲存按鈕 */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  儲存設定
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
