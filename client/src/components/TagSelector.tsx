import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { X, Plus, Tag, Package } from "lucide-react";
import { toast } from "sonner";

interface TagSelectorProps {
  videoId?: number;
  selectedTags: Array<{ id: number; name: string; tagType: string; color?: string }>;
  onTagsChange: (tags: Array<{ id: number; name: string; tagType: string; color?: string }>) => void;
  maxTags?: number;
}

export function TagSelector({ videoId, selectedTags, onTagsChange, maxTags = 5 }: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all tags
  const { data: allTags } = trpc.tags.list.useQuery();

  // Fetch existing tags for the video (if editing)
  const { data: existingTags } = trpc.videoTags.getVideoTags.useQuery(
    { videoId: videoId! },
    { enabled: !!videoId }
  );

  // Load existing tags when editing
  useEffect(() => {
    if (existingTags && existingTags.length > 0 && selectedTags.length === 0) {
      onTagsChange(existingTags.map(t => ({
        id: t.id,
        name: t.name,
        tagType: t.tagType,
        color: t.color || undefined,
      })));
    }
  }, [existingTags, selectedTags.length, onTagsChange]);

  // Filter tags based on search query
  const filteredTags = allTags?.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedTags.some(st => st.id === tag.id)
  ) || [];

  // Check if input matches product code format (3 letters + 6 digits + a/b/c)
  const isProductCodeFormat = (input: string): boolean => {
    return /^[A-Z]{3}\d{6}[a-cA-C]$/i.test(input);
  };

  // Add tag
  const handleAddTag = (tag: { id: number; name: string; tagType: string; color?: string }) => {
    if (selectedTags.length >= maxTags) {
      toast.error(`最多只能選擇 ${maxTags} 個標籤`);
      return;
    }

    onTagsChange([...selectedTags, tag]);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Remove tag
  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  };

  // Create new tag from search input
  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: (newTag) => {
      handleAddTag({
        id: newTag.id,
        name: newTag.name,
        tagType: newTag.tagType,
        color: newTag.color || undefined,
      });
      toast.success(`標籤「${newTag.name}」已建立`);
    },
    onError: (error) => {
      toast.error(`建立標籤失敗：${error.message}`);
    },
  });

  const handleCreateNewTag = () => {
    if (!searchQuery.trim()) return;

    if (selectedTags.length >= maxTags) {
      toast.error(`最多只能選擇 ${maxTags} 個標籤`);
      return;
    }

    // Auto-detect tag type
    const tagType = isProductCodeFormat(searchQuery.trim()) ? "PRODUCT_CODE" : "KEYWORD";
    const color = tagType === "PRODUCT_CODE" ? "#F59E0B" : "#3B82F6";

    createTagMutation.mutate({
      name: searchQuery.trim(),
      tagType,
      color,
      description: tagType === "PRODUCT_CODE" ? "商品編號標籤" : "關鍵字標籤",
    });
  };

  // Get tag icon
  const getTagIcon = (tagType: string) => {
    return tagType === "PRODUCT_CODE" ? <Package className="h-3 w-3" /> : <Tag className="h-3 w-3" />;
  };

  // Get tag type label
  const getTagTypeLabel = (tagType: string) => {
    return tagType === "PRODUCT_CODE" ? "商品編號" : "關鍵字";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>標籤</Label>
        <span className="text-sm text-muted-foreground">
          {selectedTags.length} / {maxTags}
        </span>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
              style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
            >
              {getTagIcon(tag.tagType)}
              <span>{tag.name}</span>
              <span className="text-xs opacity-60">({getTagTypeLabel(tag.tagType)})</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder="搜尋或新增標籤..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          disabled={selectedTags.length >= maxTags}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && searchQuery && (
          <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
            <div className="p-2 space-y-1">
              {/* Existing tags */}
              {filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center gap-2"
                    onClick={() => handleAddTag({
                      id: tag.id,
                      name: tag.name,
                      tagType: tag.tagType,
                      color: tag.color || undefined,
                    })}
                  >
                    {getTagIcon(tag.tagType)}
                    <span>{tag.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {getTagTypeLabel(tag.tagType)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  找不到符合的標籤
                </div>
              )}

              {/* Create new tag option */}
              {searchQuery.trim() && !filteredTags.some(t => t.name.toLowerCase() === searchQuery.toLowerCase()) && (
                <button
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center gap-2 border-t"
                  onClick={handleCreateNewTag}
                  disabled={createTagMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                  <span>建立新標籤「{searchQuery}」</span>
                  {isProductCodeFormat(searchQuery.trim()) && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      商品編號
                    </Badge>
                  )}
                </button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Help Text */}
      <p className="text-sm text-muted-foreground">
        {isProductCodeFormat(searchQuery.trim()) && searchQuery.trim() && (
          <span className="text-amber-600">
            ⚡ 檢測到商品編號格式（英文3碼+數字6碼+a/b/c），將自動標記為商品編號標籤
          </span>
        )}
        {!searchQuery && selectedTags.length < maxTags && (
          <span>
            輸入標籤名稱搜尋或建立新標籤。商品編號格式（如 QJD002001A）會自動識別。
          </span>
        )}
        {selectedTags.length >= maxTags && (
          <span className="text-amber-600">
            已達到標籤上限（{maxTags} 個）
          </span>
        )}
      </p>
    </div>
  );
}
