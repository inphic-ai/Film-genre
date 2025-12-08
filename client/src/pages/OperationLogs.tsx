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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";

export default function OperationLogs() {
  const [action, setAction] = useState<string>('all');
  const [resourceType, setResourceType] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;
  
  const { data: logs, isLoading } = trpc.adminSettings.getAuditLogs.useQuery({
    action: action === 'all' ? undefined : action,
    resourceType: resourceType === 'all' ? undefined : resourceType,
    limit: pageSize,
    offset: page * pageSize,
  });
  
  const { data: stats } = trpc.adminSettings.getAuditStats.useQuery();
  
  const actionLabels: Record<string, string> = {
    CREATE_VIDEO: '新增影片',
    UPDATE_VIDEO: '編輯影片',
    DELETE_VIDEO: '刪除影片',
    BATCH_DELETE: '批次刪除',
    BATCH_UPDATE_CATEGORY: '批次修改分類',
    BATCH_UPDATE_SHARE_STATUS: '批次修改分享狀態',
    UPDATE_USER_ROLE: '修改使用者角色',
    UPDATE_USER: '編輯使用者',
    DELETE_USER: '刪除使用者',
    approve_note: '批准筆記',
    reject_note: '拒絕筆記',
    batch_approve: '批次批准',
    batch_reject: '批次拒絕',
  };
  
  const resourceTypeLabels: Record<string, string> = {
    VIDEO: '影片',
    NOTE: '筆記',
    USER: '使用者',
    TAG: '標籤',
    CATEGORY: '分類',
    PRODUCT: '商品',
  };
  
  return (
    <DashboardLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">操作日誌</h1>
        
        {/* 統計卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">總操作數</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最近 7 天操作</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.recentTrend.reduce((sum: number, log: any) => sum + log.count, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 篩選工具列 */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="操作類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              {Object.entries(actionLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={resourceType} onValueChange={setResourceType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="目標類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類型</SelectItem>
              {Object.entries(resourceTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => {
              setAction('all');
              setResourceType('all');
              setPage(0);
            }}
          >
            重置篩選
          </Button>
        </div>
        
        {/* 日誌列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">時間</TableHead>
                    <TableHead className="w-[120px]">操作者</TableHead>
                    <TableHead className="w-[180px]">操作類型</TableHead>
                    <TableHead className="w-[100px]">目標類型</TableHead>
                    <TableHead className="w-[100px]">目標 ID</TableHead>
                    <TableHead>詳情</TableHead>
                    <TableHead className="w-[120px]">IP 位址</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs && logs.logs.length > 0 ? (
                    logs.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-sm">{log.userName || '未知'}</TableCell>
                        <TableCell className="text-sm">
                          {actionLabels[log.action] || log.action}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.resourceType ? (resourceTypeLabels[log.resourceType] || log.resourceType) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{log.resourceId || '-'}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {log.details || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{log.ipAddress || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        沒有找到操作日誌
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* 分頁 */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {logs && logs.logs.length > 0 && (
                  <>
                    顯示 {page * pageSize + 1} - {Math.min((page + 1) * pageSize, logs.total)} 筆，
                    共 {logs.total.toLocaleString()} 筆記錄
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一頁
                </Button>
                <div className="text-sm text-muted-foreground">
                  第 {page + 1} 頁
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!logs || logs.logs.length < pageSize}
                >
                  下一頁
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
