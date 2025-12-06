import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, Sparkles, Wand2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Manage() {
  const [, setLocation] = useLocation();
  const [videoId, setVideoId] = useState<number | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState<string>("");

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: existingVideo } = trpc.videos.getById.useQuery(
    { id: videoId! },
    { enabled: !!videoId }
  );

  const createMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("影片新增成功！");
      setLocation("/board");
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.videos.update.useMutation({
    onSuccess: () => {
      toast.success("影片更新成功！");
      setLocation("/board");
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const generateThumbnailMutation = trpc.ai.generateThumbnail.useMutation({
    onSuccess: (data) => {
      setThumbnailUrl(data.thumbnailUrl);
      toast.success("縮圖生成成功！");
    },
    onError: (error) => {
      toast.error(`縮圖生成失敗：${error.message}`);
    },
  });

  const suggestCategoryMutation = trpc.ai.suggestCategory.useMutation({
    onSuccess: (data) => {
      setCategory(data.category);
      toast.success("已自動建議分類！");
    },
    onError: (error) => {
      toast.error(`分類建議失敗：${error.message}`);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setVideoId(parseInt(id));
    }
  }, []);

  useEffect(() => {
    if (existingVideo) {
      setTitle(existingVideo.title);
      setDescription(existingVideo.description || "");
      setPlatform(existingVideo.platform);
      setVideoUrl(existingVideo.videoUrl);
      setThumbnailUrl(existingVideo.thumbnailUrl || "");
      setCategory(existingVideo.category);
    }
  }, [existingVideo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !platform || !videoUrl || !category) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    const data = {
      title,
      description: description || undefined,
      platform: platform as "youtube" | "tiktok" | "redbook",
      videoUrl,
      thumbnailUrl: thumbnailUrl || undefined,
      category: category as "product_intro" | "maintenance" | "case_study" | "faq" | "other",
    };

    if (videoId) {
      updateMutation.mutate({ id: videoId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleGenerateThumbnail = () => {
    if (!title) {
      toast.error("請先輸入影片標題");
      return;
    }
    generateThumbnailMutation.mutate({ title });
  };

  const handleSuggestCategory = () => {
    if (!title) {
      toast.error("請先輸入影片標題");
      return;
    }
    suggestCategoryMutation.mutate({ title, description });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isAiLoading = generateThumbnailMutation.isPending || suggestCategoryMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/board")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {videoId ? "編輯影片" : "新增影片"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {videoId ? "更新影片資訊" : "新增影片到知識庫"}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>影片資訊</CardTitle>
            <CardDescription>
              請填寫影片的基本資訊，標示 * 為必填欄位
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">影片標題 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="請輸入影片標題"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">影片描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="請輸入影片描述（選填）"
                  rows={4}
                />
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label htmlFor="platform">影片平台 *</Label>
                <Select value={platform} onValueChange={setPlatform} required>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="請選擇影片平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">抖音</SelectItem>
                    <SelectItem value="redbook">小紅書</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">分類 *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSuggestCategory}
                    disabled={isAiLoading || !title}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 建議
                  </Button>
                </div>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="請選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Video URL */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl">影片連結 *</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="thumbnailUrl">縮圖連結</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateThumbnail}
                    disabled={isAiLoading || !title}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI 生成縮圖
                  </Button>
                </div>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://... (選填，可使用 AI 自動生成)"
                  disabled={isAiLoading}
                />
                {thumbnailUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img
                      src={thumbnailUrl}
                      alt="縮圖預覽"
                      className="w-full aspect-video object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {videoId ? "更新影片" : "新增影片"}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/board")}
                  disabled={isLoading}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
