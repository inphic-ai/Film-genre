import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Film, Tag, Eye, TrendingUp, Youtube, Video as VideoIcon, Package, Users, FileText, Clock, CheckCircle, XCircle, UserCircle } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  // 使用新的 dashboard API
  const { data: overview, isLoading: overviewLoading } = trpc.dashboard.getOverview.useQuery();
  const { data: videoStats, isLoading: videoStatsLoading } = trpc.dashboard.getVideoStats.useQuery();
  const { data: productStats, isLoading: productStatsLoading } = trpc.dashboard.getProductStats.useQuery();
  const { data: userActivity, isLoading: activityLoading } = trpc.dashboard.getUserActivity.useQuery();
  const { data: creatorStats, isLoading: creatorStatsLoading } = trpc.dashboard.getCreatorStats.useQuery();
  
  // 保留舊的 API 用於熱門標籤
  const { data: popularTags, isLoading: tagsLoading } = trpc.tags.getPopular.useQuery({ limit: 15 });
  // 使用新的 getRecentVideos API 取代 listAll
  const { data: recentVideos, isLoading: recentVideosLoading } = trpc.dashboard.getRecentVideos.useQuery({ limit: 6 });

  const isLoading = overviewLoading || videoStatsLoading || productStatsLoading || activityLoading || tagsLoading || creatorStatsLoading || recentVideosLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">看板總覽</h1>
          <p className="text-muted-foreground">
            INPHIC 影片知識庫系統 - 數據統計與活動追蹤
          </p>
        </div>

        {/* 綜合統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/board">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">總影片數</CardTitle>
                <Film className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalVideos || 0}</div>
                <p className="text-xs text-muted-foreground">
                  點擊查看影片看板
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/products">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">總商品數</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  點擊查看商品中樞
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/my-contributions">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">時間軸筆記</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalNotes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  點擊查看我的貢獻
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/creators">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">創作者</CardTitle>
                <UserCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{creatorStats?.totalCreators || 0}</div>
                <p className="text-xs text-muted-foreground">
                  點擊查看創作者列表
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 影片統計圖表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 分類分佈 */}
          <Card>
            <CardHeader>
              <CardTitle>影片分類分佈</CardTitle>
              <CardDescription>各分類影片數量統計</CardDescription>
            </CardHeader>
            <CardContent>
              {videoStats?.categoryDistribution && videoStats.categoryDistribution.length > 0 ? (
                <div className="space-y-3">
                  {videoStats.categoryDistribution.map((item) => {
                    const percentage = videoStats.totalVideos > 0 
                      ? ((item.count / videoStats.totalVideos) * 100).toFixed(1)
                      : 0;
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.category || '未分類'}</span>
                          <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  尚無分類資料
                </div>
              )}
            </CardContent>
          </Card>

          {/* 平台分佈 */}
          <Card>
            <CardHeader>
              <CardTitle>平台分佈</CardTitle>
              <CardDescription>各平台影片數量統計</CardDescription>
            </CardHeader>
            <CardContent>
              {videoStats?.platformDistribution && videoStats.platformDistribution.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {videoStats.platformDistribution.map((item) => {
                    const platformIcon = item.platform === 'youtube' ? Youtube : VideoIcon;
                    const platformColor = item.platform === 'youtube' ? 'text-red-600' : 
                                         item.platform === 'tiktok' ? 'text-blue-600' : 'text-pink-600';
                    const platformBg = item.platform === 'youtube' ? 'bg-red-50 dark:bg-red-950/20' : 
                                      item.platform === 'tiktok' ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-pink-50 dark:bg-pink-950/20';
                    const Icon = platformIcon;
                    
                    return (
                      <div key={item.platform} className={`flex items-center gap-3 p-4 rounded-lg ${platformBg}`}>
                        <Icon className={`h-8 w-8 ${platformColor}`} />
                        <div className="flex-1">
                          <div className="text-2xl font-bold">{item.count}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.platform === 'youtube' ? 'YouTube' : 
                             item.platform === 'tiktok' ? '抖音' : '小紅書'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  尚無平台資料
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 商品分析儀表板 */}
        <Card>
          <CardHeader>
            <CardTitle>商品分析儀表板</CardTitle>
            <CardDescription>商品關聯統計與熱門商品</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 商品統計 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <div className="text-sm text-muted-foreground">總商品數</div>
                    <div className="text-2xl font-bold">{productStats?.totalProducts || 0}</div>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <div className="text-sm text-muted-foreground">商品關聯數</div>
                    <div className="text-2xl font-bold">{productStats?.totalRelations || 0}</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                
                {/* 關聯類型分佈 */}
                {productStats?.relationTypeDistribution && productStats.relationTypeDistribution.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">關聯類型分佈</div>
                    {productStats.relationTypeDistribution.map((item) => (
                      <div key={item.relationType} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.relationType === 'SYNONYM' ? '同義 SKU' : 
                           item.relationType === 'PART' ? '相關零件' : 
                           item.relationType === 'FAMILY' ? '商品家族' : '其他'}
                        </span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 熱門商品 */}
              <div className="space-y-2">
                <div className="text-sm font-medium mb-3">最常關聯的商品（前 10）</div>
                {productStats?.topRelatedProducts && productStats.topRelatedProducts.length > 0 ? (
                  <div className="space-y-2">
                    {productStats.topRelatedProducts.map((product, index) => (
                      <div key={product.sku} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{product.name || product.sku}</div>
                          <div className="text-xs text-muted-foreground">{product.sku}</div>
                        </div>
                        <div className="text-sm font-medium text-primary">{product.relationCount} 關聯</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    尚無商品關聯資料
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用者活動追蹤 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 審核統計 */}
          <Card>
            <CardHeader>
              <CardTitle>審核統計</CardTitle>
              <CardDescription>時間軸筆記審核狀態分佈</CardDescription>
            </CardHeader>
            <CardContent>
              {userActivity?.noteStats && userActivity.noteStats.length > 0 ? (
                <div className="space-y-4">
                  {userActivity.noteStats.map((item) => {
                    const Icon = item.status === 'APPROVED' ? CheckCircle : 
                                item.status === 'REJECTED' ? XCircle : Clock;
                    const color = item.status === 'APPROVED' ? 'text-green-600' : 
                                 item.status === 'REJECTED' ? 'text-red-600' : 'text-orange-600';
                    const bg = item.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-950/20' : 
                              item.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-orange-50 dark:bg-orange-950/20';
                    
                    return (
                      <div key={item.status} className={`flex items-center gap-3 p-4 rounded-lg ${bg}`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">
                            {item.status === 'APPROVED' ? '已通過' : 
                             item.status === 'REJECTED' ? '已拒絕' : '待審核'}
                          </div>
                          <div className="text-2xl font-bold">{item.count}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  尚無審核資料
                </div>
              )}
            </CardContent>
          </Card>

          {/* 最近活動 */}
          <Card>
            <CardHeader>
              <CardTitle>最近活動</CardTitle>
              <CardDescription>最近 7 天的系統活動記錄</CardDescription>
            </CardHeader>
            <CardContent>
              {userActivity?.recentAudits && userActivity.recentAudits.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {userActivity.recentAudits.map((audit) => (
                    <div key={audit.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{audit.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {audit.details || '無詳細資訊'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(audit.createdAt).toLocaleString('zh-TW')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  尚無活動記錄
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 熱門標籤雲 */}
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

        {/* 最近上傳 */}
        <Card>
          <CardHeader>
            <CardTitle>最近上傳</CardTitle>
            <CardDescription>最新的 6 部影片</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVideos && recentVideos.length > 0 ? (
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
    </DashboardLayout>
  );
}
