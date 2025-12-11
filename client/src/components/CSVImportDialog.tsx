import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<'private' | 'public'>('private');
  const [apiKey, setApiKey] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    imported: number;
    skipped: number;
    failed: number;
    videos: Array<{
      videoId: string;
      title: string;
      status: 'imported' | 'skipped' | 'failed';
      reason?: string;
    }>;
  } | null>(null);

  const { data: categories } = trpc.videoCategories.list.useQuery({ includeDisabled: false });
  const importMutation = trpc.csvImport.importFromCSV.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('請上傳 CSV 檔案');
        return;
      }
      setCsvFile(file);
    }
  };

  const handleImport = async () => {
    if (!csvFile) {
      toast.error('請選擇 CSV 檔案');
      return;
    }

    if (!categoryId) {
      toast.error('請選擇分類');
      return;
    }

    if (!apiKey) {
      toast.error('請輸入 YouTube API Key');
      return;
    }

    setImporting(true);
    setResults(null);

    try {
      // 讀取 CSV 檔案內容
      const csvContent = await csvFile.text();

      // 呼叫 API 匯入
      const result = await importMutation.mutateAsync({
        csvContent,
        categoryId,
        shareStatus,
        apiKey,
      });

      setResults(result);

      if (result.imported > 0) {
        toast.success(`成功匯入 ${result.imported} 部影片`);
        onSuccess?.();
      }

      if (result.failed > 0) {
        toast.warning(`${result.failed} 部影片匯入失敗`);
      }

      if (result.skipped > 0) {
        toast.info(`${result.skipped} 部影片已存在，已跳過`);
      }
    } catch (error) {
      console.error('CSV 匯入失敗:', error);
      toast.error(error instanceof Error ? error.message : 'CSV 匯入失敗');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCsvFile(null);
    setCategoryId(null);
    setShareStatus('private');
    setApiKey('');
    setResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CSV 批次匯入影片</DialogTitle>
          <DialogDescription>
            上傳 CSV 檔案批次匯入 YouTube 影片（格式：標題,YouTube URL）
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            {/* CSV 檔案上傳 */}
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV 檔案 *</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
              {csvFile && (
                <p className="text-sm text-muted-foreground">
                  已選擇：{csvFile.name}
                </p>
              )}
            </div>

            {/* 分類選擇 */}
            <div className="space-y-2">
              <Label htmlFor="category">分類 *</Label>
              <Select
                value={categoryId?.toString()}
                onValueChange={(value) => setCategoryId(parseInt(value))}
                disabled={importing}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="請選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 分享狀態 */}
            <div className="space-y-2">
              <Label htmlFor="share-status">分享狀態</Label>
              <Select
                value={shareStatus}
                onValueChange={(value: 'private' | 'public') => setShareStatus(value)}
                disabled={importing}
              >
                <SelectTrigger id="share-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">私人（僅內部看板）</SelectItem>
                  <SelectItem value="public">公開（客戶可見）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* YouTube API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">YouTube API Key *</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="請輸入 YouTube Data API v3 Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={importing}
              />
              <p className="text-sm text-muted-foreground">
                用於自動抓取影片資訊（標題、描述、縮圖、創作者、影片長度）
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 匯入結果統計 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">總數</p>
                <p className="text-2xl font-bold">{results.total}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">成功</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.imported}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">跳過</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {results.skipped}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">失敗</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {results.failed}
                </p>
              </div>
            </div>

            {/* 詳細結果列表 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <Label>詳細結果</Label>
              {results.videos.map((video, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 border rounded-lg"
                >
                  {video.status === 'imported' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  {video.status === 'skipped' && (
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  )}
                  {video.status === 'failed' && (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{video.title}</p>
                    {video.reason && (
                      <p className="text-sm text-muted-foreground">{video.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {!results ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={importing}>
                取消
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    匯入中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    開始匯入
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>關閉</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
