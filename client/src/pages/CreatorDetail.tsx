import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User, Film, Eye, Star, BarChart3 } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const categoryLabels: Record<string, string> = {
  product_intro: '使用介紹',
  maintenance: '維修',
  case_study: '案例',
  faq: '常見問題',
  other: '其他',
};

const platformLabels: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: '抖音',
  redbook: '小紅書',
};

export default function CreatorDetail() {
  const { creatorName } = useParams();
  const [, setLocation] = useLocation();

  const { data, isLoading } = trpc.dashboard.getCreatorDetail.useQuery(
    { creatorName: decodeURIComponent(creatorName || '') },
    { enabled: !!creatorName }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data || data.videos.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setLocation('/board')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回影片看板
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                找不到創作者資訊
              </h3>
              <p className="text-sm text-muted-foreground">
                該創作者尚無影片資料
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { creator, videos, stats } = data;

  // 準備圖表數據
  const categoryChartData = stats.categoryDistribution.map(item => ({
    name: categoryLabels[item.category] || item.category,
    value: item.count,
  }));

  const platformChartData = stats.platformDistribution.map(item => ({
    name: platformLabels[item.platform] || item.platform,
    value: item.count,
  }));

  const monthlyTrendData = stats.monthlyTrend.map(item => ({
    month: item.month,
    count: item.count,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 返回按鈕 */}
        <Button variant="ghost" onClick={() => setLocation('/board')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回影片看板
        </Button>

        {/* 創作者資訊卡片 */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{creator}</CardTitle>
                <CardDescription>創作者詳情頁面</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Film className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">總影片數</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalVideos}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Eye className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">總觀看次數</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalViewCount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <Star className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">平均評分</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.averageRating > 0 ? stats.averageRating : '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">平台數量</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.platformDistribution.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 圖表區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 分類分佈圓餅圖 */}
          {categoryChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>影片分類分佈</CardTitle>
                <CardDescription>各分類影片數量統計</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 平台分佈長條圖 */}
          {platformChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>平台分佈</CardTitle>
                <CardDescription>各平台影片數量統計</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#10b981" name="影片數量" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 每月趨勢折線圖 */}
          {monthlyTrendData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>每月影片趨勢</CardTitle>
                <CardDescription>最近 6 個月影片發布數量</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="影片數量" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 影片列表 */}
        <Card>
          <CardHeader>
            <CardTitle>影片列表</CardTitle>
            <CardDescription>該創作者的所有影片（共 {videos.length} 部）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  showActions={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
