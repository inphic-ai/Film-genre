import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Link as LinkIcon, Film, Loader2, X } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * 商品知識中樞頁面
 * 
 * 功能：
 * - 顯示所有商品列表（卡片模式）
 * - SKU 搜尋與篩選
 * - 商品資訊顯示
 * - 點擊商品卡片查看詳情
 */

export default function Products() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 搜尋商品
  const utils = trpc.useUtils();

  // 列出所有商品（預設模式）
  const productsListQuery = trpc.products.list.useQuery(
    { limit: 50, offset: 0, sortBy: "createdAt", sortOrder: "desc" },
    { enabled: !isSearchMode }
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearchMode(true);
      const results = await utils.products.search.fetch({ query: searchQuery.trim().toUpperCase(), limit: 20 });
      setSearchResults(results);
    } catch (error) {
      console.error("搜尋失敗:", error);
      setSearchResults([]);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setSearchResults([]);
  };

  const handleProductClick = (sku: string) => {
    // 跳轉到商品詳情頁（未來實作）
    console.log("點擊商品:", sku);
  };

  // 決定顯示的商品列表
  const displayProducts = isSearchMode ? searchResults : (productsListQuery.data?.products || []);
  const isLoading = isSearchMode ? false : productsListQuery.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-emerald-500" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">商品知識中樞</h1>
            <p className="text-sm text-slate-600 mt-1">
              搜尋商品編號（SKU），查看商品詳細資訊、家族商品與相關影片
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
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  className="pl-11 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                disabled={!searchQuery.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-11 px-6"
              >
                <Search className="h-4 w-4 mr-2" />
                搜尋
              </Button>
            </form>

            {/* 搜尋模式提示 */}
            {isSearchMode && (
              <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                <span className="text-sm text-emerald-700">
                  搜尋結果：找到 {searchResults.length} 個商品
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                >
                  清除搜尋
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 商品列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {isSearchMode ? "搜尋結果" : "所有商品"}
            </h2>
            {!isSearchMode && productsListQuery.data && (
              <span className="text-sm text-slate-600">
                共 {productsListQuery.data.total} 個商品
              </span>
            )}
          </div>

          {/* Loading 狀態 */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-600">載入中...</span>
            </div>
          )}

          {/* 空狀態 */}
          {!isLoading && displayProducts.length === 0 && (
            <Card className="border-slate-200/70 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {isSearchMode ? "找不到符合的商品" : "開始搜尋商品"}
                </h3>
                <p className="text-sm text-slate-500 text-center max-w-md">
                  {isSearchMode 
                    ? "請嘗試使用不同的關鍵字搜尋，或清除搜尋查看所有商品"
                    : "在上方搜尋框輸入商品編號（SKU）、名稱或描述，即可查看商品詳細資訊、家族商品與相關影片"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 商品卡片網格 */}
          {!isLoading && displayProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayProducts.map((product: any) => (
                <Card
                  key={product.id}
                  className="border-slate-200/70 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
                  onClick={() => handleProductClick(product.sku)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-slate-900 mb-1">
                          {product.name}
                        </CardTitle>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {product.sku}
                        </Badge>
                      </div>
                      <Package className="h-5 w-5 text-emerald-500 flex-shrink-0 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {product.familyCode && (
                        <div className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          <span>家族：{product.familyCode}</span>
                        </div>
                      )}
                      {product.variant && (
                        <Badge variant="secondary" className="text-xs">
                          變體 {product.variant}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
