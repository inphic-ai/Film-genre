import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit, Trash2, Youtube, Eye } from "lucide-react";
import { useLocation } from "wouter";
import type { Video } from "../../../drizzle/schema";

interface VideoCardProps {
  video: Video;
  onEdit?: (video: Video) => void;
  onDelete?: (video: Video) => void;
  showActions?: boolean;
}

const platformLabels: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: '抖音',
  redbook: '小紅書',
};

export function VideoCard({ video, onEdit, onDelete, showActions = false }: VideoCardProps) {
  const [, setLocation] = useLocation();

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return <Youtube className="w-4 h-4 text-red-600" />;
      case "tiktok":
        return <span className="text-base">📱</span>;
      case "redbook":
        return <span className="text-base">📕</span>;
      default:
        return null;
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setLocation(`/video/${video.id}`)}
    >
      {/* Thumbnail with overlays */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {video.thumbnailUrl && (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Platform Icon */}
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
          {getPlatformIcon(video.platform)}
          <span className="text-xs font-medium">{platformLabels[video.platform] || video.platform}</span>
        </div>

        {/* Share Status Badge */}
        {video.shareStatus === "public" && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-600">公開</Badge>
          </div>
        )}

        {/* View Count */}
        {video.viewCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span className="text-xs">{video.viewCount}</span>
          </div>
        )}
      </div>

      <CardHeader className="space-y-2">
        <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
        {video.description && (
          <CardDescription className="line-clamp-2">
            {video.description}
          </CardDescription>
        )}
        {video.productId && (
          <div className="text-xs text-muted-foreground">
            商品編號：{video.productId}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              window.open(video.videoUrl, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            觀看影片
          </Button>
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(video);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              編輯
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(video);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              刪除
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
