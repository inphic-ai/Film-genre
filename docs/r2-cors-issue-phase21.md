# R2 CORS 與公開存取問題（Phase 21.1）

**診斷時間**: 2025-12-07 03:20  
**問題描述**: 縮圖成功上傳到 Cloudflare R2，但前端無法顯示圖片

---

## 問題診斷

### 1. R2 上傳驗證

✅ **縮圖已成功上傳到 R2**

**證據**：
- Cloudflare R2 控制台顯示 `thumbnails/` 資料夾
- R2 Bucket 統計：186 B 儲存空間、35 個 A 類操作、29 個 B 類操作

### 2. 前端載入驗證

✅ **前端已正確載入縮圖 URL**

**Console 檢查結果**：
```javascript
{
  hasCard: true,
  hasImg: true,
  imgSrc: "https://14a73ec296e8619d856c15bf5290a433.r2.cloudflarestorage.com/thumbnails/video-28-1765095521678.jpg",
  imgLoaded: true,
  imgNaturalWidth: 0,  // ❌ 圖片載入失敗
  imgNaturalHeight: 0  // ❌ 圖片載入失敗
}
```

**問題**：
- `imgNaturalWidth: 0` 和 `imgNaturalHeight: 0` 表示圖片無法正確載入
- 可能原因：CORS 錯誤、權限問題、或圖片檔案損壞

### 3. 截圖證據

**影片看板截圖**：
- 第一張卡片顯示「縮圖」文字（alt text）
- 圖片區域為空白（灰色背景）
- 證實 `<img>` 元素已渲染，但圖片無法顯示

---

## 問題根源

### 可能原因 1：R2 Bucket 未設定公開存取

Cloudflare R2 預設為**私有存取**，需要手動設定公開存取權限。

**解決方案**：
1. 前往 Cloudflare R2 控制台
2. 選擇 `categorymanagement` Bucket
3. 點擊「設定」→「公開存取」
4. 啟用「允許公開存取」

### 可能原因 2：CORS 政策未設定

即使 Bucket 為公開，瀏覽器可能因 CORS 政策阻止跨域圖片載入。

**解決方案**：
1. 前往 Cloudflare R2 控制台
2. 選擇 `categorymanagement` Bucket
3. 點擊「設定」→「CORS 政策」
4. 新增 CORS 規則：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 可能原因 3：R2 Public URL 設定錯誤

目前使用的 URL 格式：
```
https://14a73ec296e8619d856c15bf5290a433.r2.cloudflarestorage.com/thumbnails/video-28-1765095521678.jpg
```

**問題**：這是 R2 的內部 endpoint，可能不支援公開存取。

**正確的公開 URL 格式**：
- 選項 A：使用 R2 Custom Domain（推薦）
  ```
  https://cdn.yourdomain.com/thumbnails/video-28-1765095521678.jpg
  ```
- 選項 B：使用 R2 Public Bucket URL
  ```
  https://pub-<hash>.r2.dev/thumbnails/video-28-1765095521678.jpg
  ```

### 可能原因 4：圖片檔案損壞

測試圖片可能在 Base64 轉換或上傳過程中損壞。

**驗證方式**：
1. 直接在瀏覽器開啟 R2 URL
2. 檢查是否能正常顯示圖片
3. 如果無法顯示，重新上傳測試圖片

---

## 建議解決方案

### 方案 A：設定 R2 Custom Domain（推薦）

**優點**：
- 完全控制 URL 格式
- 支援 CDN 加速
- 更好的 SEO 與品牌形象

**步驟**：
1. 在 Cloudflare R2 控制台新增 Custom Domain
2. 設定 DNS CNAME 記錄指向 R2 Bucket
3. 更新 `R2_PUBLIC_URL` 環境變數為 Custom Domain
4. 重新部署應用程式

### 方案 B：啟用 R2 Public Bucket（快速）

**優點**：
- 快速設定
- 無需額外 DNS 設定

**步驟**：
1. 在 Cloudflare R2 控制台啟用「Public Bucket」
2. 取得 Public Bucket URL（格式：`https://pub-<hash>.r2.dev`）
3. 更新 `R2_PUBLIC_URL` 環境變數
4. 重新部署應用程式

### 方案 C：設定 CORS 政策（必要）

無論選擇方案 A 或 B，都需要設定 CORS 政策以允許瀏覽器載入圖片。

**CORS 規則**：
```json
[
  {
    "AllowedOrigins": ["https://film-genre-production.up.railway.app"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 下一步行動

1. **檢查 R2 Bucket 設定**：
   - 確認是否已啟用公開存取
   - 確認 CORS 政策是否正確設定

2. **選擇公開 URL 方案**：
   - 方案 A：設定 Custom Domain（推薦）
   - 方案 B：啟用 Public Bucket（快速）

3. **更新環境變數**：
   - 設定 `R2_PUBLIC_URL` 為正確的公開 URL
   - 重新部署到 Railway

4. **驗證圖片顯示**：
   - 直接在瀏覽器開啟 R2 URL
   - 檢查影片看板的縮圖顯示
   - 確認圖片正確載入

---

## 技術細節

### 目前的 R2 設定

**環境變數**（server/_core/env.ts）：
```typescript
r2BucketName: "categorymanagement",
r2Endpoint: "https://14a73ec296e8619d856c15bf5290a433.r2.cloudflarestorage.com",
r2PublicUrl: "", // ❌ 未設定
```

### 上傳成功的檔案

**檔案路徑**：`thumbnails/video-28-1765095521678.jpg`  
**完整 URL**：`https://14a73ec296e8619d856c15bf5290a433.r2.cloudflarestorage.com/thumbnails/video-28-1765095521678.jpg`  
**檔案大小**：約 186 B（R2 Bucket 統計）

### 前端渲染狀態

**VideoCard.tsx 邏輯**（第 53-59 行）：
```tsx
{video.thumbnailUrl && (
  <img
    src={video.thumbnailUrl}
    alt={video.title}
    className="w-full h-full object-cover"
  />
)}
```

**實際渲染**：
- ✅ `video.thumbnailUrl` 存在
- ✅ `<img>` 元素已渲染
- ❌ 圖片無法載入（naturalWidth: 0）
