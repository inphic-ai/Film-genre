import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { AddSuggestionFormProps, SuggestionPriority } from "./types";

export function AddSuggestionForm({
  videoId,
  onSuccess,
  onCancel,
}: AddSuggestionFormProps) {
  // Use sonner toast for notifications
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "MEDIUM" as SuggestionPriority,
  });

  const [errors, setErrors] = useState({
    title: "",
    content: "",
  });

  // Create suggestion mutation
  const createMutation = trpc.videoSuggestions.create.useMutation({
    onSuccess: () => {
      toast.success("建議已提交", {
        description: "您的建議已成功提交，感謝您的回饋！",
      });
      
      // Invalidate queries to refresh the list
      utils.videoSuggestions.listByVideo.invalidate();
      utils.videoSuggestions.getCount.invalidate();
      
      // Reset form
      setFormData({
        title: "",
        content: "",
        priority: "MEDIUM",
      });
      setErrors({ title: "", content: "" });
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error("提交失敗", {
        description: error.message || "提交建議時發生錯誤，請稍後再試",
      });
    },
  });

  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      title: "",
      content: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = "請輸入建議標題";
    } else if (formData.title.length > 255) {
      newErrors.title = "標題不得超過 255 個字元";
    }

    if (!formData.content.trim()) {
      newErrors.content = "請輸入建議內容";
    }

    setErrors(newErrors);
    return !newErrors.title && !newErrors.content;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createMutation.mutate({
      videoId,
      title: formData.title.trim(),
      content: formData.content.trim(),
      priority: formData.priority,
    });
  };

  // Handle input change
  const handleChange = (
    field: "title" | "content",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>提交建議</CardTitle>
          <CardDescription>
            發現影片有需要改進的地方？歡迎提出您的建議！
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="suggestion-title">
              建議標題 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="suggestion-title"
              placeholder="例如：建議改進影片音質"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              maxLength={255}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
            <p className="text-sm text-gray-500">
              {formData.title.length}/255 字元
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="suggestion-content">
              建議內容 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="suggestion-content"
              placeholder="請詳細描述您的建議..."
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={5}
              className={errors.content ? "border-red-500" : ""}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="suggestion-priority">優先級</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: value as SuggestionPriority,
                }))
              }
            >
              <SelectTrigger id="suggestion-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">低優先級</SelectItem>
                <SelectItem value="MEDIUM">中優先級</SelectItem>
                <SelectItem value="HIGH">高優先級</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              選擇建議的重要程度，幫助我們優先處理重要問題
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createMutation.isPending}
            >
              取消
            </Button>
          )}
          <Button
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            提交建議
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
