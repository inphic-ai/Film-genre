# Phase 46-49 實作方案文件

本文件提供 Phase 46-49 的完整實作方案與程式碼範例，協助完成剩餘功能開發。

---

## Phase 46：完成 Board.tsx 批次選擇整合

### 1. 修改 VideoCard 組件（新增 checkbox）

**檔案位置：** `client/src/components/VideoCard.tsx`

**修改方式：** 在 VideoCard 組件新增以下 props：

```typescript
interface VideoCardProps {
  video: Video;
  onEdit?: (video: Video) => void;
  onDelete?: (id: number) => void;
  // 新增批次選擇相關 props
  batchMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
}
```

**在卡片左上角新增 checkbox：**

```typescript
{batchMode && (
  <div className="absolute top-2 left-2 z-10">
    <Checkbox
      checked={isSelected}
      onCheckedChange={(checked) => onSelect?.(video.id, checked as boolean)}
      className="bg-white"
    />
  </div>
)}
```

---

### 2. 修改 VideoListView 組件（新增 checkbox）

**檔案位置：** `client/src/components/VideoListView.tsx`

**修改方式：** 在表格最左側新增 checkbox 欄位：

```typescript
interface VideoListViewProps {
  videos: Video[];
  onEdit?: (video: Video) => void;
  onDelete?: (id: number) => void;
  // 新增批次選擇相關 props
  batchMode?: boolean;
  selectedIds?: number[];
  onSelect?: (id: number, selected: boolean) => void;
}

// 在表格 header 新增 checkbox 欄位
<TableHead className="w-12">
  {batchMode && (
    <Checkbox
      checked={selectedIds?.length === videos.length}
      onCheckedChange={(checked) => {
        // 全選/取消全選邏輯
        videos.forEach(v => onSelect?.(v.id, checked as boolean));
      }}
    />
  )}
</TableHead>

// 在表格 body 新增 checkbox 欄位
<TableCell>
  {batchMode && (
    <Checkbox
      checked={selectedIds?.includes(video.id)}
      onCheckedChange={(checked) => onSelect?.(video.id, checked as boolean)}
    />
  )}
</TableCell>
```

---

### 3. 修改 Board.tsx（整合批次選擇功能）

**檔案位置：** `client/src/pages/Board.tsx`

**步驟 1：新增批次選擇處理函數**

```typescript
// 切換批次模式
const toggleBatchMode = () => {
  setBatchMode(!batchMode);
  setSelectedVideoIds([]);
};

// 處理單個影片選擇
const handleVideoSelect = (id: number, selected: boolean) => {
  if (selected) {
    setSelectedVideoIds([...selectedVideoIds, id]);
  } else {
    setSelectedVideoIds(selectedVideoIds.filter(vid => vid !== id));
  }
};

// 全選/取消全選
const handleSelectAll = () => {
  if (selectedVideoIds.length === filteredVideos.length) {
    setSelectedVideoIds([]);
  } else {
    setSelectedVideoIds(filteredVideos.map(v => v.id));
  }
};

// 清除選擇
const handleClearSelection = () => {
  setSelectedVideoIds([]);
  setBatchMode(false);
};

// 批次操作完成後的回調
const handleOperationComplete = () => {
  utils.videos.listAll.invalidate();
};
```

**步驟 2：在工具列新增批次模式按鈕**

找到 Board.tsx 中的工具列部分（搜尋 `<div className="flex items-center gap-2">`），新增批次模式按鈕：

```typescript
<Button
  variant={batchMode ? "default" : "outline"}
  size="sm"
  onClick={toggleBatchMode}
>
  <Checkbox className="h-4 w-4 mr-2" />
  {batchMode ? '退出批次模式' : '批次選擇'}
</Button>

{batchMode && selectedVideoIds.length > 0 && (
  <Button variant="outline" size="sm" onClick={handleSelectAll}>
    {selectedVideoIds.length === filteredVideos.length ? '取消全選' : '全選'}
  </Button>
)}
```

**步驟 3：修改 VideoCard 與 VideoListView 的調用**

找到渲染 VideoCard 的地方（卡片視圖）：

```typescript
<VideoCard
  key={video.id}
  video={video}
  onEdit={handleEdit}
  onDelete={handleDelete}
  batchMode={batchMode}
  isSelected={selectedVideoIds.includes(video.id)}
  onSelect={handleVideoSelect}
/>
```

找到渲染 VideoListView 的地方（清單視圖）：

```typescript
<VideoListView
  videos={filteredVideos}
  onEdit={handleEdit}
  onDelete={handleDelete}
  batchMode={batchMode}
  selectedIds={selectedVideoIds}
  onSelect={handleVideoSelect}
/>
```

**步驟 4：在 return 語句最後新增 BatchOperationToolbar**

```typescript
return (
  <DashboardLayout>
    {/* 現有的 Board 內容 */}
    
    {/* 批次操作工具列 */}
    <BatchOperationToolbar
      selectedCount={selectedVideoIds.length}
      selectedIds={selectedVideoIds}
      onClearSelection={handleClearSelection}
      onOperationComplete={handleOperationComplete}
    />
  </DashboardLayout>
);
```

---

## Phase 47：實作創作者詳情頁面

### 1. 後端 API 實作

**檔案位置：** `server/trpc/routers/dashboard.ts`

**新增 getCreatorDetail procedure：**

```typescript
getCreatorDetail: publicProcedure
  .input(z.object({
    creator: z.string(),
    sortBy: z.enum(['createdAt', 'viewCount', 'rating']).optional(),
    category: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const { creator, sortBy = 'createdAt', category } = input;
    
    // 查詢該創作者的所有影片
    let query = db
      .select()
      .from(videos)
      .where(eq(videos.creator, creator));
    
    if (category && category !== 'all') {
      query = query.where(eq(videos.category, category));
    }
    
    const creatorVideos = await query;
    
    // 統計數據
    const totalVideos = creatorVideos.length;
    const totalViews = creatorVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
    const avgRating = creatorVideos.reduce((sum, v) => sum + (v.rating || 0), 0) / totalVideos;
    
    // 分類分佈
    const categoryDistribution = creatorVideos.reduce((acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 排序
    const sortedVideos = creatorVideos.sort((a, b) => {
      if (sortBy === 'viewCount') return (b.viewCount || 0) - (a.viewCount || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return {
      creator,
      totalVideos,
      totalViews,
      avgRating,
      categoryDistribution,
      videos: sortedVideos,
    };
  }),
```

---

### 2. 前端實作

**步驟 1：建立 CreatorDetail.tsx 頁面**

**檔案位置：** `client/src/pages/CreatorDetail.tsx`

```typescript
import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoCard } from "@/components/VideoCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Eye, Star } from "lucide-react";

export default function CreatorDetail() {
  const [, params] = useRoute("/creators/:creator");
  const creator = decodeURIComponent(params?.creator || "");
  
  const [sortBy, setSortBy] = useState<'createdAt' | 'viewCount' | 'rating'>('createdAt');
  const [category, setCategory] = useState<string>('all');
  
  const { data, isLoading } = trpc.dashboard.getCreatorDetail.useQuery({
    creator,
    sortBy,
    category,
  });
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">找不到創作者資訊</div>
      </DashboardLayout>
    );
  }
  
  // 準備圖表數據
  const chartData = Object.entries(data.categoryDistribution).map(([key, value]) => ({
    name: categoryLabels[key] || key,
    count: value,
  }));
  
  return (
    <DashboardLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">{creator}</h1>
        
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">影片數量</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalVideos}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總觀看次數</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均評分</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.avgRating.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* 分類分佈圖表 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>影片分類分佈</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="影片數量" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* 影片列表 */}
        <div className="mb-4 flex items-center gap-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="選擇分類" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分類</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">建立時間</SelectItem>
              <SelectItem value="viewCount">觀看次數</SelectItem>
              <SelectItem value="rating">評分</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

const categoryLabels: Record<string, string> = {
  product_intro: '使用介紹',
  maintenance: '維修',
  case_study: '案例',
  faq: '常見問題',
  other: '其他',
};
```

**步驟 2：修改 Creators.tsx（新增點擊影片數量連結）**

**檔案位置：** `client/src/pages/Creators.tsx`

找到顯示影片數量的地方，修改為可點擊的連結：

```typescript
import { Link } from "wouter";

// 在表格中修改影片數量欄位
<TableCell>
  <Link href={`/creators/${encodeURIComponent(creator.creator)}`}>
    <Button variant="link" className="p-0 h-auto font-normal">
      {creator.videoCount} 部影片
    </Button>
  </Link>
</TableCell>
```

**步驟 3：新增路由到 App.tsx**

**檔案位置：** `client/src/App.tsx`

```typescript
import CreatorDetail from "@/pages/CreatorDetail";

// 在路由列表中新增
<Route path="/creators/:creator" component={CreatorDetail} />
```

**步驟 4：安裝 recharts 圖表庫**

```bash
pnpm add recharts
```

---

## Phase 48：搜尋排序優化（升序/降序）

### 修改 Board.tsx

**檔案位置：** `client/src/pages/Board.tsx`

**步驟 1：修改排序按鈕，新增排序方向切換**

找到排序按鈕的地方（搜尋 `ArrowUpDown`），修改為：

```typescript
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// 切換排序方向的函數
const toggleSortOrder = () => {
  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
};

// 修改排序按鈕
<Button
  variant="outline"
  size="sm"
  onClick={toggleSortOrder}
  className="flex items-center gap-2"
>
  {sortOrder === 'asc' ? (
    <ArrowUp className="h-4 w-4" />
  ) : (
    <ArrowDown className="h-4 w-4" />
  )}
  {sortOrder === 'asc' ? '升序' : '降序'}
</Button>
```

**步驟 2：修改排序邏輯**

找到 `filteredVideos` 的排序邏輯，修改為：

```typescript
const sortedVideos = useMemo(() => {
  const sorted = [...filteredVideos].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'viewCount') {
      comparison = (a.viewCount || 0) - (b.viewCount || 0);
    } else if (sortBy === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'rating') {
      comparison = (a.rating || 0) - (b.rating || 0);
    } else if (sortBy === 'duration') {
      comparison = (a.duration || 0) - (b.duration || 0);
    }
    
    // 根據 sortOrder 決定升序或降序
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}, [filteredVideos, sortBy, sortOrder]);
```

---

## Phase 49：新增後台操作日誌

### 1. 資料庫 Schema 變更

**檔案位置：** `drizzle/schema.ts`

**新增 operation_logs 表：**

```typescript
export const operationLogs = sqliteTable('operation_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  operation: text('operation').notNull(), // 'create', 'update', 'delete', 'batch_delete', 'batch_update_category', 'batch_update_share_status'
  targetType: text('target_type').notNull(), // 'video', 'tag', 'category'
  targetId: integer('target_id'), // nullable for batch operations
  details: text('details'), // JSON string for additional details
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type OperationLog = typeof operationLogs.$inferSelect;
```

**執行 migration：**

```bash
pnpm db:push
```

---

### 2. 後端 API 實作

**步驟 1：建立 logs helper 函數**

**檔案位置：** `server/db.ts`

```typescript
// 建立操作日誌
export async function createOperationLog(
  userId: number,
  operation: string,
  targetType: string,
  targetId: number | null,
  details?: any
) {
  return await db.insert(operationLogs).values({
    userId,
    operation,
    targetType,
    targetId,
    details: details ? JSON.stringify(details) : null,
  });
}

// 查詢操作日誌
export async function getOperationLogs(params: {
  operation?: string;
  targetType?: string;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  let query = db.select({
    log: operationLogs,
    user: users,
  })
  .from(operationLogs)
  .leftJoin(users, eq(operationLogs.userId, users.id))
  .orderBy(desc(operationLogs.createdAt));
  
  // 應用篩選條件
  if (params.operation) {
    query = query.where(eq(operationLogs.operation, params.operation));
  }
  if (params.targetType) {
    query = query.where(eq(operationLogs.targetType, params.targetType));
  }
  if (params.userId) {
    query = query.where(eq(operationLogs.userId, params.userId));
  }
  if (params.startDate) {
    query = query.where(gte(operationLogs.createdAt, params.startDate));
  }
  if (params.endDate) {
    query = query.where(lte(operationLogs.createdAt, params.endDate));
  }
  
  if (params.limit) {
    query = query.limit(params.limit);
  }
  if (params.offset) {
    query = query.offset(params.offset);
  }
  
  return await query;
}
```

**步驟 2：建立 logs router**

**檔案位置：** `server/routers.ts`

```typescript
// 在 routers 中新增 logs router
logs: router({
  // 查詢操作日誌（admin only）
  list: protectedProcedure
    .input(z.object({
      operation: z.string().optional(),
      targetType: z.string().optional(),
      userId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      return await db.getOperationLogs(input);
    }),
}),
```

**步驟 3：整合到現有 API**

修改 `videos.create`, `videos.update`, `videos.delete`, `videos.batchDelete` 等 procedures，在操作完成後記錄日誌：

```typescript
// 範例：videos.create
create: protectedProcedure
  .input(videoSchema)
  .mutation(async ({ input, ctx }) => {
    const video = await db.createVideo(input);
    
    // 記錄操作日誌
    await db.createOperationLog(
      ctx.user.id,
      'create',
      'video',
      video.id,
      { title: video.title }
    );
    
    return video;
  }),
```

---

### 3. 前端實作

**步驟 1：建立 OperationLogs.tsx 頁面**

**檔案位置：** `client/src/pages/OperationLogs.tsx`

```typescript
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function OperationLogs() {
  const [operation, setOperation] = useState<string>('all');
  const [targetType, setTargetType] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;
  
  const { data, isLoading } = trpc.logs.list.useQuery({
    operation: operation === 'all' ? undefined : operation,
    targetType: targetType === 'all' ? undefined : targetType,
    limit: pageSize,
    offset: page * pageSize,
  });
  
  const operationLabels: Record<string, string> = {
    create: '新增',
    update: '編輯',
    delete: '刪除',
    batch_delete: '批次刪除',
    batch_update_category: '批次修改分類',
    batch_update_share_status: '批次修改分享狀態',
  };
  
  const targetTypeLabels: Record<string, string> = {
    video: '影片',
    tag: '標籤',
    category: '分類',
  };
  
  return (
    <DashboardLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">操作日誌</h1>
        
        {/* 篩選工具列 */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="操作類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              {Object.entries(operationLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="目標類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類型</SelectItem>
              {Object.entries(targetTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* 日誌列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>時間</TableHead>
                  <TableHead>操作者</TableHead>
                  <TableHead>操作類型</TableHead>
                  <TableHead>目標類型</TableHead>
                  <TableHead>目標 ID</TableHead>
                  <TableHead>詳情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((item) => (
                  <TableRow key={item.log.id}>
                    <TableCell>
                      {format(new Date(item.log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>{item.user?.name || '未知'}</TableCell>
                    <TableCell>{operationLabels[item.log.operation] || item.log.operation}</TableCell>
                    <TableCell>{targetTypeLabels[item.log.targetType] || item.log.targetType}</TableCell>
                    <TableCell>{item.log.targetId || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.log.details || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* 分頁 */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                第 {page + 1} 頁
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一頁
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!data || data.length < pageSize}
                >
                  下一頁
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
```

**步驟 2：新增路由到 App.tsx**

```typescript
import OperationLogs from "@/pages/OperationLogs";

<Route path="/admin/logs" component={OperationLogs} />
```

**步驟 3：在 DashboardLayout 側邊欄新增「操作日誌」選項**

**檔案位置：** `client/src/components/DashboardLayout.tsx`

找到側邊欄選單，新增：

```typescript
<Link href="/admin/logs">
  <Button variant="ghost" className="w-full justify-start">
    <FileText className="mr-2 h-4 w-4" />
    操作日誌
  </Button>
</Link>
```

---

## 安裝必要的依賴

```bash
# 圖表庫（用於創作者詳情頁面）
pnpm add recharts

# 日期格式化（用於操作日誌）
pnpm add date-fns
```

---

## 測試步驟

### Phase 46 測試
1. 進入影片看板頁面
2. 點擊「批次選擇」按鈕
3. 選擇多部影片（checkbox 出現）
4. 點擊底部工具列的「刪除」、「修改分類」、「修改分享狀態」按鈕
5. 確認對話框正常顯示
6. 執行操作後確認 toast 提示與影片列表更新

### Phase 47 測試
1. 進入創作者列表頁面
2. 點擊任一創作者的影片數量
3. 跳轉到創作者詳情頁面
4. 確認統計卡片、圖表、影片列表正常顯示
5. 測試篩選與排序功能

### Phase 48 測試
1. 進入影片看板頁面
2. 點擊排序按鈕旁的升序/降序按鈕
3. 確認影片列表順序改變
4. 切換不同排序欄位（觀看次數、建立時間、評分、影片長度）
5. 確認升序/降序對所有排序欄位都有效

### Phase 49 測試
1. 執行任何影片操作（新增/編輯/刪除/批次操作）
2. 進入操作日誌頁面（/admin/logs）
3. 確認操作記錄正確顯示
4. 測試篩選功能（操作類型、目標類型）
5. 測試分頁功能

---

## 推送到 GitHub

完成所有功能後，執行：

```bash
cd /home/ubuntu/film-genre
git add -A
git commit -m "Phase 46-49: 批次操作前端、創作者詳情頁面、搜尋排序優化、後台操作日誌"
git push github main
```

---

## 注意事項

1. **TypeScript 類型檢查**：修改 schema 後務必執行 `pnpm db:push` 並重啟開發伺服器
2. **測試覆蓋率**：建議為批次操作 API 與操作日誌 API 建立 vitest 測試
3. **性能優化**：操作日誌表可能快速增長，建議定期清理舊資料或實作分頁優化
4. **權限控制**：操作日誌查詢僅限 admin 角色，確保 `ctx.user.role === 'admin'` 檢查存在

---

## 完成檢查清單

- [ ] Phase 46：Board.tsx 批次選擇整合完成
- [ ] Phase 47：創作者詳情頁面完成
- [ ] Phase 48：搜尋排序優化完成
- [ ] Phase 49：後台操作日誌完成
- [ ] 所有功能本地測試通過
- [ ] TypeScript 編譯無錯誤
- [ ] 推送到 GitHub
- [ ] Railway 生產環境測試通過
