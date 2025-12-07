import { Button } from "@/components/ui/button";
import { Film, Shield } from "lucide-react";
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
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              <Film className="w-4 h-4 mr-2" />
              Dashboard
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
              影片知識庫管理系統
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              整合多平台影片資源（YouTube/抖音/小紅書），支援智慧標籤、時間軸筆記、權限管理，實現專業的知識管理
            </p>
          </div>

          {/* Main Action */}
          <div className="max-w-md mx-auto mt-12">
            <div className="p-8 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <Shield className="w-16 h-16 text-primary mb-4 mx-auto" />
              <h3 className="text-2xl font-semibold mb-3 text-center">影片管理看板</h3>
              <p className="text-muted-foreground mb-6 text-center">
                顯示所有平台影片（YouTube/抖音/小紅書），支援智慧標籤、時間軸筆記、權限管理
              </p>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setLocation("/login")}
              >
                登入系統
              </Button>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
            <div>
              <h4 className="font-semibold mb-2">🏷️ 智慧標籤系統</h4>
              <p className="text-sm text-muted-foreground">
                支援關鍵字標籤與商品編號標籤，自動檢測商品編號格式（QJD002001A），智慧排序優先顯示
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📝 時間軸筆記</h4>
              <p className="text-sm text-muted-foreground">
                在影片特定時間點新增筆記與圖片，支援審核機制（Admin/Staff/Viewer 權限控制）
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔍 快速搜尋</h4>
              <p className="text-sm text-muted-foreground">
                支援關鍵字、平台、分類、標籤多維度篩選，快速定位所需影片
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
