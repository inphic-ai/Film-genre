/**
 * Video Suggestions Types
 * 影片建議系統的型別定義
 */

export type SuggestionPriority = "LOW" | "MEDIUM" | "HIGH";
export type SuggestionStatus = "PENDING" | "READ" | "RESOLVED";

export interface Suggestion {
  id: number;
  videoId: number;
  userId: number;
  title: string;
  content: string;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields from user table
  userName?: string;
  userEmail?: string;
}

export interface SuggestionFormData {
  title: string;
  content: string;
  priority: SuggestionPriority;
}

export interface SuggestionFilters {
  priority?: SuggestionPriority;
  status?: SuggestionStatus;
}

export interface SuggestionListProps {
  videoId: number;
}

export interface SuggestionCardProps {
  suggestion: Suggestion;
  currentUserId?: number;
  currentUserRole?: "admin" | "staff" | "viewer";
  onEdit?: (suggestion: Suggestion) => void;
  onDelete?: (suggestionId: number) => void;
  onStatusUpdate?: (suggestionId: number, status: SuggestionStatus) => void;
}

export interface AddSuggestionFormProps {
  videoId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Priority labels and colors
export const PRIORITY_CONFIG: Record<
  SuggestionPriority,
  { label: string; color: string; bgColor: string }
> = {
  LOW: {
    label: "低優先級",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  MEDIUM: {
    label: "中優先級",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  HIGH: {
    label: "高優先級",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
};

// Status labels and colors
export const STATUS_CONFIG: Record<
  SuggestionStatus,
  { label: string; color: string; bgColor: string }
> = {
  PENDING: {
    label: "待處理",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  READ: {
    label: "已讀",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  RESOLVED: {
    label: "已解決",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
};
