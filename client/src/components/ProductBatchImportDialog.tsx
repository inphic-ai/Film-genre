import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ProductBatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedProduct {
  sku: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
}

export function ProductBatchImportDialog({ open, onOpenChange }: ProductBatchImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const utils = trpc.useUtils();

  const importMutation = trpc.products.importBatch.useMutation({
    onSuccess: (result) => {
      toast.success(`匯入完成！成功：${result.success}，跳過：${result.skipped}，失敗：${result.failed}`);
      if (result.errors.length > 0) {
        console.error("匯入錯誤：", result.errors);
      }
      utils.products.list.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error(`匯入失敗：${error.message}`);
      setIsImporting(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setParsedProducts([]);

    try {
      const text = await selectedFile.text();
      const products = parseCSV(text);
      setParsedProducts(products);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "解析檔案失敗");
    }
  };

  const parseCSV = (text: string): ParsedProduct[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV 檔案至少需要標題行與一行資料");
    }

    // 解析標題行
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const skuIndex = headers.indexOf("sku");
    const nameIndex = headers.indexOf("name") !== -1 ? headers.indexOf("name") : headers.indexOf("商品名稱");
    const descIndex = headers.indexOf("description") !== -1 ? headers.indexOf("description") : headers.indexOf("描述");
    const thumbnailIndex = headers.indexOf("thumbnailurl") !== -1 ? headers.indexOf("thumbnailurl") : headers.indexOf("縮圖網址");

    if (skuIndex === -1 || nameIndex === -1) {
      throw new Error("CSV 檔案必須包含 'sku' 與 'name'（或 '商品名稱'）欄位");
    }

    // 解析資料行
    const products: ParsedProduct[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map(v => v.trim());
      const sku = values[skuIndex];
      const name = values[nameIndex];

      if (!sku || !name) {
        console.warn(`第 ${i + 1} 行資料不完整，已跳過`);
        continue;
      }

      products.push({
        sku,
        name,
        description: descIndex !== -1 ? values[descIndex] : undefined,
        thumbnailUrl: thumbnailIndex !== -1 ? values[thumbnailIndex] : undefined,
      });
    }

    if (products.length === 0) {
      throw new Error("未找到有效的商品資料");
    }

    return products;
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) {
      toast.error("請先選擇並解析 CSV 檔案");
      return;
    }

    setIsImporting(true);
    await importMutation.mutateAsync({ products: parsedProducts });
  };

  const handleClose = () => {
    setFile(null);
    setParsedProducts([]);
    setParseError(null);
    setIsImporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>批次匯入商品</DialogTitle>
          <DialogDescription>
            上傳 CSV 檔案批次匯入商品資料。檔案必須包含 'sku' 與 'name' 欄位。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 檔案上傳 */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">選擇 CSV 檔案</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>

          {/* CSV 格式說明 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>CSV 格式範例：</strong>
              <pre className="mt-2 text-xs bg-slate-100 p-2 rounded">
                sku,name,description,thumbnailUrl{"\n"}
                ABC-001,商品A,這是商品A的描述,https://example.com/image.jpg{"\n"}
                ABC-002,商品B,這是商品B的描述,
              </pre>
            </AlertDescription>
          </Alert>

          {/* 解析錯誤 */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* 解析成功 */}
          {parsedProducts.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                成功解析 {parsedProducts.length} 個商品資料
              </AlertDescription>
            </Alert>
          )}

          {/* 預覽前 5 筆資料 */}
          {parsedProducts.length > 0 && (
            <div className="space-y-2">
              <Label>預覽（前 5 筆）</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">名稱</th>
                      <th className="px-3 py-2 text-left">描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedProducts.slice(0, 5).map((product, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">{product.sku}</td>
                        <td className="px-3 py-2">{product.name}</td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-xs">
                          {product.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedProducts.length === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                匯入中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                開始匯入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
