import { Button } from "@/components/ui/button";
import { Film, Users, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">影片知識庫系統</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/portal")}>
              <Users className="w-4 h-4 mr-2" />
              客戶專區
            </Button>
            <Button onClick={() => setLocation("/login")}>
              <Shield className="w-4 h-4 mr-2" />
              管理員登入
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              內外分流的影片知識庫
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              內部看板整合所有平台資源，客戶專區僅分享 YouTube 影片，實現專業的知識管理與客戶服務
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <Shield className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">內部看板</h3>
              <p className="text-muted-foreground mb-4">
                顯示所有平台影片（YouTube/抖音/小紅書），依分類快速查找，供客服人員使用
              </p>
              <Button 
                className="w-full" 
                onClick={() => setLocation("/login")}
              >
                前往內部看板
              </Button>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <Users className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">客戶自助專區</h3>
              <p className="text-muted-foreground mb-4">
                僅顯示 YouTube 影片，提供公開分享連結，讓客戶自助查找教學資源
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation("/portal")}
              >
                前往客戶專區
              </Button>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
            <div>
              <h4 className="font-semibold mb-2">🎯 智能分類</h4>
              <p className="text-sm text-muted-foreground">
                5大分類（使用介紹/維修/案例/常見問題/其他），AI 自動建議分類標籤
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🖼️ 自動縮圖</h4>
              <p className="text-sm text-muted-foreground">
                未上傳縮圖時，AI 自動根據影片標題生成吸引人的預覽圖
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔍 快速搜尋</h4>
              <p className="text-sm text-muted-foreground">
                支援關鍵字、平台、分類篩選，快速定位所需影片
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
