import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { VideoCard } from "@/components/VideoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Loader2, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import type { Video } from "../../../drizzle/schema";

const categoryLabels: Record<string, string> = {
  product_intro: '使用介紹',
  maintenance: '維修',
  case_study: '案例',
  faq: '常見問題',
  other: '其他',
};

export default function Board() {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const { data: allVideos, isLoading: videosLoading } = trpc.videos.listAll.useQuery();
  const { data: allTags } = trpc.tags.list.useQuery();
  
  // Use smart score API when tags are selected
  const { data: tagFilteredVideos, isLoading: tagFilterLoading } = trpc.videos.searchByTags.useQuery(
    { tagIds: selectedTagIds },
    { enabled: selectedTagIds.length > 0 }
  );

  const deleteMutation = trpc.videos.delete.useMutation({
    onSuccess: () => {
      utils.videos.listAll.invalidate();
    },
  });

  // Use tag-filtered videos if tags are selected, otherwise use all videos
  const baseVideos = selectedTagIds.length > 0 ? tagFilteredVideos : allVideos;

  const filteredVideos = baseVideos?.filter(video => {
    const matchesSearch = !searchKeyword || 
      video.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
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

  if (categoriesLoading || videosLoading || (selectedTagIds.length > 0 && tagFilterLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">內部影片看板</h1>
            <p className="text-muted-foreground mt-1">
              管理所有平台的影片資源
            </p>
          </div>
          <Button onClick={() => setLocation('/manage')}>
            <Plus className="h-4 w-4 mr-2" />
            新增影片
          </Button>
        </div>

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
          </TabsContent>

          {categories?.map(category => (
            <TabsContent key={category.key} value={category.key} className="mt-6">
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
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
