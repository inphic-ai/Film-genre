import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface AISearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISearchDialog({ open, onOpenChange }: AISearchDialogProps) {
  const [query, setQuery] = useState('');
  const [, setLocation] = useLocation();
  const parseQueryMutation = trpc.aiSearch.parseQuery.useMutation();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('請輸入搜尋查詢');
      return;
    }

    try {
      // 解析查詢
      const parsedQuery = await parseQueryMutation.mutateAsync({ query: query.trim() });
      
      console.log('✅ AI 搜尋解析結果:', parsedQuery);
      
      // 導航到 Board 頁面並傳遞解析結果
      const searchParams = new URLSearchParams();
      searchParams.set('aiSearch', 'true');
      searchParams.set('parsedQuery', JSON.stringify(parsedQuery));
      
      setLocation(`/board?${searchParams.toString()}`);
      
      // 關閉對話框並清空輸入
      onOpenChange(false);
      setQuery('');
      
      toast.success('查詢解析成功！');
    } catch (error) {
      console.error('❌ AI 搜尋失敗:', error);
      toast.error('無法解析查詢，請嘗試更具體的描述');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            AI 智慧搜尋
          </DialogTitle>
          <DialogDescription>
            使用自然語言描述您想找的影片，AI 會自動解析並搜尋相關內容
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="ai-search-input" className="text-sm font-medium text-slate-700">
              搜尋查詢
            </label>
            <Input
              id="ai-search-input"
              type="text"
              placeholder="例如：找評分 4 星以上的維修影片"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11"
              autoFocus
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700">範例查詢：</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• 找評分 4 星以上的影片</li>
              <li>• 搜尋抖音平台的使用介紹影片</li>
              <li>• 找最新上傳的 YouTube 影片</li>
              <li>• 搜尋維修相關的影片</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={parseQueryMutation.isPending}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={parseQueryMutation.isPending || !query.trim()}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {parseQueryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  搜尋
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
