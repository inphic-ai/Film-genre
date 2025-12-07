import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Save, Sparkles, Wand2, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { TagSelector } from "@/components/TagSelector";
import { BatchImportDialog } from "@/components/BatchImportDialog";

export default function Manage() {
  const [, setLocation] = useLocation();
  const [videoId, setVideoId] = useState<number | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState<string>("");
  const [productId, setProductId] = useState("");
  const [shareStatus, setShareStatus] = useState<"private" | "public">("private");
  const [selectedTags, setSelectedTags] = useState<Array<{ id: number; name: string; tagType: string; color?: string }>>([]);
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateVideo, setDuplicateVideo] = useState<any>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isFetchingThumbnail, setIsFetchingThumbnail] = useState(false);
  const [autoFetchedThumbnail, setAutoFetchedThumbnail] = useState<string | null>(null);
  const [thumbnailFetchError, setThumbnailFetchError] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [autoFetchedMetadata, setAutoFetchedMetadata] = useState<{ title: string; authorName: string; thumbnailUrl: string; platform: string } | null>(null);
  const [metadataFetchError, setMetadataFetchError] = useState(false);
  const [isBatchImportDialogOpen, setIsBatchImportDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: existingVideo } = trpc.videos.getById.useQuery(
    { id: videoId! },
    { enabled: !!videoId }
  );
  const { data: existingTags } = trpc.videoTags.getVideoTags.useQuery(
    { videoId: videoId! },
    { enabled: !!videoId }
  );

  const addTagMutation = trpc.videoTags.addTag.useMutation();
  const removeTagMutation = trpc.videoTags.removeTag.useMutation();

  // Check duplicate video by URL
  const checkDuplicateQuery = trpc.videos.checkDuplicate.useQuery(
    { videoUrl },
    {
      enabled: false, // Manual trigger only
    }
  );

  const createMutation = trpc.videos.create.useMutation({
    onSuccess: async (video) => {
      // Add tags to the newly created video
      if (selectedTags.length > 0) {
        try {
          for (const tag of selectedTags) {
            await addTagMutation.mutateAsync({
              videoId: video.id,
              tagId: tag.id,
              weight: 1,
            });
          }
        } catch (error) {
          console.error("Failed to add tags:", error);
        }
      }
      toast.success("影片新增成功！");
      setLocation("/board");
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.videos.update.useMutation({
    onSuccess: async () => {
      // Update tags for the video
      if (videoId && existingTags) {
        try {
          // Find tags to remove
          const tagsToRemove = existingTags.filter(
            (et: { id: number }) => !selectedTags.some(st => st.id === et.id)
          );
          // Find tags to add
          const tagsToAdd = selectedTags.filter(
            st => !existingTags.some((et: { id: number }) => et.id === st.id)
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
        } catch (error) {
          console.error("Failed to update tags:", error);
        }
      }
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

  const uploadThumbnailMutation = trpc.videos.uploadThumbnail.useMutation({
    onSuccess: (data) => {
      setCustomThumbnailUrl(data.url);
      setThumbnailUrl(data.url);
      toast.success("縮圖上傳成功！");
    },
    onError: (error) => {
      toast.error(`縮圖上傳失敗：${error.message}`);
    },
  });

  const deleteThumbnailMutation = trpc.videos.deleteThumbnail.useMutation({
    onSuccess: () => {
      setCustomThumbnailUrl(null);
      setThumbnailUrl("");
      toast.success("縮圖已刪除！");
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
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
      setProductId(existingVideo.productId || "");
      setShareStatus(existingVideo.shareStatus || "private");
      // @ts-ignore - customThumbnailUrl may exist in existingVideo
      setCustomThumbnailUrl(existingVideo.customThumbnailUrl || null);
      // Tags will be loaded by TagSelector component
    }
  }, [existingVideo]);

  // Check for duplicate video when videoUrl changes (with debounce)
  useEffect(() => {
    // Skip duplicate check if editing existing video or URL is empty
    if (videoId || !videoUrl || videoUrl.length < 10) {
      return;
    }

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch {
      return; // Invalid URL, skip check
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const result = await checkDuplicateQuery.refetch();
        if (result.data?.isDuplicate && result.data?.video) {
          setDuplicateVideo(result.data.video);
          setIsDuplicateDialogOpen(true);
        }
      } catch (error) {
        console.error('Failed to check duplicate:', error);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [videoUrl, videoId, checkDuplicateQuery]);

  // Auto-fetch thumbnail and metadata when videoUrl changes (with debounce)
  useEffect(() => {
    // Skip if editing existing video or URL is empty
    if (videoId || !videoUrl || videoUrl.length < 10) {
      return;
    }

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch {
      return; // Invalid URL, skip fetch
    }

    // Reset states
    setAutoFetchedThumbnail(null);
    setThumbnailFetchError(false);
    setAutoFetchedMetadata(null);
    setMetadataFetchError(false);

    const timer = setTimeout(async () => {
      setIsFetchingThumbnail(true);
      setIsFetchingMetadata(true);
      
      // Fetch thumbnail and metadata in parallel
      const [thumbnailResult, metadataResult] = await Promise.allSettled([
        utils.client.videos.fetchThumbnail.query({ videoUrl }),
        utils.client.videos.fetchMetadata.query({ videoUrl }),
      ]);
      
      // Handle thumbnail result
      if (thumbnailResult.status === 'fulfilled' && thumbnailResult.value?.thumbnailUrl) {
        setAutoFetchedThumbnail(thumbnailResult.value.thumbnailUrl);
        setThumbnailUrl(thumbnailResult.value.thumbnailUrl); // Auto-fill thumbnailUrl field
        setThumbnailFetchError(false);
      } else {
        console.error('Failed to fetch thumbnail:', thumbnailResult.status === 'rejected' ? thumbnailResult.reason : 'No thumbnail');
        setThumbnailFetchError(true);
      }
      
      // Handle metadata result
      if (metadataResult.status === 'fulfilled' && metadataResult.value) {
        setAutoFetchedMetadata(metadataResult.value);
        // Auto-fill title if empty
        if (!title && metadataResult.value.title) {
          setTitle(metadataResult.value.title);
        }
        setMetadataFetchError(false);
      } else {
        console.error('Failed to fetch metadata:', metadataResult.status === 'rejected' ? metadataResult.reason : 'No metadata');
        setMetadataFetchError(true);
      }
      
      setIsFetchingThumbnail(false);
      setIsFetchingMetadata(false);
    }, 1500); // 1.5 second debounce (slightly longer than duplicate check)

    return () => clearTimeout(timer);
  }, [videoUrl, videoId, utils, title]);

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
      productId: productId || undefined,
      shareStatus,
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

  const handleSuggestTags = async () => {
    if (!title) {
      toast.error("請先輸入影片標題");
      return;
    }
    
    try {
      const result = await utils.client.videos.suggestTags.mutate({ title, description });
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        // Add suggested tags to selected tags (avoid duplicates)
        const newTags = result.suggestedTags.filter(
          (st: { id: number }) => !selectedTags.some(t => t.id === st.id)
        );
        setSelectedTags([...selectedTags, ...newTags]);
        toast.success(`已新增 ${newTags.length} 個 AI 建議標籤！`);
      } else {
        toast.info("沒有找到適合的標籤建議");
      }
    } catch (error) {
      console.error('Failed to suggest tags:', error);
      toast.error("標籤建議失敗，請稍後再試！");
    }
  };

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案！');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('圖片大小不能超過 5MB！');
      return;
    }

    if (!videoId) {
      toast.error('請先儲存影片後再上傳縮圖！');
      return;
    }

    setIsUploadingThumbnail(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await uploadThumbnailMutation.mutateAsync({
          videoId,
          imageData: base64,
        });
        setIsUploadingThumbnail(false);
      };
      reader.onerror = () => {
        toast.error('讀取檔案失敗！');
        setIsUploadingThumbnail(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingThumbnail(false);
    }
  };

  const handleDeleteThumbnail = async () => {
    if (!videoId) return;
    await deleteThumbnailMutation.mutateAsync({ videoId });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isAiLoading = generateThumbnailMutation.isPending || suggestCategoryMutation.isPending;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
          {!videoId && (
            <Button
              variant="outline"
              onClick={() => setIsBatchImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              批次匯入
            </Button>
          )}
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
                <Label htmlFor="title">
                  影片標題 *
                  {isFetchingMetadata && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                      抓取資訊中...
                    </span>
                  )}
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="請輸入影片標題"
                  required
                />
                {autoFetchedMetadata && (
                  <p className="text-sm text-green-600">
                    ✅ 影片資訊已自動帶入（可手動修改）
                  </p>
                )}
                {metadataFetchError && (
                  <p className="text-sm text-amber-600">
                    ⚠️ 無法自動抓取影片資訊，請手動輸入
                  </p>
                )}
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
                <Label htmlFor="videoUrl">
                  影片連結 *
                  {isCheckingDuplicate && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                      檢查重複中...
                    </span>
                  )}
                  {isFetchingThumbnail && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                      抓取縮圖中...
                    </span>
                  )}
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
                {autoFetchedThumbnail && (
                  <p className="text-sm text-green-600">
                    ✅ 縮圖已自動抓取（可手動上傳覆蓋）
                  </p>
                )}
                {thumbnailFetchError && (
                  <p className="text-sm text-amber-600">
                    ⚠️ 無法自動抓取縮圖，請手動上傳
                  </p>
                )}
              </div>

              {/* Product ID */}
              <div className="space-y-2">
                <Label htmlFor="productId">商品編號</Label>
                <Input
                  id="productId"
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="例：P-12345 (選填)"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>標籤</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSuggestTags}
                    disabled={isAiLoading || !title}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 建議標籤
                  </Button>
                </div>
                <TagSelector
                  videoId={videoId || undefined}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  maxTags={5}
                />
              </div>

              {/* Share Status */}
              <div className="space-y-2">
                <Label htmlFor="shareStatus">分享狀態</Label>
                <Select value={shareStatus} onValueChange={(value) => setShareStatus(value as "private" | "public")}>
                  <SelectTrigger id="shareStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">私人（僅內部看板）</SelectItem>
                    <SelectItem value="public">公開（客戶專區可見）</SelectItem>
                  </SelectContent>
                </Select>
                {platform !== "youtube" && shareStatus === "public" && (
                  <p className="text-sm text-amber-600">
                    ⚠️ 注意：僅 YouTube 影片可在客戶專區分享
                  </p>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="thumbnailUrl">影片縮圖</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateThumbnail}
                      disabled={isAiLoading || !title}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      AI 生成
                    </Button>
                    {videoId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUploadingThumbnail}
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                      >
                        {isUploadingThumbnail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            上傳中...
                          </>
                        ) : (
                          "上傳縮圖"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadThumbnail}
                />
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://... (選填，或使用 AI 生成 / 上傳縮圖)"
                  disabled={isAiLoading || isUploadingThumbnail}
                />
                {thumbnailUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border relative group">
                    <img
                      src={thumbnailUrl}
                      alt="縮圖預覽"
                      className="w-full aspect-video object-cover"
                    />
                    {customThumbnailUrl && videoId && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        >
                          換圖
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteThumbnail}
                        >
                          刪除
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {!videoId && (
                  <p className="text-sm text-muted-foreground">
                    ℹ️ 請先儲存影片後才能上傳自訂縮圖
                  </p>
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

      {/* Duplicate Video Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>⚠️ 偵測到重複影片</DialogTitle>
            <DialogDescription>
              這個影片連結已經存在於系統中，請確認是否要繼續新增。
            </DialogDescription>
          </DialogHeader>
          
          {duplicateVideo && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {duplicateVideo.customThumbnailUrl || duplicateVideo.thumbnailUrl ? (
                    <img
                      src={duplicateVideo.customThumbnailUrl || duplicateVideo.thumbnailUrl}
                      alt={duplicateVideo.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-24 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      無縮圖
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{duplicateVideo.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      平台：{duplicateVideo.platform === 'youtube' ? 'YouTube' : duplicateVideo.platform === 'tiktok' ? '抖音' : '小紅書'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      建立時間：{new Date(duplicateVideo.createdAt).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                如果您確定要新增這個影片，請修改影片連結或取消新增。
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDuplicateDialogOpen(false);
                setVideoUrl(""); // Clear the URL
              }}
            >
              清除連結
            </Button>
            <Button
              type="button"
              onClick={() => setIsDuplicateDialogOpen(false)}
            >
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Import Dialog */}
      <BatchImportDialog
        open={isBatchImportDialogOpen}
        onOpenChange={setIsBatchImportDialogOpen}
        onImportComplete={() => {
          toast.success('影片匯入完成！');
          // Optionally navigate to board or refresh
        }}
      />
    </DashboardLayout>
  );
}
