import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Film, Tag, Eye, TrendingUp, Youtube, Video as VideoIcon } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: allVideos, isLoading: videosLoading } = trpc.videos.listAll.useQuery();
  const { data: tagStats, isLoading: statsLoading } = trpc.tags.getStats.useQuery();
  const { data: popularTags, isLoading: tagsLoading } = trpc.tags.getPopular.useQuery({ limit: 15 });

  if (videosLoading || statsLoading || tagsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate statistics
  const totalVideos = allVideos?.length || 0;
  const totalViews = allVideos?.reduce((sum, video) => sum + (video.viewCount || 0), 0) || 0;
  const totalTags = tagStats?.totalTags || 0;
  
  // Get this week's videos
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekVideos = allVideos?.filter(video => 
    new Date(video.createdAt) >= oneWeekAgo
  ) || [];

  // Get recent videos
  const recentVideos = allVideos?.slice(0, 6) || [];

  // Platform distribution
  const platformCounts = allVideos?.reduce((acc, video) => {
    acc[video.platform] = (acc[video.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            影片知識庫系統總覽與統計資訊
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總影片數</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVideos}</div>
              <p className="text-xs text-muted-foreground">
                跨 {Object.keys(platformCounts).length} 個平台
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本週新增</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisWeekVideos.length}</div>
              <p className="text-xs text-muted-foreground">
                最近 7 天上傳的影片
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總標籤數</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTags}</div>
              <p className="text-xs text-muted-foreground">
                平均每部影片 {tagStats?.avgTagsPerVideo || 0} 個標籤
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總觀看次數</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                所有影片累計觀看
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>平台分布</CardTitle>
            <CardDescription>各平台影片數量統計</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                <Youtube className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{platformCounts['youtube'] || 0}</div>
                  <div className="text-sm text-muted-foreground">YouTube</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <VideoIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{platformCounts['tiktok'] || 0}</div>
                  <div className="text-sm text-muted-foreground">抖音</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-pink-50 dark:bg-pink-950/20">
                <VideoIcon className="h-8 w-8 text-pink-600" />
                <div>
                  <div className="text-2xl font-bold">{platformCounts['redbook'] || 0}</div>
                  <div className="text-sm text-muted-foreground">小紅書</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Tags Cloud */}
        <Card>
          <CardHeader>
            <CardTitle>熱門標籤</CardTitle>
            <CardDescription>最常使用的標籤（點擊查看相關影片）</CardDescription>
          </CardHeader>
          <CardContent>
            {popularTags && popularTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => {
                  // Calculate font size based on usage count
                  const minSize = 14;
                  const maxSize = 32;
                  const maxUsage = Math.max(...popularTags.map(t => t.usageCount));
                  const fontSize = minSize + ((tag.usageCount / maxUsage) * (maxSize - minSize));
                  
                  return (
                    <Link key={tag.id} href={`/tag/${tag.id}`}>
                      <button
                        className="px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: tag.color || '#3B82F6',
                          color: 'white',
                          fontSize: `${fontSize}px`,
                        }}
                      >
                        {tag.name} ({tag.usageCount})
                      </button>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                尚無標籤資料
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Videos */}
        <Card>
          <CardHeader>
            <CardTitle>最近上傳</CardTitle>
            <CardDescription>最新的 6 部影片</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentVideos.map((video) => (
                  <Link key={video.id} href={`/video/${video.id}`}>
                    <div className="group cursor-pointer rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                      <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
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
                      <h3 className="font-semibold line-clamp-2 mb-1">{video.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{video.viewCount || 0} 次觀看</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                尚無影片資料
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
