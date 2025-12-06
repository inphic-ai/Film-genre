import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { VideoCard } from "@/components/VideoCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Youtube } from "lucide-react";
import type { Video } from "../../../drizzle/schema";

export default function Portal() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const { data: youtubeVideos, isLoading: videosLoading } = trpc.videos.listYouTube.useQuery();

  const filteredVideos = youtubeVideos?.filter(video => {
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

  if (categoriesLoading || videosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-red-500 rounded-full">
              <Youtube className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              線上教學影片庫
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            歡迎使用我們的教學影片資源庫，這裡收錄了各類產品使用教學、維修指南與常見問題解答
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="搜尋影片標題或描述..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-12 h-12 text-base bg-white dark:bg-gray-800 shadow-sm"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">全部影片</TabsTrigger>
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
                  <div key={category.key} className="mb-10">
                    <div className="mb-4 pb-2 border-b">
                      <h2 className="text-2xl font-semibold">{category.name}</h2>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {videos.map(video => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          showActions={false}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredVideos?.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-lg text-muted-foreground">
                    沒有找到符合條件的影片
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    請嘗試使用其他關鍵字搜尋
                  </p>
                </div>
              )}
            </TabsContent>

            {categories?.map(category => (
              <TabsContent key={category.key} value={category.key} className="mt-6">
                <div className="mb-4">
                  {category.description && (
                    <p className="text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videosByCategory?.[category.key]?.map(video => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      showActions={false}
                    />
                  ))}
                </div>
                {videosByCategory?.[category.key]?.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📹</div>
                    <p className="text-lg text-muted-foreground">
                      此分類尚無影片
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      我們會持續更新更多教學內容
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>如有任何問題，歡迎隨時與我們聯繫</p>
        </div>
      </div>
    </div>
  );
}
