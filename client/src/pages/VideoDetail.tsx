import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Youtube, Share2, Eye, Package, Tag as TagIcon, Plus, X, Edit3 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { TagSelector } from "@/components/TagSelector";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TimelineNotes } from "@/components/TimelineNotes";
import { YouTubePlayer, YouTubePlayerHandle } from "@/components/YouTubePlayer";



export default function VideoDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const videoId = parseInt(params.id || "0");

  const { data: video, isLoading, error } = trpc.videos.getById.useQuery({ id: videoId });
  const { data: videoTags, isLoading: tagsLoading } = trpc.videoTags.getVideoTags.useQuery({ videoId });
  const incrementViewMutation = trpc.videos.incrementViewCount.useMutation();
  const [currentTime, setCurrentTime] = useState(0);
  const youtubePlayerRef = useRef<YouTubePlayerHandle>(null);
  const [editingTags, setEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Array<{ id: number; name: string; tagType: string; color?: string }>>([]);

  const utils = trpc.useUtils();
  const addTagMutation = trpc.videoTags.addTag.useMutation();
  const removeTagMutation = trpc.videoTags.removeTag.useMutation();

  useEffect(() => {
    if (video) {
      // Increment view count when video is loaded
      incrementViewMutation.mutate({ id: videoId });
    }
  }, [video]);

  // Load existing tags when editing
  useEffect(() => {
    if (videoTags && editingTags) {
      setSelectedTags(videoTags.map(t => ({
        id: t.id,
        name: t.name,
        tagType: t.tagType,
        color: t.color || undefined,
      })));
    }
  }, [videoTags, editingTags]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return <Youtube className="w-5 h-5 text-red-600" />;
      case "tiktok":
        return <span className="text-lg">📱</span>;
      case "redbook":
        return <span className="text-lg">📕</span>;
      default:
        return null;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "YouTube";
      case "tiktok":
        return "抖音";
      case "redbook":
        return "小紅書";
      default:
        return platform;
    }
  };

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      product_intro: "使用介紹",
      maintenance: "維修",
      case_study: "案例",
      faq: "常見問題",
      other: "其他",
    };
    return categoryMap[category] || category;
  };

  const handleSeek = (timeSeconds: number) => {
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(timeSeconds);
    }
  };

  const canShare = video?.platform === "youtube" && video?.shareStatus === "public";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>影片不存在</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">找不到指定的影片</p>
            <Button onClick={() => setLocation("/board")}>返回列表</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/board")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
          <div className="flex items-center gap-2">
            {getPlatformIcon(video.platform)}
            <span className="font-medium">{getPlatformName(video.platform)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Video Player */}
        <Card>
          <CardContent className="p-6">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
              {video.platform === "youtube" ? (
                <YouTubePlayer
                  ref={youtubePlayerRef}
                  videoId={extractYouTubeId(video.videoUrl)}
                  onTimeUpdate={setCurrentTime}
                  onReady={() => {
                    // Player is ready
                  }}
                />
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {video.platform === "tiktok" ? "抖音" : "小紅書"}影片請點擊下方連結觀看
                  </p>
                  <Button asChild>
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                      開啟影片
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{getCategoryName(video.category)}</Badge>
                  {video.shareStatus === "public" && (
                    <Badge variant="default" className="bg-green-600">
                      公開分享
                    </Badge>
                  )}
                  {video.shareStatus === "private" && (
                    <Badge variant="outline">僅內部</Badge>
                  )}
                </div>
              </div>

              {video.description && (
                <div>
                  <h3 className="font-semibold mb-2">影片描述</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{video.description}</p>
                </div>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {video.productId && (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>商品編號：{video.productId}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{video.viewCount} 次觀看</span>
                </div>
              </div>

              {/* Tags */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TagIcon className="w-4 h-4" />
                    標籤
                  </h3>
                  {user && (
                    <Dialog open={editingTags} onOpenChange={setEditingTags}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit3 className="w-3 h-3 mr-2" />
                          編輯標籤
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>編輯影片標籤</DialogTitle>
                          <DialogDescription>
                            為這部影片新增或移除標籤，最多 5 個標籤
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <TagSelector
                            videoId={videoId}
                            selectedTags={selectedTags}
                            onTagsChange={setSelectedTags}
                            maxTags={5}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingTags(false)}
                            >
                              取消
                            </Button>
                            <Button
                              onClick={async () => {
                                try {
                                  // Find tags to remove
                                  const tagsToRemove = videoTags?.filter(
                                    (et: { id: number }) => !selectedTags.some(st => st.id === et.id)
                                  ) || [];
                                  // Find tags to add
                                  const tagsToAdd = selectedTags.filter(
                                    st => !videoTags?.some((et: { id: number }) => et.id === st.id)
                                  );

                                  // Remove old tags
                                  for (const tag of tagsToRemove) {
                                    await removeTagMutation.mutateAsync({
                                      videoId,
                                      tagId: tag.id,
                                    });
                                  }

                                  // Add new tags
                                  for (const tag of tagsToAdd) {
                                    await addTagMutation.mutateAsync({
                                      videoId,
                                      tagId: tag.id,
                                      weight: 1,
                                    });
                                  }

                                  // Refresh tags
                                  await utils.videoTags.getVideoTags.invalidate({ videoId });
                                  toast.success("標籤更新成功！");
                                  setEditingTags(false);
                                } catch (error) {
                                  toast.error("標籤更新失敗");
                                  console.error(error);
                                }
                              }}
                            >
                              儲存
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                {videoTags && videoTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {videoTags.map((tag) => (
                      <Link key={tag.id} href={`/tag/${tag.id}`}>
                        <button
                          className="px-3 py-1 rounded-full text-sm hover:opacity-80 transition-opacity flex items-center gap-1"
                          style={{
                            backgroundColor: tag.color || '#3B82F6',
                            color: 'white',
                          }}
                        >
                          {tag.tagType === "PRODUCT_CODE" ? (
                            <Package className="w-3 h-3" />
                          ) : (
                            <TagIcon className="w-3 h-3" />
                          )}
                          {tag.name}
                        </button>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">尚無標籤</p>
                )}
              </div>

              {/* Share Button */}
              <div className="pt-4 border-t">
                <Button
                  variant={canShare ? "default" : "outline"}
                  disabled={!canShare}
                  onClick={() => {
                    if (canShare) {
                      const shareUrl = `${window.location.origin}/portal`;
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("客戶專區連結已複製");
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {canShare ? "分享給客戶" : "僅 YouTube 公開影片可分享"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Notes */}
        <Card>
          <CardContent className="p-6">
            <TimelineNotes
              videoId={videoId}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}
