import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Video, Users, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-4 bg-primary rounded-full">
              <Video className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            影片知識庫系統
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            專業的影片管理與分享平台，實現內外分流的智能管理
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Client Portal Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setLocation('/portal')}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">客戶自助專區</CardTitle>
              </div>
              <CardDescription className="text-base">
                公開的教學影片庫，僅顯示 YouTube 平台影片
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>✓ 瀏覽所有 YouTube 教學影片</li>
                <li>✓ 依分類快速查找</li>
                <li>✓ 關鍵字搜尋功能</li>
                <li>✓ 無需登入即可使用</li>
              </ul>
              <Button className="w-full" size="lg">
                進入客戶專區
              </Button>
            </CardContent>
          </Card>

          {/* Internal Board Card */}
          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => {
            if (user) {
              setLocation('/board');
            } else {
              window.location.href = getLoginUrl();
            }
          }}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                  <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-2xl">內部管理看板</CardTitle>
              </div>
              <CardDescription className="text-base">
                管理員專用，管理所有平台的影片資源
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>✓ 管理所有平台影片（YouTube/抖音/小紅書）</li>
                <li>✓ 新增、編輯、刪除影片</li>
                <li>✓ AI 自動生成縮圖</li>
                <li>✓ AI 智能分類建議</li>
              </ul>
              <Button className="w-full" variant="outline" size="lg">
                {user ? '進入管理看板' : '登入後使用'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">核心功能</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="font-semibold">內外分流</h3>
              <p className="text-sm text-muted-foreground">
                內部看板顯示所有平台，客戶專區僅顯示 YouTube
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="font-semibold">AI 輔助</h3>
              <p className="text-sm text-muted-foreground">
                自動生成縮圖、智能分類建議
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="font-semibold">快速搜尋</h3>
              <p className="text-sm text-muted-foreground">
                依分類、平台、關鍵字快速定位影片
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        {user && (
          <div className="text-center text-sm text-muted-foreground">
            <p>歡迎回來，{user.name || '使用者'} ({user.role === 'admin' ? '管理員' : '一般使用者'})</p>
          </div>
        )}
      </div>
    </div>
  );
}
