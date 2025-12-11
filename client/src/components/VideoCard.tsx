import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Edit, Trash2, Youtube, Eye, Tag, Package, Star, Clock, User } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import type { Video } from "../../../drizzle/schema";

interface VideoCardProps {
  video: Video;
  onEdit?: (video: Video) => void;
  onDelete?: (video: Video) => void;
  showActions?: boolean;
  showTags?: boolean;
  maxTags?: number;
  batchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (videoId: number) => void;
}

const platformLabels: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: '抖音',
  redbook: '小紅書',
};

// Format duration from seconds to HH:MM:SS or MM:SS
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export function VideoCard({ video, onEdit, onDelete, showActions = false, showTags = true, maxTags = 3, batchMode = false, isSelected = false, onToggleSelect }: VideoCardProps) {
  const [, setLocation] = useLocation();

  // Fetch tags for this video
  const { data: videoTags } = trpc.videoTags.getVideoTags.useQuery(
    { videoId: video.id },
    { enabled: showTags }
  );

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
      className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
        batchMode && isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => {
        if (batchMode && onToggleSelect) {
          onToggleSelect(video.id);
        } else {
          setLocation(`/video/${video.id}`);
        }
      }}
    >
      {/* Thumbnail with overlays */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {/* Batch Mode Checkbox */}
        {batchMode && (
          <div 
            className="absolute top-2 left-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSelect) {
                onToggleSelect(video.id);
              }
            }}
          >
            <Checkbox
              checked={isSelected}
              className="h-5 w-5 bg-background/90 backdrop-blur-sm"
            />
          </div>
        )}
        {video.thumbnailUrl && (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
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

        {/* Rating */}
        {video.rating && (
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{video.rating}</span>
          </div>
        )}

        {/* Duration & View Count */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {video.duration && (
            <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{formatDuration(video.duration)}</span>
            </div>
          )}
          {video.viewCount > 0 && (
            <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span className="text-xs">{video.viewCount}</span>
            </div>
          )}
        </div>
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
        {video.creator && (
          <div 
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/creator/${encodeURIComponent(video.creator || '')}`);
            }}
          >
            <User className="h-3 w-3" />
            {video.creator}
          </div>
        )}
        {/* Tags */}
        {showTags && videoTags && videoTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {videoTags
              .sort((a, b) => {
                // Prioritize PRODUCT_CODE tags
                if (a.tagType === "PRODUCT_CODE" && b.tagType !== "PRODUCT_CODE") return -1;
                if (a.tagType !== "PRODUCT_CODE" && b.tagType === "PRODUCT_CODE") return 1;
                return 0;
              })
              .slice(0, maxTags)
              .map(tag => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 gap-1"
                  style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to tag detail page
                    setLocation(`/tag/${tag.id}`);
                  }}
                >
                  {tag.tagType === "PRODUCT_CODE" ? (
                    <Package className="h-2.5 w-2.5" />
                  ) : (
                    <Tag className="h-2.5 w-2.5" />
                  )}
                  <span>{tag.name}</span>
                </Badge>
              ))}
            {videoTags.length > maxTags && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{videoTags.length - maxTags}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
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
