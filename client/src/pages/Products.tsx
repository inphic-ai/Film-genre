import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Link as LinkIcon, Film, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

/**
 * 商品知識中樞頁面
 * 
 * 功能：
 * - SKU 搜尋
 * - 商品資訊顯示
 * - 商品家族（前 6 碼相同）
 * - 商品關聯（同義 SKU）
 * - 相關影片列表
 */

export default function Products() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 搜尋商品
  const searchMutation = trpc.products.search.useQuery(
    { query: searchQuery.trim(), limit: 20 },
    { enabled: false }
  );

  // 取得商品詳情
  const productQuery = trpc.products.getBySku.useQuery(
    { sku: selectedSku || "" },
    { enabled: !!selectedSku }
  );

  // 取得商品家族
  const familyQuery = trpc.products.getFamily.useQuery(
    { sku: selectedSku || "" },
    { enabled: !!selectedSku && selectedSku.length >= 6 }
  );

  // 取得商品關聯
  const relationsQuery = trpc.products.getRelations.useQuery(
    { productId: productQuery.data?.id || 0 },
    { enabled: !!productQuery.data?.id }
  );

  // 取得相關影片
  const videosQuery = trpc.products.getRelatedVideos.useQuery(
    { sku: selectedSku || "", limit: 20 },
    { enabled: !!selectedSku }
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const results = await searchMutation.refetch();
      if (results.data && results.data.length > 0) {
        setSearchResults(results.data);
        setSelectedSku(results.data[0].sku);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("搜尋失敗:", error);
    }
  };

  const getRelationTypeLabel = (type: string) => {
    switch (type) {
      case "SYNONYM":
        return "同義 SKU";
      case "FAMILY":
        return "家族商品";
      case "PART":
        return "相關零件";
      default:
        return type;
    }
  };

  const getRelationTypeBadgeColor = (type: string) => {
    switch (type) {
      case "SYNONYM":
        return "bg-emerald-500 text-white";
      case "FAMILY":
        return "bg-sky-500 text-white";
      case "PART":
        return "bg-amber-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">商品知識中樞</h1>
          <p className="text-sm text-slate-600 mt-1">
            搜尋商品編號（SKU），查看商品家族、關聯商品與相關影片
          </p>
        </div>
      </div>

      {/* 搜尋框 */}
      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">SKU 搜尋</CardTitle>
          <CardDescription>輸入商品編號、名稱或描述進行搜尋</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="例如：PM6123456A 或商品名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={searchMutation.isPending || !searchQuery.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-11 px-6"
            >
              {searchMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  搜尋中...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  搜尋
                </>
              )}
            </Button>
          </form>

          {/* 搜尋結果列表 */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-600">找到 {searchResults.length} 個結果：</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {searchResults.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedSku(product.sku)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      selectedSku === product.sku
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                  >
                    <div className="font-medium text-slate-900">{product.sku}</div>
                    <div className="text-sm text-slate-600 truncate">{product.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && searchQuery && (
            <div className="mt-4 text-center text-slate-600">
              找不到符合的商品，請嘗試其他關鍵字
            </div>
          )}
        </CardContent>
      </Card>

      {/* 商品詳情 */}
      {selectedSku && productQuery.data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：商品資訊 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 商品基本資訊 */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-500" />
                  商品資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">商品編號</div>
                  <div className="font-mono font-semibold text-lg text-slate-900">
                    {productQuery.data.sku}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">商品名稱</div>
                  <div className="text-slate-900">{productQuery.data.name}</div>
                </div>
                {productQuery.data.description && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">描述</div>
                    <div className="text-sm text-slate-700">{productQuery.data.description}</div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200">
                    家族碼: {productQuery.data.familyCode}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200">
                    變體: {productQuery.data.variant}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 商品家族 */}
            {familyQuery.data && familyQuery.data.length > 1 && (
              <Card className="border-slate-200/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-sky-500" />
                    商品家族
                  </CardTitle>
                  <CardDescription>
                    前 6 碼相同的商品（{familyQuery.data.length} 個）
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {familyQuery.data.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedSku(product.sku)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedSku === product.sku
                          ? "border-sky-500 bg-sky-50"
                          : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50"
                      }`}
                    >
                      <div className="font-mono font-medium text-slate-900">{product.sku}</div>
                      <div className="text-sm text-slate-600 truncate">{product.name}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 商品關聯 */}
            {relationsQuery.data && relationsQuery.data.length > 0 && (
              <Card className="border-slate-200/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-amber-500" />
                    商品關聯
                  </CardTitle>
                  <CardDescription>
                    同義 SKU、相關零件等（{relationsQuery.data.length} 個）
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {relationsQuery.data.map((relation) => (
                    <div
                      key={relation.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getRelationTypeBadgeColor(relation.relationType)}>
                          {getRelationTypeLabel(relation.relationType)}
                        </Badge>
                      </div>
                      <button
                        onClick={() => setSelectedSku(relation.relatedProduct.sku)}
                        className="w-full text-left hover:bg-slate-50 p-2 rounded-lg transition-colors"
                      >
                        <div className="font-mono font-medium text-slate-900">
                          {relation.relatedProduct.sku}
                        </div>
                        <div className="text-sm text-slate-600 truncate">
                          {relation.relatedProduct.name}
                        </div>
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側：相關影片 */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Film className="h-5 w-5 text-red-500" />
                  相關影片
                </CardTitle>
                <CardDescription>
                  {videosQuery.data ? `共 ${videosQuery.data.length} 個影片` : "載入中..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {videosQuery.isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                )}

                {videosQuery.data && videosQuery.data.length === 0 && (
                  <div className="text-center py-12 text-slate-600">
                    目前沒有相關影片
                  </div>
                )}

                {videosQuery.data && videosQuery.data.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videosQuery.data.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => setLocation(`/video/${video.id}`)}
                        className="text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all group"
                      >
                        {/* 縮圖 */}
                        {video.thumbnailUrl && (
                          <div className="relative h-40 mb-3 rounded-xl overflow-hidden bg-slate-100">
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        {/* 標題 */}
                        <h3 className="font-medium text-slate-900 line-clamp-2 mb-2">
                          {video.title}
                        </h3>

                        {/* 平台標籤 */}
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              video.platform === "youtube"
                                ? "bg-red-600 text-white"
                                : video.platform === "redbook"
                                ? "bg-pink-500 text-white"
                                : "bg-slate-800 text-white"
                            }
                          >
                            {video.platform === "youtube"
                              ? "YouTube"
                              : video.platform === "redbook"
                              ? "小紅書"
                              : "抖音"}
                          </Badge>
                          {video.duration && (
                            <span className="text-xs text-slate-500">
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 空狀態 */}
      {!selectedSku && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">開始搜尋商品</h3>
            <p className="text-sm text-slate-600 text-center max-w-md">
              在上方搜尋框輸入商品編號（SKU）、名稱或描述，即可查看商品詳細資訊、家族商品與相關影片
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
