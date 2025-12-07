import { z } from 'zod';
import { publicProcedure, router } from '../../_core/trpc';
import { invokeLLM } from '../../_core/llm';
import { getDb } from '../../db';
import { videos, tags, videoTags } from '../../../drizzle/schema';
import { and, eq, gte, lte, ilike, desc, asc, sql, or, inArray } from 'drizzle-orm';

// 解析後的查詢條件 Schema
const parsedQuerySchema = z.object({
  rating: z.object({
    min: z.number().min(1).max(5).optional(),
    max: z.number().min(1).max(5).optional(),
  }).optional(),
  category: z.enum(['product_intro', 'maintenance', 'case_study', 'faq', 'other']).optional(),
  platform: z.enum(['youtube', 'tiktok', 'redbook']).optional(),
  shareStatus: z.enum(['private', 'public']).optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  sortBy: z.enum(['rating', 'viewCount', 'createdAt', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type ParsedQuery = z.infer<typeof parsedQuerySchema>;

// LLM System Prompt
const SYSTEM_PROMPT = `你是一個影片搜尋查詢解析器。請將使用者的自然語言查詢解析為結構化的搜尋條件。

可用的搜尋條件：
- rating: 評分範圍（1-5 星），使用 min 和 max 表示範圍
- category: 影片分類
  * product_intro: 使用介紹
  * maintenance: 維修
  * case_study: 案例
  * faq: 常見問題
  * other: 其他
- platform: 平台
  * youtube: YouTube
  * tiktok: 抖音
  * redbook: 小紅書
- shareStatus: 分享狀態
  * private: 私人
  * public: 公開
- tags: 標籤陣列（商品編號或關鍵字）
- keywords: 關鍵字陣列（用於搜尋標題、描述）
- sortBy: 排序欄位
  * rating: 評分
  * viewCount: 觀看次數
  * createdAt: 建立時間
  * title: 標題
- sortOrder: 排序方向
  * asc: 升序
  * desc: 降序

解析規則：
1. 如果查詢中沒有提到某個條件，則不要包含該欄位
2. 評分相關：「4 星以上」= { min: 4 }，「3-5 星」= { min: 3, max: 5 }
3. 排序相關：「最新」= { sortBy: "createdAt", sortOrder: "desc" }，「評分高」= { sortBy: "rating", sortOrder: "desc" }
4. 關鍵字：提取查詢中的關鍵詞（例如：「維修」、「使用說明」）
5. 標籤：識別商品編號格式（英文3碼+數字6碼+a/b/c，例如：ABC123456a）
6. 平台別名：「抖音」= tiktok，「小紅書」= redbook

請以 JSON 格式回傳解析結果。`;

export const aiSearchRouter = router({
  /**
   * 解析自然語言查詢
   */
  parseQuery: publicProcedure
    .input(z.object({
      query: z.string().min(1, '查詢不能為空'),
    }))
    .output(parsedQuerySchema)
    .mutation(async ({ input }: { input: { query: string } }) => {
      const { query } = input;

      try {
        // 呼叫 LLM API 解析查詢
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `請解析以下查詢：${query}` },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'parsed_query',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  rating: {
                    type: 'object',
                    properties: {
                      min: { type: 'number' },
                      max: { type: 'number' },
                    },
                    additionalProperties: false,
                  },
                  category: {
                    type: 'string',
                    enum: ['product_intro', 'maintenance', 'case_study', 'faq', 'other'],
                  },
                  platform: {
                    type: 'string',
                    enum: ['youtube', 'tiktok', 'redbook'],
                  },
                  shareStatus: {
                    type: 'string',
                    enum: ['private', 'public'],
                  },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  sortBy: {
                    type: 'string',
                    enum: ['rating', 'viewCount', 'createdAt', 'title'],
                  },
                  sortOrder: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                  },
                },
                additionalProperties: false,
              },
            },
          },
        });

        // 解析 LLM 回應
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error('LLM 未回傳內容');
        }

        const parsedQuery = JSON.parse(content);

        // 驗證解析結果
        const validated = parsedQuerySchema.parse(parsedQuery);

        console.log('[AI Search] 查詢解析成功:', {
          originalQuery: query,
          parsedQuery: validated,
        });

        return validated;
      } catch (error) {
        console.error('[AI Search] 查詢解析失敗:', error);
        throw new Error('無法解析查詢，請嘗試更具體的描述');
      }
    }),

  /**
   * 根據解析結果執行搜尋
   */
  search: publicProcedure
    .input(z.object({
      parsedQuery: parsedQuerySchema,
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }: { input: { parsedQuery: ParsedQuery; limit: number; offset: number } }) => {
      const { parsedQuery, limit, offset } = input;

      try {
        const db = await getDb();
        if (!db) {
          throw new Error('資料庫連線失敗');
        }

        // 如果有標籤條件，需要先查詢符合標籤的影片 ID
        let videoIdsWithTags: number[] | undefined;
        if (parsedQuery.tags && parsedQuery.tags.length > 0) {
          // 查詢符合標籤名稱的 tag IDs
          const matchedTags = await db
            .select({ id: tags.id })
            .from(tags)
            .where(inArray(tags.name, parsedQuery.tags));

          const tagIds = matchedTags.map((t: { id: number }) => t.id);

          if (tagIds.length > 0) {
            // 查詢包含這些標籤的影片 IDs
            const videoTagsResults = await db
              .select({ videoId: videoTags.videoId })
              .from(videoTags)
              .where(inArray(videoTags.tagId, tagIds));

            const uniqueVideoIds = new Set<number>();
            videoTagsResults.forEach((vt: { videoId: number }) => uniqueVideoIds.add(vt.videoId));
            videoIdsWithTags = Array.from(uniqueVideoIds);
          } else {
            // 沒有符合的標籤，返回空結果
            videoIdsWithTags = [];
          }
        }

        // 建立查詢條件
        const conditions: any[] = [];

        // 如果有標籤條件且找到符合的影片 IDs
        if (videoIdsWithTags !== undefined) {
          if (videoIdsWithTags.length === 0) {
            // 沒有符合標籤的影片，直接返回空結果
            return {
              videos: [],
              total: 0,
              query: parsedQuery,
            };
          }
          conditions.push(inArray(videos.id, videoIdsWithTags));
        }

        // 評分條件
        if (parsedQuery.rating) {
          if (parsedQuery.rating.min !== undefined) {
            conditions.push(gte(videos.rating, parsedQuery.rating.min));
          }
          if (parsedQuery.rating.max !== undefined) {
            conditions.push(lte(videos.rating, parsedQuery.rating.max));
          }
        }

        // 分類條件
        if (parsedQuery.category) {
          conditions.push(eq(videos.category, parsedQuery.category));
        }

        // 平台條件
        if (parsedQuery.platform) {
          conditions.push(eq(videos.platform, parsedQuery.platform));
        }

        // 分享狀態條件
        if (parsedQuery.shareStatus) {
          conditions.push(eq(videos.shareStatus, parsedQuery.shareStatus));
        }

        // 關鍵字條件（搜尋標題和描述）
        if (parsedQuery.keywords && parsedQuery.keywords.length > 0) {
          const keywordConditions = parsedQuery.keywords.flatMap((keyword: string) => [
            ilike(videos.title, `%${keyword}%`),
            ilike(videos.description, `%${keyword}%`),
          ]);
          conditions.push(or(...keywordConditions));
        }

        // 執行查詢
        let query = db
          .select()
          .from(videos)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        // 排序
        const sortBy = parsedQuery.sortBy || 'createdAt';
        const sortOrder = parsedQuery.sortOrder || 'desc';
        
        // 根據 sortBy 選擇排序欄位
        if (sortBy === 'rating') {
          query = query.orderBy(sortOrder === 'desc' ? desc(videos.rating) : asc(videos.rating)) as any;
        } else if (sortBy === 'viewCount') {
          query = query.orderBy(sortOrder === 'desc' ? desc(videos.viewCount) : asc(videos.viewCount)) as any;
        } else if (sortBy === 'title') {
          query = query.orderBy(sortOrder === 'desc' ? desc(videos.title) : asc(videos.title)) as any;
        } else {
          // 預設按建立時間排序
          query = query.orderBy(sortOrder === 'desc' ? desc(videos.createdAt) : asc(videos.createdAt)) as any;
        }

        // 分頁
        query = query.limit(limit).offset(offset) as any;

        const results = await query;

        // 計算總數
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(videos)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const [{ count }] = await countQuery;

        console.log('[AI Search] 搜尋完成:', {
          parsedQuery,
          resultsCount: results.length,
          total: count,
        });

        return {
          videos: results,
          total: Number(count),
          query: parsedQuery,
        };
      } catch (error) {
        console.error('[AI Search] 搜尋失敗:', error);
        throw new Error('搜尋失敗，請稍後再試');
      }
    }),
});
