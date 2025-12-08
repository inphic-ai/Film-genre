import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Activity, Database, Users, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PerformanceMonitor() {
  const [days, setDays] = useState(7);

  const { data: systemHealth, isLoading: healthLoading } = trpc.performanceMonitor.getSystemHealth.useQuery();
  const { data: apiStats, isLoading: apiStatsLoading } = trpc.performanceMonitor.getApiStats.useQuery({ days });
  const { data: dbStats, isLoading: dbStatsLoading } = trpc.performanceMonitor.getDbStats.useQuery({ days });
  const { data: userActivity, isLoading: activityLoading } = trpc.performanceMonitor.getUserActivity.useQuery({ days, limit: 50 });

  const isLoading = healthLoading || apiStatsLoading || dbStatsLoading || activityLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // System health status badge
  const getHealthBadge = (status?: string) => {
    if (status === 'healthy') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />正常</Badge>;
    } else if (status === 'warning') {
      return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" />警告</Badge>;
    } else {
      return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" />異常</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">效能監控儀表板</h1>
            <p className="text-muted-foreground">
              系統效能監控、API 回應時間追蹤、使用者活動統計
            </p>
          </div>
          <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value))}>
            <SelectTrigger className="w-[180px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">最近 1 天</SelectItem>
              <SelectItem value="7">最近 7 天</SelectItem>
              <SelectItem value="30">最近 30 天</SelectItem>
              <SelectItem value="90">最近 90 天</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">系統狀態</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{getHealthBadge(systemHealth?.status)}</div>
              <p className="text-xs text-muted-foreground">
                最後檢查：{systemHealth?.lastChecked ? new Date(systemHealth.lastChecked).toLocaleTimeString('zh-TW') : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均回應時間</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth?.avgResponseTime || 0} ms</div>
              <p className="text-xs text-muted-foreground">
                最近 5 分鐘
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">錯誤率</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth?.errorRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                最近 5 分鐘
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">請求數量</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth?.requestCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                最近 5 分鐘
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed stats */}
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList>
            <TabsTrigger value="api">API 效能</TabsTrigger>
            <TabsTrigger value="database">資料庫效能</TabsTrigger>
            <TabsTrigger value="activity">使用者活動</TabsTrigger>
          </TabsList>

          {/* API Performance Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>總請求數</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{apiStats?.totalRequests || 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>平均回應時間</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{apiStats?.avgResponseTime || 0} ms</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    最小：{apiStats?.minResponseTime || 0} ms | 最大：{apiStats?.maxResponseTime || 0} ms
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>狀態碼分佈</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {apiStats?.statusCodeCounts && Object.entries(apiStats.statusCodeCounts).map(([code, count]) => (
                      <div key={code} className="flex items-center justify-between">
                        <Badge variant={code.startsWith('2') ? 'default' : 'destructive'}>{code}</Badge>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>最慢的 API 端點</CardTitle>
                <CardDescription>平均回應時間最長的 10 個端點</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiStats?.slowestEndpoints && apiStats.slowestEndpoints.length > 0 ? (
                    apiStats.slowestEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{endpoint.endpoint}</div>
                          <div className="text-xs text-muted-foreground">請求數：{endpoint.requestCount}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{endpoint.avgResponseTime} ms</div>
                          <div className="text-xs text-muted-foreground">最大：{endpoint.maxResponseTime} ms</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">尚無資料</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Performance Tab */}
          <TabsContent value="database" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>總查詢數</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{dbStats?.totalQueries || 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>平均查詢時間</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{dbStats?.avgQueryTime || 0} ms</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>最慢查詢</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{dbStats?.maxQueryTime || 0} ms</div></CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>慢查詢列表</CardTitle>
                <CardDescription>查詢時間最長的 20 個資料庫查詢</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {dbStats?.slowQueries && dbStats.slowQueries.length > 0 ? (
                    dbStats.slowQueries.map((query, index) => (
                      <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-muted">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{query.endpoint}</div>
                          <div className="text-xs text-muted-foreground">{new Date(query.createdAt).toLocaleString('zh-TW')}</div>
                        </div>
                        <div className="text-sm font-bold ml-4">{query.responseTime} ms</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">尚無資料</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>總活動數</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{userActivity?.totalActivities || 0}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>操作類型分佈</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userActivity?.actionCounts && Object.entries(userActivity.actionCounts).slice(0, 5).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between">
                        <span className="text-sm">{action}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>最活躍使用者</CardTitle>
                <CardDescription>活動次數最多的 10 位使用者</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userActivity?.mostActiveUsers && userActivity.mostActiveUsers.length > 0 ? (
                    userActivity.mostActiveUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div><div className="text-sm font-medium">使用者 ID: {user.userId}</div></div>
                        </div>
                        <Badge variant="secondary">{user.activityCount} 次活動</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">尚無資料</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
