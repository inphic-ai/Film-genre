import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { VideoCard } from "@/components/VideoCard";
import { VideoListView } from "@/components/VideoListView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Loader2, Tag, X, ArrowUpDown, Filter, Sparkles, XCircle, LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import type { Video } from "../../../drizzle/schema";
import DashboardLayout from "@/components/DashboardLayout";

const categoryLabels: Record<string, string> = {
  product_intro: '使用介紹',
  maintenance: '維修',
  case_study: '案例',
  faq: '常見問題',
  other: '其他',
};

export default function Board() {
  const [location, setLocation] = useLocation();
  
  // 從 URL 參數讀取搜尋關鍵字（使用 useMemo 監聽 location 變化）
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), [location]);
  const searchFromUrl = urlParams.get('search') || '';
  const useFullText = urlParams.get('useFullText') === 'true';
  
  // AI 搜尋參數（使用 useMemo 監聽 location 變化）
  const isAiSearch = urlParams.get('aiSearch') === 'true';
  const parsedQuery = useMemo(() => {
    const parsedQueryStr = urlParams.get('parsedQuery');
    if (!parsedQueryStr) return null;
    
    try {
      const parsed = JSON.parse(parsedQueryStr);
      console.log('✅ AI 搜尋解析結果:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ AI 搜尋解析失敗:', error);
      return null;
    }
  }, [urlParams]);
  
  console.log('[Board Debug] isAiSearch:', isAiSearch, 'parsedQuery:', parsedQuery);
  
  const [searchKeyword, setSearchKeyword] = useState(searchFromUrl);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'viewCount' | 'createdAt' | 'title' | 'rating' | 'duration'>('viewCount');
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    const saved = localStorage.getItem('board-view-mode');
    return (saved === 'card' || saved === 'list') ? saved : 'card';
  });

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('board-view-mode', viewMode);
  }, [viewMode]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedShareStatus, setSelectedShareStatus] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const { data: allVideos, isLoading: videosLoading } = trpc.videos.listAll.useQuery();
  const { data: allTags } = trpc.tags.list.useQuery();
  
  // Use fullTextSearch API when useFullText is true
  const { data: fullTextSearchResult, isLoading: fullTextSearchLoading } = trpc.fullTextSearch.search.useQuery(
    { query: searchKeyword, limit: 50 },
    { enabled: useFullText && searchKeyword.trim().length > 0 }
  );
  
  // Use smart score API when tags are selected
  const { data: tagFilteredVideos, isLoading: tagFilterLoading } = trpc.videos.searchByTags.useQuery(
    { tagIds: selectedTagIds },
    { enabled: selectedTagIds.length > 0 }
  );
  
  // AI 搜尋 API
  const { data: aiSearchResult, isLoading: aiSearchLoading } = trpc.aiSearch.search.useQuery(
    { parsedQuery: parsedQuery!, limit: 50, offset: 0 },
    { enabled: isAiSearch && parsedQuery !== null }
  );

  const deleteMutation = trpc.videos.delete.useMutation({
    onSuccess: () => {
      utils.videos.listAll.invalidate();
    },
  });

  // Use AI search results if enabled, fullTextSearch results if enabled, tag-filtered videos if tags selected, otherwise all videos
  const baseVideos = isAiSearch && aiSearchResult
    ? aiSearchResult.videos
    : useFullText && fullTextSearchResult 
    ? fullTextSearchResult.results.map(r => ({ ...r, notes: null, searchVector: null, rating: null, creator: null })) 
    : selectedTagIds.length > 0 
    ? tagFilteredVideos 
    : allVideos;

  const filteredVideos = baseVideos?.filter(video => {
    const matchesSearch = !searchKeyword || 
      video.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
    const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(video.platform);
    const matchesShareStatus = selectedShareStatus.length === 0 || selectedShareStatus.includes(video.shareStatus);
    
    return matchesSearch && matchesCategory && matchesPlatform && matchesShareStatus;
  }).sort((a, b) => {
    if (sortBy === 'viewCount') {
      return (b.viewCount || 0) - (a.viewCount || 0);
    } else if (sortBy === 'createdAt') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === 'duration') {
      return (b.duration || 0) - (a.duration || 0); // 長到短
    } else { // title
      return a.title.localeCompare(b.title);
    }
  });

  const videosByCategory = categories?.reduce((acc, category) => {
    acc[category.key] = filteredVideos?.filter(v => v.category === category.key) || [];
    return acc;
  }, {} as Record<string, Video[]>);

  const handleEdit = (video: Video) => {
    setLocation(`/manage?id=${video.id}`);
  };

  const handleDelete = async (video: Video) => {
    if (!confirm(`確定要刪除影片「${video.title}」嗎？`)) return;
    deleteMutation.mutate({ id: video.id });
  };

  if (categoriesLoading || videosLoading || (selectedTagIds.length > 0 && tagFilterLoading) || (isAiSearch && aiSearchLoading)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* AI 搜尋查詢條件卡片 */}
        {isAiSearch && parsedQuery && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Sparkles className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-emerald-900">AI 智慧搜尋結果</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedQuery.rating && (
                      <Badge variant="secondary" className="bg-white/80">
                        評分：{parsedQuery.rating.min || 1}-{parsedQuery.rating.max || 5} 星
                      </Badge>
                    )}
                    {parsedQuery.category && (
                      <Badge variant="secondary" className="bg-white/80">
                        分類：{categoryLabels[parsedQuery.category] || parsedQuery.category}
                      </Badge>
                    )}
                    {parsedQuery.platform && (
                      <Badge variant="secondary" className="bg-white/80">
                        平台：{parsedQuery.platform === 'youtube' ? 'YouTube' : parsedQuery.platform === 'tiktok' ? '抖音' : '小紅書'}
                      </Badge>
                    )}
                    {parsedQuery.shareStatus && (
                      <Badge variant="secondary" className="bg-white/80">
                        分享狀態：{parsedQuery.shareStatus === 'public' ? '公開' : '私人'}
                      </Badge>
                    )}
                    {parsedQuery.tags && parsedQuery.tags.length > 0 && (
                      <Badge variant="secondary" className="bg-white/80">
                        標籤：{parsedQuery.tags.join(', ')}
                      </Badge>
                    )}
                    {parsedQuery.keywords && parsedQuery.keywords.length > 0 && (
                      <Badge variant="secondary" className="bg-white/80">
                        關鍵字：{parsedQuery.keywords.join(', ')}
                      </Badge>
                    )}
                    {parsedQuery.sortBy && (
                      <Badge variant="secondary" className="bg-white/80">
                        排序：{parsedQuery.sortBy === 'rating' ? '評分' : parsedQuery.sortBy === 'viewCount' ? '觀看次數' : parsedQuery.sortBy === 'createdAt' ? '建立時間' : '標題'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-emerald-700">
                    共找到 <span className="font-semibold">{aiSearchResult?.total || 0}</span> 部影片
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/board')}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {/* Search & Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋影片標題或描述..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              卡片
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              清單
            </Button>
          </div>

          {/* Sort Selector */}
          <Select value={sortBy} onValueChange={(value: 'viewCount' | 'createdAt' | 'title' | 'rating' | 'duration') => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewCount">熱門度（點擊數）</SelectItem>
              <SelectItem value="rating">評分（高到低）</SelectItem>
              <SelectItem value="duration">影片長度（長到短）</SelectItem>
              <SelectItem value="createdAt">建立時間</SelectItem>
              <SelectItem value="title">標題（A-Z）</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                平台
                {selectedPlatforms.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedPlatforms.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">選擇平台</h4>
                  {selectedPlatforms.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPlatforms([])}
                    >
                      清除
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {[{ value: 'youtube', label: 'YouTube' }, { value: 'tiktok', label: '抖音' }, { value: 'redbook', label: '小紅書' }].map(platform => (
                    <div key={platform.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`platform-${platform.value}`}
                        checked={selectedPlatforms.includes(platform.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform.value]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.value));
                          }
                        }}
                      />
                      <Label htmlFor={`platform-${platform.value}`} className="flex-1 cursor-pointer">
                        {platform.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Share Status Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                分享狀態
                {selectedShareStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedShareStatus.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">選擇分享狀態</h4>
                  {selectedShareStatus.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedShareStatus([])}
                    >
                      清除
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {[{ value: 'private', label: '私人（僅內部看板）' }, { value: 'public', label: '公開（客戶專區）' }].map(status => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={selectedShareStatus.includes(status.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedShareStatus([...selectedShareStatus, status.value]);
                          } else {
                            setSelectedShareStatus(selectedShareStatus.filter(s => s !== status.value));
                          }
                        }}
                      />
                      <Label htmlFor={`status-${status.value}`} className="flex-1 cursor-pointer">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Tag Filter */}
          <Popover open={tagFilterOpen} onOpenChange={setTagFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Tag className="h-4 w-4" />
                標籤篩選
                {selectedTagIds.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTagIds.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">選擇標籤</h4>
                  {selectedTagIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTagIds([])}
                    >
                      清除
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {allTags?.map(tag => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTagIds([...selectedTagIds, tag.id]);
                          } else {
                            setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                        >
                          {tag.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {tag.tagType === "PRODUCT_CODE" ? "商品編號" : "關鍵字"}
                        </span>
                      </Label>
                    </div>
                  ))}
                  {!allTags || allTags.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      尚無標籤
                    </p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Selected Tags Display */}
          {selectedTagIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedTagIds.map(tagId => {
                const tag = allTags?.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                  <Badge
                    key={tagId}
                    variant="secondary"
                    className="gap-1 pr-1"
                    style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                  >
                    {tag.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSelectedTagIds(selectedTagIds.filter(id => id !== tagId))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            {categories?.map(category => (
              <TabsTrigger key={category.key} value={category.key}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {viewMode === 'card' ? (
              <>
                {categories?.map(category => {
                  const videos = videosByCategory?.[category.key] || [];
                  if (videos.length === 0) return null;
                  
                  return (
                    <div key={category.key} className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {videos.map(video => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            showActions
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {filteredVideos?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    沒有找到符合條件的影片
                  </div>
                )}
              </>
            ) : (
              <VideoListView
                videos={filteredVideos || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions
              />
            )}
          </TabsContent>

          {categories?.map(category => (
            <TabsContent key={category.key} value={category.key} className="mt-6">
              {viewMode === 'card' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {videosByCategory?.[category.key]?.map(video => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        showActions
                      />
                    ))}
                  </div>
                  {videosByCategory?.[category.key]?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      此分類尚無影片
                    </div>
                  )}
                </>
              ) : (
                <VideoListView
                  videos={videosByCategory?.[category.key] || []}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showActions
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
