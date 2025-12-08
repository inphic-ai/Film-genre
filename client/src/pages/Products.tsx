import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Link as LinkIcon, Film, Loader2, X, Tag, Filter, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductBatchImportDialog } from "@/components/ProductBatchImportDialog";
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
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [isBatchImportDialogOpen, setIsBatchImportDialogOpen] = useState(false);

  // 搜尋商品
  const utils = trpc.useUtils();
  
  // 取得所有標籤（所有類型）
  const { data: allTags } = trpc.tags.list.useQuery();

  // 列出所有商品（預設模式）
  const productsListQuery = trpc.products.list.useQuery(
    { limit: 50, offset: 0, sortBy: "createdAt", sortOrder: "desc" },
    { enabled: !isSearchMode && selectedTagIds.length === 0 }
  );
  
  // 根據標籤篩選商品
  const tagFilteredProductsQuery = trpc.products.listByTags.useQuery(
    { tagIds: selectedTagIds, limit: 50, offset: 0 },
    { enabled: selectedTagIds.length > 0 && !isSearchMode }
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
  let displayProducts: any[] = [];
  let totalCount = 0;
  
  if (isSearchMode) {
    // 搜尋模式
    displayProducts = searchResults;
    totalCount = searchResults.length;
  } else if (selectedTagIds.length > 0) {
    // 標籤篩選模式
    displayProducts = tagFilteredProductsQuery.data?.products || [];
    totalCount = tagFilteredProductsQuery.data?.total || 0;
  } else {
    // 預設模式（所有商品）
    displayProducts = productsListQuery.data?.products || [];
    totalCount = productsListQuery.data?.total || 0;
  }
  
  const isLoading = isSearchMode 
    ? false 
    : selectedTagIds.length > 0 
    ? tagFilteredProductsQuery.isLoading 
    : productsListQuery.isLoading;

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

        {/* 搜尋商品 */}
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">商品搜尋</CardTitle>
                <CardDescription>輸入商品編號（SKU）、名稱或描述來搜尋商品</CardDescription>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsBatchImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4" />
                批次匯入
              </Button>
            </div>
          </CardHeader>      <CardContent>
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

            {/* 標籤篩選器 */}
            <div className="mt-3 flex items-center gap-3">
              <Popover open={tagFilterOpen} onOpenChange={setTagFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    商品標籤
                    {selectedTagIds.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {selectedTagIds.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">選擇商品標籤</h4>
                      {selectedTagIds.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTagIds([])}
                        >
                          清除
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allTags && allTags.length > 0 ? (
                        allTags.map(tag => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={selectedTagIds.includes(tag.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTagIds([...selectedTagIds, tag.id]);
                                } else {
                                  setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id));
                                }
                              }}
                            />
                            <Label htmlFor={`tag-${tag.id}`} className="flex-1 cursor-pointer flex items-center gap-2">
                              <Tag className="h-3 w-3" style={{ color: tag.color || undefined }} />
                              <span>{tag.name}</span>
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">無可用的商品標籤</p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* 顯示已選標籤 */}
              {selectedTagIds.length > 0 && allTags && (
                <div className="flex flex-wrap gap-2">
                  {allTags
                    .filter(tag => selectedTagIds.includes(tag.id))
                    .map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-slate-200"
                        onClick={() => setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))}
                      >
                        <Tag className="h-3 w-3" style={{ color: tag.color || undefined }} />
                        {tag.name}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                </div>
              )}
            </div>

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
              {isSearchMode 
                ? "搜尋結果" 
                : selectedTagIds.length > 0 
                ? "標籤篩選結果" 
                : "所有商品"}
            </h2>
            {totalCount > 0 && (
              <span className="text-sm text-slate-600">
                共 {totalCount} 個商品
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
                  className="border-slate-200/70 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer overflow-hidden"
                  onClick={() => handleProductClick(product.sku)}
                >
                  {/* 商品縮圖 */}
                  {product.thumbnailUrl && (
                    <div className="relative w-full h-48 bg-slate-100">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
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

      {/* 批次匯入對話框 */}
      <ProductBatchImportDialog
        open={isBatchImportDialogOpen}
        onOpenChange={setIsBatchImportDialogOpen}
      />
    </DashboardLayout>
  );
}
