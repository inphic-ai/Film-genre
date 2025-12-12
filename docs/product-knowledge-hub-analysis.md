# 商品知識中樞功能分析與優化建議

## 執行摘要

商品知識中樞是影片整理網站的核心功能之一,目前已實作基礎架構,包含商品搜尋、列表顯示與批次匯入功能。本文件分析現有功能狀態,識別優化機會,並提供具體的實作建議。

---

## 一、現有功能盤點

### 1.1 已實作功能

#### 前端功能（`client/src/pages/Products.tsx`）
- ✅ 商品列表顯示（卡片模式）
- ✅ SKU 搜尋功能
- ✅ 標籤篩選功能
- ✅ 批次匯入對話框
- ✅ 商品縮圖顯示
- ✅ 家族代碼與變體標示

#### 後端 API（`server/trpc/routers/products.ts`）
- ✅ `list` - 列出所有商品（支援分頁與排序）
- ✅ `search` - 搜尋商品（SKU/名稱/描述）
- ✅ `getBySku` - 根據 SKU 取得商品詳情
- ✅ `getFamily` - 取得商品家族（前 6 碼相同）
- ✅ `getRelations` - 取得商品關聯（同義 SKU、相關零件）
- ✅ `getRelatedVideos` - 取得商品相關影片
- ✅ `create` - 新增商品（Admin 專用）
- ✅ `update` - 更新商品（Admin 專用）
- ✅ `createRelation` - 建立商品關聯（Admin 專用）
- ✅ `batchImport` - 批次匯入商品（CSV）
- ✅ `listByTags` - 根據標籤篩選商品

### 1.2 資料庫架構

#### Products 資料表
```sql
- id (Primary Key)
- sku (Unique, 商品編號)
- name (商品名稱)
- description (商品描述)
- familyCode (家族代碼，前 6 碼)
- variant (變體，最後一碼 A/B/C)
- thumbnailUrl (縮圖網址)
- createdAt / updatedAt
```

#### Product_Relations 資料表
```sql
- id (Primary Key)
- productAId (Foreign Key → products.id)
- productBId (Foreign Key → products.id)
- relationType (SYNONYM | FAMILY | PART)
- createdAt
```

---

## 二、功能缺口分析

### 2.1 核心功能缺口

#### ❌ 商品詳情頁面
**現狀**：點擊商品卡片僅觸發 `console.log`,未實作詳情頁面

**影響**：
- 無法查看商品完整資訊
- 無法查看家族商品列表
- 無法查看商品關聯（同義 SKU、相關零件）
- 無法查看相關影片列表

**優先級**：🔴 **P0 - 最高優先級**

#### ❌ 商品與影片關聯機制
**現狀**：`videos` 資料表的 `productId` 欄位儲存商品編號字串,但缺乏結構化關聯

**問題**：
- 無法精確查詢商品的所有相關影片
- 無法建立多對多關聯（一個影片可能介紹多個商品）
- 搜尋效能不佳（使用 `LIKE` 查詢）

**建議**：建立 `video_products` 中介資料表

**優先級**：🟡 **P1 - 高優先級**

#### ❌ 商品編輯與刪除功能
**現狀**：商品卡片顯示「編輯」「刪除」按鈕,但未實作功能

**影響**：
- 無法修改商品資訊
- 無法刪除錯誤商品
- 管理效率低落

**優先級**：🟡 **P1 - 高優先級**

### 2.2 進階功能缺口

#### ❌ 商品家族視覺化
**現狀**：雖然後端有 `getFamily` API,但前端未顯示家族關係

**建議**：在商品詳情頁顯示家族樹狀圖或卡片列表

**優先級**：🟢 **P2 - 中優先級**

#### ❌ 商品關聯管理 UI
**現狀**：後端有 `createRelation` API,但前端無管理介面

**建議**：在商品詳情頁提供關聯管理功能（新增/刪除同義 SKU、相關零件）

**優先級**：🟢 **P2 - 中優先級**

#### ❌ 商品統計與分析
**現狀**：無商品相關統計數據

**建議**：
- 商品總數統計
- 家族分布統計
- 相關影片數量統計
- 熱門商品排行

**優先級**：🔵 **P3 - 低優先級**

---

## 三、優化建議與實作方案

### 3.1 P0 - 商品詳情頁面（立即實作）

#### 功能需求
1. **基本資訊區塊**
   - 商品名稱、SKU、描述
   - 商品縮圖（大圖顯示）
   - 家族代碼與變體標示
   - 建立/更新時間

2. **家族商品區塊**
   - 顯示相同家族代碼的所有商品
   - 卡片或表格模式切換
   - 點擊跳轉到該商品詳情

3. **商品關聯區塊**
   - 同義 SKU 列表
   - 相關零件列表
   - 關聯類型標示（SYNONYM / FAMILY / PART）

4. **相關影片區塊**
   - 顯示包含該商品編號的所有影片
   - 影片卡片顯示（縮圖、標題、平台）
   - 點擊跳轉到影片詳情或播放

#### 實作步驟
```typescript
// 1. 建立商品詳情頁面
client/src/pages/ProductDetail.tsx

// 2. 在 App.tsx 註冊路由
<Route path="/products/:sku" component={ProductDetail} />

// 3. 修改 Products.tsx 的 handleProductClick
const handleProductClick = (sku: string) => {
  setLocation(`/products/${sku}`);
};

// 4. 在 ProductDetail.tsx 中使用現有 API
const { data: product } = trpc.products.getBySku.useQuery({ sku });
const { data: family } = trpc.products.getFamily.useQuery({ sku });
const { data: relations } = trpc.products.getRelations.useQuery({ productId: product.id });
const { data: videos } = trpc.products.getRelatedVideos.useQuery({ sku });
```

#### UI 設計建議
- 使用 Tabs 組件切換不同區塊（基本資訊 / 家族商品 / 商品關聯 / 相關影片）
- 使用 Card 組件展示資訊區塊
- 使用 Badge 標示家族代碼、變體、關聯類型
- 使用 Skeleton 處理載入狀態

---

### 3.2 P1 - 商品與影片關聯優化

#### 問題分析
目前 `videos.productId` 欄位儲存商品編號字串,存在以下問題：
1. 無法建立多對多關聯（一個影片可能介紹多個商品）
2. 搜尋效能不佳（使用 `LIKE '%sku%'` 查詢）
3. 無法追蹤關聯建立時間與建立者

#### 解決方案：建立中介資料表

```sql
-- 建立 video_products 中介資料表
CREATE TABLE video_products (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, product_id)
);

-- 建立索引提升查詢效能
CREATE INDEX idx_video_products_video_id ON video_products(video_id);
CREATE INDEX idx_video_products_product_id ON video_products(product_id);
```

#### 資料遷移策略
1. 建立 `video_products` 資料表
2. 從 `videos.productId` 解析商品編號並建立關聯記錄
3. 保留 `videos.productId` 欄位作為備份（未來可移除）
4. 更新 `getRelatedVideos` API 使用新的關聯查詢

#### 實作步驟
```typescript
// 1. 更新 schema.ts
export const videoProducts = pgTable('video_products', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. 執行資料庫遷移
pnpm db:push

// 3. 建立資料遷移腳本
server/scripts/migrate-video-products.ts

// 4. 更新 getRelatedVideos API
getRelatedVideos: publicProcedure
  .input(z.object({ sku: z.string() }))
  .query(async ({ input }) => {
    const db = await getDb();
    
    // 先查詢商品 ID
    const product = await db.select().from(products).where(eq(products.sku, input.sku)).limit(1);
    if (product.length === 0) return [];
    
    // 透過中介資料表查詢相關影片
    const results = await db
      .select({ video: videos })
      .from(videoProducts)
      .innerJoin(videos, eq(videoProducts.videoId, videos.id))
      .where(eq(videoProducts.productId, product[0].id));
    
    return results.map(r => r.video);
  }),
```

---

### 3.3 P1 - 商品編輯與刪除功能

#### 功能需求
1. **編輯商品**
   - 修改商品名稱
   - 修改商品描述
   - 上傳/更換商品縮圖
   - SKU 不可修改（唯一識別碼）

2. **刪除商品**
   - 確認對話框（防止誤刪）
   - 檢查是否有相關影片（提示警告）
   - 級聯刪除商品關聯記錄

#### 實作步驟
```typescript
// 1. 建立編輯對話框組件
client/src/components/ProductEditDialog.tsx

// 2. 在 Products.tsx 與 ProductDetail.tsx 中使用
const editMutation = trpc.products.update.useMutation({
  onSuccess: () => {
    toast.success("商品更新成功");
    utils.products.invalidate();
  },
});

// 3. 建立刪除確認對話框
client/src/components/ProductDeleteDialog.tsx

// 4. 實作刪除 API
delete: protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    const db = await getDb();
    
    // 檢查是否有相關影片
    const relatedVideos = await db
      .select()
      .from(videoProducts)
      .where(eq(videoProducts.productId, input.id));
    
    if (relatedVideos.length > 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `該商品有 ${relatedVideos.length} 個相關影片，請先移除關聯後再刪除`,
      });
    }
    
    // 刪除商品（級聯刪除關聯記錄）
    await db.delete(products).where(eq(products.id, input.id));
    
    await invalidateProductCache();
    return { success: true };
  }),
```

---

### 3.4 P2 - 商品家族視覺化

#### 功能需求
- 在商品詳情頁顯示家族樹狀圖或卡片列表
- 標示當前商品（高亮顯示）
- 顯示變體差異（A/B/C）
- 支援快速切換到家族內其他商品

#### UI 設計建議
```typescript
// 使用 Tabs 組件切換顯示模式
<Tabs defaultValue="grid">
  <TabsList>
    <TabsTrigger value="grid">卡片模式</TabsTrigger>
    <TabsTrigger value="tree">樹狀圖</TabsTrigger>
  </TabsList>
  
  <TabsContent value="grid">
    {/* 家族商品卡片網格 */}
  </TabsContent>
  
  <TabsContent value="tree">
    {/* 家族樹狀圖（使用 react-flow 或 d3.js） */}
  </TabsContent>
</Tabs>
```

---

### 3.5 P2 - 商品關聯管理 UI

#### 功能需求
1. **查看商品關聯**
   - 同義 SKU 列表
   - 相關零件列表
   - 家族商品列表

2. **新增商品關聯**
   - 搜尋目標商品
   - 選擇關聯類型（SYNONYM / FAMILY / PART）
   - 建立雙向關聯

3. **刪除商品關聯**
   - 確認對話框
   - 刪除雙向關聯

#### 實作步驟
```typescript
// 1. 建立商品關聯管理組件
client/src/components/ProductRelationsManager.tsx

// 2. 在 ProductDetail.tsx 中使用
<ProductRelationsManager productId={product.id} />

// 3. 實作刪除關聯 API
deleteRelation: protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    const db = await getDb();
    await db.delete(productRelations).where(eq(productRelations.id, input.id));
    
    await invalidateProductCache();
    return { success: true };
  }),
```

---

### 3.6 P3 - 商品統計與分析

#### 功能需求
- 商品總數統計
- 家族分布統計（前 6 碼分組）
- 相關影片數量統計
- 熱門商品排行（根據相關影片數量）

#### 實作步驟
```typescript
// 1. 建立統計 API
getStats: publicProcedure.query(async () => {
  const db = await getDb();
  
  // 商品總數
  const totalProducts = await db.select({ count: sql<number>`count(*)` }).from(products);
  
  // 家族分布
  const familyDistribution = await db
    .select({
      familyCode: products.familyCode,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .groupBy(products.familyCode)
    .orderBy(sql`count(*) DESC`)
    .limit(10);
  
  // 熱門商品（根據相關影片數量）
  const topProducts = await db
    .select({
      product: products,
      videoCount: sql<number>`count(${videoProducts.videoId})`,
    })
    .from(products)
    .leftJoin(videoProducts, eq(products.id, videoProducts.productId))
    .groupBy(products.id)
    .orderBy(sql`count(${videoProducts.videoId}) DESC`)
    .limit(10);
  
  return {
    totalProducts: Number(totalProducts[0]?.count || 0),
    familyDistribution,
    topProducts,
  };
});

// 2. 在 Dashboard 頁面顯示統計資訊
client/src/pages/Dashboard.tsx
```

---

## 四、實施計畫與優先級

### Phase 62：商品詳情頁面（P0）
**預估工時**：4-6 小時

**任務清單**：
- [ ] 建立 `ProductDetail.tsx` 頁面
- [ ] 在 `App.tsx` 註冊路由 `/products/:sku`
- [ ] 實作基本資訊區塊
- [ ] 實作家族商品區塊
- [ ] 實作商品關聯區塊
- [ ] 實作相關影片區塊
- [ ] 修改 `Products.tsx` 的 `handleProductClick` 函數
- [ ] 測試所有功能
- [ ] 建立 checkpoint

### Phase 63：商品編輯與刪除（P1）
**預估工時**：3-4 小時

**任務清單**：
- [ ] 建立 `ProductEditDialog.tsx` 組件
- [ ] 建立 `ProductDeleteDialog.tsx` 組件
- [ ] 實作刪除 API (`products.delete`)
- [ ] 在商品詳情頁整合編輯/刪除功能
- [ ] 測試權限控制
- [ ] 測試級聯刪除邏輯
- [ ] 建立 checkpoint

### Phase 64：商品與影片關聯優化（P1）
**預估工時**：4-5 小時

**任務清單**：
- [ ] 更新 `drizzle/schema.ts` 新增 `video_products` 資料表
- [ ] 執行 `pnpm db:push` 建立資料表
- [ ] 建立資料遷移腳本 `migrate-video-products.ts`
- [ ] 執行資料遷移
- [ ] 更新 `getRelatedVideos` API 使用新的關聯查詢
- [ ] 測試查詢效能
- [ ] 建立 checkpoint

### Phase 65：商品家族視覺化（P2）
**預估工時**：3-4 小時

**任務清單**：
- [ ] 在商品詳情頁新增家族商品區塊
- [ ] 實作卡片模式顯示
- [ ] 實作樹狀圖顯示（選用）
- [ ] 標示當前商品
- [ ] 測試切換功能
- [ ] 建立 checkpoint

### Phase 66：商品關聯管理 UI（P2）
**預估工時**：4-5 小時

**任務清單**：
- [ ] 建立 `ProductRelationsManager.tsx` 組件
- [ ] 實作新增關聯功能
- [ ] 實作刪除關聯 API (`products.deleteRelation`)
- [ ] 實作刪除關聯功能
- [ ] 測試雙向關聯邏輯
- [ ] 建立 checkpoint

### Phase 67：商品統計與分析（P3）
**預估工時**：2-3 小時

**任務清單**：
- [ ] 實作 `products.getStats` API
- [ ] 在 Dashboard 頁面顯示商品統計
- [ ] 建立商品統計卡片組件
- [ ] 測試統計數據準確性
- [ ] 建立 checkpoint

---

## 五、技術考量

### 5.1 效能優化
- 商品列表使用分頁載入（已實作）
- 商品詳情頁使用 React Query 快取
- 家族商品查詢使用資料庫索引（`familyCode` 欄位）
- 相關影片查詢使用中介資料表索引

### 5.2 使用者體驗
- 使用 Skeleton 處理載入狀態
- 使用 Toast 提示操作結果
- 使用確認對話框防止誤刪
- 使用樂觀更新提升互動體驗

### 5.3 權限控制
- 商品編輯/刪除功能限制 Admin 角色
- 商品關聯管理限制 Admin 角色
- 商品查詢與詳情頁面開放所有角色

### 5.4 資料一致性
- 使用資料庫外鍵約束確保關聯完整性
- 使用 `ON DELETE CASCADE` 自動清理關聯記錄
- 使用交易（Transaction）確保批次操作原子性

---

## 六、總結

商品知識中樞是影片整理網站的核心功能,目前已具備基礎架構,但仍有多項關鍵功能待實作。建議優先實作 **Phase 62（商品詳情頁面）**,這是使用者最迫切需要的功能,也是其他進階功能的基礎。

後續可依序實作 Phase 63-67,逐步完善商品知識中樞的功能,提升使用者體驗與管理效率。

**預估總工時**：20-27 小時（分 6 個 Phase 完成）

**建議實施順序**：Phase 62 → Phase 63 → Phase 64 → Phase 65 → Phase 66 → Phase 67
