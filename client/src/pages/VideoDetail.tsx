import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Youtube, Share2, Eye, Package, Tag as TagIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TimelineNote {
  timestamp: number;
  content: string;
  created_at: string;
}

export default function VideoDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const videoId = parseInt(params.id || "0");

  const { data: video, isLoading, error } = trpc.videos.getById.useQuery({ id: videoId });
  const { data: videoTags, isLoading: tagsLoading } = trpc.videoTags.getVideoTags.useQuery({ videoId });
  const incrementViewMutation = trpc.videos.incrementViewCount.useMutation();
  const updateNotesMutation = trpc.videos.updateNotes.useMutation();

  const [notes, setNotes] = useState<TimelineNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [currentTimestamp, setCurrentTimestamp] = useState(0);

  useEffect(() => {
    if (video) {
      // Increment view count when video is loaded
      incrementViewMutation.mutate({ id: videoId });

      // Parse notes from JSON string
      if (video.notes) {
        try {
          const parsedNotes = JSON.parse(video.notes);
          setNotes(Array.isArray(parsedNotes) ? parsedNotes : []);
        } catch (e) {
          console.error("Failed to parse notes:", e);
          setNotes([]);
        }
      }
    }
  }, [video]);

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

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("請輸入筆記內容");
      return;
    }

    const note: TimelineNote = {
      timestamp: currentTimestamp,
      content: newNote.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedNotes = [...notes, note].sort((a, b) => a.timestamp - b.timestamp);
    setNotes(updatedNotes);
    setNewNote("");
    setCurrentTimestamp(0);

    // Save to database
    updateNotesMutation.mutate(
      {
        id: videoId,
        notes: JSON.stringify(updatedNotes),
      },
      {
        onSuccess: () => {
          toast.success("筆記已儲存");
        },
        onError: (error) => {
          toast.error(`儲存失敗：${error.message}`);
        },
      }
    );
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
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(video.videoUrl)}`}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
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
              {videoTags && videoTags.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TagIcon className="w-4 h-4" />
                    標籤
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {videoTags.map((tag) => (
                      <Link key={tag.id} href={`/tag/${tag.id}`}>
                        <button
                          className="px-3 py-1 rounded-full text-sm hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: tag.color || '#3B82F6',
                            color: 'white',
                          }}
                        >
                          {tag.name}
                        </button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

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
          <CardHeader>
            <CardTitle>時間軸筆記</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Notes */}
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-muted rounded-lg">
                    <div className="font-mono text-sm text-primary font-semibold min-w-[60px]">
                      {formatTimestamp(note.timestamp)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.created_at).toLocaleString("zh-TW")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">尚無筆記</p>
            )}

            {/* Add Note Form */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">時間戳記（秒）</label>
                  <input
                    type="number"
                    min="0"
                    value={currentTimestamp}
                    onChange={(e) => setCurrentTimestamp(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">顯示格式</label>
                  <div className="px-3 py-2 border rounded-md bg-muted font-mono">
                    {formatTimestamp(currentTimestamp)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">筆記內容</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  placeholder="輸入筆記內容..."
                />
              </div>

              <Button onClick={handleAddNote} className="w-full">
                新增筆記
              </Button>
            </div>
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
