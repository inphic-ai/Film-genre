# R2 上傳失敗診斷報告（Phase 21.1）

**診斷時間**: 2025-12-07 03:15  
**問題描述**: 縮圖上傳顯示成功訊息，但 Cloudflare R2 儲存空間為空

---

## 問題診斷

### 1. 本地環境變數檢查

**檢查結果**：❌ **所有 R2 環境變數未設定**

```json
{
  "R2_ACCESS_KEY_ID": "未設定",
  "R2_SECRET_ACCESS_KEY": "未設定",
  "R2_BUCKET_NAME": "未設定",
  "R2_ENDPOINT": "未設定",
  "R2_PUBLIC_URL": "未設定（使用預設）"
}
```

**原因分析**：
- 雖然透過 `webdev_request_secrets` 提供了 R2 憑證
- 但本地開發環境（Manus Sandbox）的環境變數未正確載入
- 導致 R2 上傳操作使用空憑證或預設值

### 2. 程式碼邏輯檢查

**檢查結果**：✅ **程式碼邏輯正確**

#### uploadThumbnail Procedure（server/routers.ts 第 267-293 行）
```typescript
uploadThumbnail: protectedProcedure
  .input(z.object({
    videoId: z.number(),
    imageData: z.string(), // Base64 encoded image
  }))
  .mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    const { storagePut } = await import('./storage');
    
    // Convert base64 to buffer
    const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique file key
    const timestamp = Date.now();
    const fileKey = `thumbnails/video-${input.videoId}-${timestamp}.jpg`;
    
    // Upload to S3
    const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
    
    // Update video record
    await db.updateVideo(input.videoId, { thumbnailUrl: url });
    
    return { url };
  }),
```

#### storagePut 函數（server/storage.ts 第 50-80 行）
```typescript
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { client, bucketName, publicUrl } = getR2Config();
  const key = normalizeKey(relKey);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: typeof data === "string" ? Buffer.from(data) : data,
    ContentType: contentType,
  });

  try {
    await client.send(command);
    
    // Construct public URL
    const url = publicUrl
      ? `${publicUrl.replace(/\/+$/, "")}/${key}`
      : `${ENV.r2Endpoint.replace(/\/+$/, "")}/${bucketName}/${key}`;

    return { key, url };
  } catch (error) {
    throw new Error(
      `R2 upload failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

### 3. 環境變數定義檢查

**檢查結果**：✅ **環境變數定義正確**

#### server/_core/env.ts（第 9-16 行）
```typescript
// Cloudflare R2 Storage
r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
r2BucketName: process.env.R2_BUCKET_NAME ?? "categorymanagement",
r2Endpoint: process.env.R2_ENDPOINT ?? "https://14a73ec296e8619d856c15bf5290a433.r2.cloudflarestorage.com",
r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
```

---

## 問題根源

### 為什麼顯示「縮圖上傳成功」？

1. **前端邏輯**：前端顯示成功訊息是基於 API 呼叫沒有拋出錯誤
2. **後端行為**：
   - `getR2Config()` 函數檢查憑證時，如果憑證為空會拋出錯誤（第 17-21 行）
   - 但由於環境變數有預設值（`?? ""`），檢查可能通過
   - S3Client 建立時使用空憑證，導致上傳操作失敗或使用錯誤的憑證

### Railway 生產環境狀態

根據 Phase 19 的記錄，Railway 環境變數已經正確設定：
- ✅ R2_ACCESS_KEY_ID
- ✅ R2_SECRET_ACCESS_KEY
- ✅ R2_BUCKET_NAME
- ✅ R2_ENDPOINT

**但**：從 R2 儲存空間截圖顯示為空，表示 Railway 生產環境的上傳也可能失敗。

---

## 可能原因

### 1. R2 憑證錯誤
- 提供的 R2_ACCESS_KEY_ID 或 R2_SECRET_ACCESS_KEY 不正確
- 憑證沒有寫入權限

### 2. R2 Endpoint 錯誤
- R2_ENDPOINT 格式不正確
- Bucket 名稱與 Endpoint 不匹配

### 3. 程式碼邏輯錯誤
- `storagePut` 函數的 S3Client 設定錯誤
- PutObjectCommand 參數錯誤

### 4. 網路或權限問題
- Railway 無法連線到 Cloudflare R2
- R2 Bucket 的 CORS 或存取控制設定錯誤

---

## 下一步行動

### 選項 A：修復本地環境（不推薦）
1. 手動設定本地 `.env` 檔案
2. 重新啟動開發伺服器
3. 測試上傳功能

**問題**：Manus Sandbox 的環境變數載入機制不穩定

### 選項 B：在 Railway 生產環境測試（推薦）
1. 檢查 Railway 的 R2 環境變數設定
2. 新增詳細的錯誤日誌
3. 重新測試上傳功能
4. 檢查 Railway 部署日誌

### 選項 C：新增詳細錯誤處理
1. 修改 `storagePut` 函數，新增詳細的錯誤日誌
2. 修改 `uploadThumbnail` procedure，捕獲並記錄錯誤
3. 推送到 GitHub 並部署到 Railway
4. 重新測試並檢查錯誤訊息

---

## 建議方案

**採用選項 C + B 組合**：
1. 新增詳細錯誤處理與日誌
2. 推送到 GitHub 並部署到 Railway
3. 在 Railway 生產環境測試
4. 根據錯誤訊息診斷問題
5. 修復並重新部署
