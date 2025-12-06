import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Film, Tag as TagIcon, ArrowLeft, Eye, Youtube, Video as VideoIcon } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";

export default function TagDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const tagId = parseInt(params.id || "0");

  const { data: tag, isLoading: tagLoading } = trpc.tags.getById.useQuery({ id: tagId });
  const { data: videos, isLoading: videosLoading } = trpc.videoTags.getTagVideos.useQuery({ tagId });
  const { data: relatedTags, isLoading: relatedLoading } = trpc.tags.getRelated.useQuery({ tagId, limit: 10 });

  if (tagLoading || videosLoading || relatedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">標籤不存在</h2>
          <Button onClick={() => setLocation("/dashboard")}>
            返回 Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="h-5 w-5 text-red-600" />;
      case 'tiktok':
        return <VideoIcon className="h-5 w-5 text-blue-600" />;
      case 'redbook':
        return <VideoIcon className="h-5 w-5 text-pink-600" />;
      default:
        return <Film className="h-5 w-5" />;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return 'YouTube';
      case 'tiktok':
        return '抖音';
      case 'redbook':
        return '小紅書';
      default:
        return platform;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-8 space-y-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回 Dashboard
        </Button>

        {/* Tag Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: tag.color || '#3B82F6' }}
              >
                <TagIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl">{tag.name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {tag.description || '暫無描述'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{tag.usageCount}</div>
                <div className="text-sm text-muted-foreground">套用次數</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Related Videos */}
        <Card>
          <CardHeader>
            <CardTitle>相關影片</CardTitle>
            <CardDescription>
              共 {videos?.length || 0} 部影片使用此標籤（按權重排序）
            </CardDescription>
          </CardHeader>
          <CardContent>
            {videos && videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <Link key={video.id} href={`/video/${video.id}`}>
                    <div className="group cursor-pointer rounded-lg border bg-card hover:shadow-md transition-shadow overflow-hidden">
                      {/* Thumbnail */}
                      <div className="aspect-video bg-muted overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(video.platform)}
                          <span className="text-xs text-muted-foreground">
                            {getPlatformName(video.platform)}
                          </span>
                          {video.weight > 1 && (
                            <span className="ml-auto text-xs font-semibold text-primary">
                              權重 {video.weight}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                        
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>{video.viewCount || 0} 次觀看</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                此標籤尚未關聯任何影片
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Tags */}
        {relatedTags && relatedTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>相關標籤</CardTitle>
              <CardDescription>
                經常與「{tag.name}」一起使用的標籤（共現分析）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {relatedTags.map((relatedTag) => (
                  <Link key={relatedTag.id} href={`/tag/${relatedTag.id}`}>
                    <button
                      className="px-4 py-2 rounded-full hover:opacity-80 transition-opacity flex items-center gap-2"
                      style={{
                        backgroundColor: relatedTag.color || '#3B82F6',
                        color: 'white',
                      }}
                    >
                      <span>{relatedTag.name}</span>
                      <span className="text-xs opacity-75">
                        ({relatedTag.coOccurrence} 次共現)
                      </span>
                    </button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
