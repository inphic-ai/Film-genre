import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, ExternalLink, Star } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import type { Video } from "../../../drizzle/schema";

interface VideoListViewProps {
  videos: Video[];
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  showActions?: boolean;
  batchMode?: boolean;
  selectedVideoIds?: number[];
  onToggleSelect?: (videoId: number) => void;
}

const platformLabels: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: '抖音',
  redbook: '小紅書',
};

const categoryLabels: Record<string, string> = {
  product_intro: '使用介紹',
  maintenance: '維修',
  case_study: '案例',
  faq: '常見問題',
  other: '其他',
};

const shareStatusLabels: Record<string, string> = {
  private: '私人',
  public: '公開',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function VideoListView({ videos, onEdit, onDelete, showActions = false, batchMode = false, selectedVideoIds = [], onToggleSelect }: VideoListViewProps) {
  const [, setLocation] = useLocation();
  const { data: videoCategories } = trpc.videoCategories.list.useQuery({ includeDisabled: false });
  
  // 建立 categoryId 到 name 的對應表
  const categoryIdToName = videoCategories?.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<number, string>) || {};
  
  // 取得分類名稱（優先使用 categoryId，fallback 到舊 category）
  const getCategoryName = (video: Video) => {
    if (video.categoryId && categoryIdToName[video.categoryId]) {
      return categoryIdToName[video.categoryId];
    } else if (video.category) {
      return categoryLabels[video.category] || video.category;
    }
    return '未分類';
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {batchMode && <TableHead className="w-[50px]"></TableHead>}
            <TableHead className="w-[100px]">縮圖</TableHead>
            <TableHead>標題</TableHead>
            <TableHead className="w-[100px]">分類</TableHead>
            <TableHead className="w-[100px]">平台</TableHead>
            <TableHead className="w-[120px]">商品編號</TableHead>
            <TableHead className="w-[100px]">影片長度</TableHead>
            <TableHead className="w-[150px]">創作者</TableHead>
            <TableHead className="w-[80px]">評分</TableHead>
            <TableHead className="w-[100px]">分享狀態</TableHead>
            {showActions && <TableHead className="w-[120px]">操作</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.id} className={batchMode && selectedVideoIds.includes(video.id) ? 'bg-primary/5' : ''}>
              {batchMode && (
                <TableCell>
                  <Checkbox
                    checked={selectedVideoIds.includes(video.id)}
                    onCheckedChange={() => onToggleSelect?.(video.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="relative w-16 h-12 bg-muted rounded overflow-hidden">
                  {(video.customThumbnailUrl || video.thumbnailUrl) ? (
                    <img
                      src={video.customThumbnailUrl || video.thumbnailUrl || ''}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      無縮圖
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium max-w-[300px]">
                <div className="flex items-center gap-2">
                  <span className="truncate">{video.title}</span>
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getCategoryName(video)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {platformLabels[video.platform] || video.platform}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {video.productId || '-'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono">
                  {formatDuration(video.duration)}
                </span>
              </TableCell>
              <TableCell>
                {video.creator ? (
                  <span 
                    className="text-sm text-primary hover:underline cursor-pointer truncate block max-w-[150px]"
                    title={video.creator}
                    onClick={() => setLocation(`/creator/${encodeURIComponent(video.creator || '')}`)}
                  >
                    {video.creator}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {video.rating ? (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{video.rating}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={video.shareStatus === 'public' ? 'default' : 'secondary'}>
                  {shareStatusLabels[video.shareStatus] || video.shareStatus}
                </Badge>
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(video)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(video)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {videos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          沒有找到符合條件的影片
        </div>
      )}
    </div>
  );
}
