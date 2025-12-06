import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit, Trash2 } from "lucide-react";
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

const platformColors: Record<string, string> = {
  youtube: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  tiktok: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  redbook: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export function VideoCard({ video, onEdit, onDelete, showActions = false }: VideoCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {video.thumbnailUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
          <Badge className={platformColors[video.platform] || ''}>
            {platformLabels[video.platform] || video.platform}
          </Badge>
        </div>
        {video.description && (
          <CardDescription className="line-clamp-2">
            {video.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => window.open(video.videoUrl, '_blank')}
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
              onClick={() => onEdit?.(video)}
            >
              <Edit className="h-4 w-4 mr-2" />
              編輯
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onDelete?.(video)}
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
