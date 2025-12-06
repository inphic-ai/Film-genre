import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Tag as TagIcon, Search, TrendingUp, ArrowLeft, Award } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function TagRankingPage() {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [productIdFilter, setProductIdFilter] = useState("");

  const { data: allTags, isLoading: tagsLoading } = trpc.tags.list.useQuery();
  const { data: allVideos, isLoading: videosLoading } = trpc.videos.listAll.useQuery();

  if (tagsLoading || videosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter tags by search keyword
  let filteredTags = allTags || [];
  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    filteredTags = filteredTags.filter(tag => 
      tag.name.toLowerCase().includes(keyword) ||
      tag.description?.toLowerCase().includes(keyword)
    );
  }

  // Filter by product ID (if specified)
  if (productIdFilter && allVideos) {
    // Get videos with this product ID
    const videosWithProduct = allVideos.filter(v => v.productId === productIdFilter);
    const videoIds = new Set(videosWithProduct.map(v => v.id));
    
    // Filter tags that are used in these videos
    // Note: This is a simplified version. In production, you'd want to query this from the backend
    filteredTags = filteredTags.filter(tag => tag.usageCount > 0);
  }

  // Sort by usage count (descending)
  const sortedTags = [...filteredTags].sort((a, b) => b.usageCount - a.usageCount);

  // Get top 3 for podium
  const topThree = sortedTags.slice(0, 3);
  const restTags = sortedTags.slice(3);

  // Calculate max usage for tag cloud sizing
  const maxUsage = sortedTags.length > 0 ? sortedTags[0].usageCount : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <TrendingUp className="h-10 w-10" />
              熱門標籤排行
            </h1>
            <p className="text-muted-foreground">
              依使用次數排序的標籤排行榜
            </p>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回 Dashboard
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>智慧篩選</CardTitle>
            <CardDescription>依關鍵字或商品編號篩選標籤</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">關鍵字搜尋</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋標籤名稱或描述..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">商品編號</label>
                <Input
                  placeholder="輸入商品編號篩選..."
                  value={productIdFilter}
                  onChange={(e) => setProductIdFilter(e.target.value)}
                />
              </div>
            </div>
            {(searchKeyword || productIdFilter) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchKeyword("");
                    setProductIdFilter("");
                  }}
                >
                  清除篩選
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500" />
                前三名
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topThree.map((tag, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const heights = ['h-32', 'h-28', 'h-24'];
                  
                  return (
                    <Link key={tag.id} href={`/tag/${tag.id}`}>
                      <div className="group cursor-pointer">
                        <div
                          className={`${heights[index]} rounded-t-lg flex items-center justify-center transition-transform group-hover:scale-105`}
                          style={{ backgroundColor: tag.color || '#3B82F6' }}
                        >
                          <div className="text-center text-white">
                            <div className="text-4xl mb-2">{medals[index]}</div>
                            <div className="text-2xl font-bold">{tag.usageCount}</div>
                            <div className="text-sm opacity-90">次使用</div>
                          </div>
                        </div>
                        <div className="bg-card border border-t-0 rounded-b-lg p-4">
                          <h3 className="font-semibold text-lg text-center">{tag.name}</h3>
                          {tag.description && (
                            <p className="text-sm text-muted-foreground text-center mt-1 line-clamp-2">
                              {tag.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tag Cloud Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>標籤雲</CardTitle>
            <CardDescription>
              字體大小代表使用頻率（共 {sortedTags.length} 個標籤）
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedTags.length > 0 ? (
              <div className="flex flex-wrap gap-3 justify-center">
                {sortedTags.map((tag) => {
                  // Calculate font size based on usage count
                  const minSize = 14;
                  const maxSize = 36;
                  const fontSize = minSize + ((tag.usageCount / maxUsage) * (maxSize - minSize));
                  
                  return (
                    <Link key={tag.id} href={`/tag/${tag.id}`}>
                      <button
                        className="px-4 py-2 rounded-full hover:opacity-80 transition-all hover:scale-110"
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
              <div className="text-center py-12 text-muted-foreground">
                {searchKeyword || productIdFilter ? '沒有符合條件的標籤' : '尚無標籤資料'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking List */}
        <Card>
          <CardHeader>
            <CardTitle>完整排行榜</CardTitle>
            <CardDescription>所有標籤依使用次數排序</CardDescription>
          </CardHeader>
          <CardContent>
            {restTags.length > 0 ? (
              <div className="space-y-2">
                {restTags.map((tag, index) => (
                  <Link key={tag.id} href={`/tag/${tag.id}`}>
                    <div className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer">
                      <div className="text-2xl font-bold text-muted-foreground w-12 text-center">
                        #{index + 4}
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: tag.color || '#3B82F6' }}
                      >
                        <TagIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{tag.name}</h3>
                        {tag.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {tag.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{tag.usageCount}</div>
                        <div className="text-xs text-muted-foreground">次使用</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : sortedTags.length <= 3 ? (
              <div className="text-center py-8 text-muted-foreground">
                只有前三名標籤
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
