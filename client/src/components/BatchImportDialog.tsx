import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, SkipForward, ExternalLink } from 'lucide-react';

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function BatchImportDialog({ open, onOpenChange, onImportComplete }: BatchImportDialogProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [category, setCategory] = useState<'product_intro' | 'maintenance' | 'case_study' | 'faq' | 'other'>('product_intro');
  const [shareStatus, setShareStatus] = useState<'private' | 'public'>('private');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
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

  const validateApiKeyMutation = trpc.videos.validateYouTubeApiKey.useMutation();
  const importPlaylistMutation = trpc.videos.importPlaylist.useMutation();

  const handleValidateApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('請輸入 YouTube API Key');
      return;
    }

    try {
      const result = await validateApiKeyMutation.mutateAsync({ apiKey });
      if (result.valid) {
        toast.success('✅ API Key 驗證成功！');
      } else {
        toast.error('❌ API Key 無效，請檢查是否正確');
      }
    } catch (error) {
      toast.error('驗證失敗，請稍後再試');
    }
  };

  const handleImport = async () => {
    if (!playlistUrl.trim()) {
      toast.error('請輸入 YouTube 播放清單 URL');
      return;
    }

    if (!apiKey.trim()) {
      toast.error('請輸入 YouTube API Key');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importPlaylistMutation.mutateAsync({
        playlistUrl,
        apiKey,
        category,
        shareStatus,
      });

      setImportResult(result);
      toast.success(`✅ 匯入完成！成功：${result.imported}、跳過：${result.skipped}、失敗：${result.failed}`);
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      toast.error(error.message || '匯入失敗，請稍後再試');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setPlaylistUrl('');
      setApiKey('');
      setCategory('product_intro');
      setShareStatus('private');
      setImportResult(null);
      onOpenChange(false);
    }
  };

  const getStatusIcon = (status: 'imported' | 'skipped' | 'failed') => {
    switch (status) {
      case 'imported':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'skipped':
        return <SkipForward className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusText = (status: 'imported' | 'skipped' | 'failed') => {
    switch (status) {
      case 'imported':
        return '✅ 成功';
      case 'skipped':
        return '⏭️ 跳過';
      case 'failed':
        return '❌ 失敗';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批次匯入 YouTube 播放清單</DialogTitle>
          <DialogDescription>
            輸入 YouTube 播放清單 URL 與 API Key，系統將自動抓取所有影片資訊與縮圖
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
          <div className="space-y-4 py-4">
            {/* Playlist URL */}
            <div className="space-y-2">
              <Label htmlFor="playlistUrl">YouTube 播放清單 URL *</Label>
              <Input
                id="playlistUrl"
                type="url"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                disabled={isImporting}
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                YouTube API Key *
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  如何取得 API Key？
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isImporting}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleValidateApiKey}
                  disabled={isImporting || validateApiKeyMutation.isPending}
                >
                  {validateApiKeyMutation.isPending ? '驗證中...' : '驗證'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                API Key 僅用於本次匯入，不會儲存到系統
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">預設分類 *</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)} disabled={isImporting}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_intro">使用介紹</SelectItem>
                  <SelectItem value="maintenance">維修</SelectItem>
                  <SelectItem value="case_study">案例</SelectItem>
                  <SelectItem value="faq">常見問題</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Share Status */}
            <div className="space-y-2">
              <Label htmlFor="shareStatus">預設分享狀態</Label>
              <Select value={shareStatus} onValueChange={(value: any) => setShareStatus(value)} disabled={isImporting}>
                <SelectTrigger id="shareStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">私人（僅內部看板）</SelectItem>
                  <SelectItem value="public">公開（客戶專區可見）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                取消
              </Button>
              <Button onClick={handleImport} disabled={isImporting || importPlaylistMutation.isPending}>
                {isImporting ? '匯入中...' : '開始匯入'}
              </Button>
            </div>

            {/* Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">正在匯入影片...</span>
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{importResult.total}</div>
                <div className="text-xs text-muted-foreground">總數</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-xs text-muted-foreground">成功</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                <div className="text-xs text-muted-foreground">跳過</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-xs text-muted-foreground">失敗</div>
              </div>
            </div>

            {/* Video List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-sm">匯入詳情</h4>
              {importResult.videos.map((video, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg text-sm"
                >
                  {getStatusIcon(video.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{video.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {getStatusText(video.status)}
                      {video.reason && ` - ${video.reason}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={handleClose}>關閉</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
