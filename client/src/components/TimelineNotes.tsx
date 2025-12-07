import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Image as ImageIcon, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { useAuth } from '@/_core/hooks/useAuth';

interface TimelineNotesProps {
  videoId: number;
  currentTime: number;
  onSeek?: (timeSeconds: number) => void;
}

export function TimelineNotes({ videoId, currentTime, onSeek }: TimelineNotesProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageBase64List, setImageBase64List] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: notes = [], isLoading } = trpc.timelineNotes.getByVideoId.useQuery({ videoId });
  
  const uploadImagesMutation = trpc.videos.uploadImagesToR2.useMutation();
  
  const createMutation = trpc.timelineNotes.create.useMutation({
    onSuccess: () => {
      utils.timelineNotes.getByVideoId.invalidate({ videoId });
      setContent('');
      setImageBase64List([]);
      setIsAdding(false);
    },
  });

  const deleteMutation = trpc.timelineNotes.delete.useMutation({
    onSuccess: () => {
      utils.timelineNotes.getByVideoId.invalidate({ videoId });
    },
  });

  const approveMutation = trpc.timelineNotes.approve.useMutation({
    onSuccess: () => {
      utils.timelineNotes.getByVideoId.invalidate({ videoId });
    },
  });

  const rejectMutation = trpc.timelineNotes.reject.useMutation({
    onSuccess: () => {
      utils.timelineNotes.getByVideoId.invalidate({ videoId });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddNote = async () => {
    if (!content.trim()) return;
    
    setIsUploading(true);
    try {
      let uploadedUrls: string[] | undefined;
      
      // Upload images to R2 if any
      if (imageBase64List.length > 0) {
        const result = await uploadImagesMutation.mutateAsync({
          images: imageBase64List,
          folder: 'timeline-notes',
        });
        uploadedUrls = result.urls;
      }
      
      // Create note with uploaded image URLs
      createMutation.mutate({
        videoId,
        timeSeconds: Math.floor(currentTime),
        content,
        imageUrls: uploadedUrls,
      });
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('圖片上傳失敗，請重試');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (noteId: number) => {
    if (confirm('確定要刪除此筆記？')) {
      deleteMutation.mutate({ id: noteId });
    }
  };

  const handleApprove = (noteId: number) => {
    approveMutation.mutate({ id: noteId });
  };

  const handleReject = (noteId: number) => {
    const reason = prompt('請輸入拒絕原因：');
    if (reason) {
      rejectMutation.mutate({ id: noteId, reason });
    }
  };

  const handleImagesChange = (base64Images: string[]) => {
    setImageBase64List(base64Images);
  };

  const removeImage = (index: number) => {
    setImageBase64List(prev => prev.filter((_, i) => i !== index));
  };

  // Filter notes based on user role
  const visibleNotes = notes.filter(note => {
    if (user?.role === 'admin') return true; // Admin sees all
    if (user?.role === 'staff') return note.status !== 'REJECTED'; // Staff sees PENDING + APPROVED
    return note.status === 'APPROVED'; // Viewer sees only APPROVED
  });

  const sortedNotes = [...visibleNotes].sort((a, b) => a.timeSeconds - b.timeSeconds);

  if (isLoading) {
    return <div className="text-center py-8">載入筆記中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">時間軸筆記</h3>
        {user && user.role !== 'viewer' && !isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            新增筆記
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatTime(currentTime)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="輸入筆記內容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            
            {/* Image Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                <span>上傳圖片（選填）</span>
              </div>
              <ImageUpload 
                onImagesChange={handleImagesChange}
                initialImages={imageBase64List}
                maxImages={5} 
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddNote}
                disabled={!content.trim() || createMutation.isPending || isUploading}
                size="sm"
              >
                {isUploading ? '上傳圖片中...' : createMutation.isPending ? '儲存中...' : '儲存'}
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setContent('');
                  setImageBase64List([]);
                }}
                variant="outline"
                size="sm"
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {sortedNotes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              尚無筆記
            </CardContent>
          </Card>
        ) : (
          sortedNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSeek?.(note.timeSeconds)}
                      className="font-mono text-primary hover:text-primary/80"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime(note.timeSeconds)}
                    </Button>
                    
                    {/* Status Badge */}
                    {note.status === 'PENDING' && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        待審核
                      </Badge>
                    )}
                    {note.status === 'REJECTED' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        已拒絕
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Admin Actions */}
                    {user?.role === 'admin' && note.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(note.id)}
                          disabled={approveMutation.isPending}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(note.id)}
                          disabled={rejectMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Delete Button (owner or admin) */}
                    {user && (note.userId === user.id || user.role === 'admin') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(note.id)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                
                {/* Images */}
                {note.imageUrls && note.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {note.imageUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-32 h-32 object-cover rounded border hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* Reject Reason */}
                {note.status === 'REJECTED' && note.rejectReason && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                    <strong>拒絕原因：</strong> {note.rejectReason}
                  </div>
                )}

                {/* Author & Date */}
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{note.userName || note.userEmail}</span>
                  <span>•</span>
                  <span>{new Date(note.createdAt).toLocaleString('zh-TW')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
