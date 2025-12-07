import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Film, FileText, CheckCircle, Clock, XCircle, Eye, Users } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MyContributions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Admin 專屬：列出所有使用者
  const { data: allUsers } = trpc.myContributions.listUsers.useQuery(undefined, {
    enabled: isAdmin,
  });
  
  // 根據選擇的使用者或當前使用者查詢資料
  const targetUserId = selectedUserId || user?.id;
  
  const { data: stats, isLoading: statsLoading } = selectedUserId
    ? trpc.myContributions.getUserStats.useQuery({ userId: selectedUserId })
    : trpc.myContributions.getStats.useQuery();
  
  const { data: myVideos, isLoading: videosLoading } = selectedUserId
    ? trpc.myContributions.getUserVideos.useQuery({ userId: selectedUserId })
    : trpc.myContributions.getMyVideos.useQuery();
  
  const { data: myNotes, isLoading: notesLoading } = selectedUserId
    ? trpc.myContributions.getUserNotes.useQuery({ userId: selectedUserId })
    : trpc.myContributions.getMyNotes.useQuery();

  const isLoading = statsLoading || videosLoading || notesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">我的貢獻</h1>
              <p className="text-muted-foreground">
                查看您提交的影片與時間軸筆記，追蹤審核狀態與貢獻統計
              </p>
            </div>
            
            {/* Admin 專屬：人員下拉選單 */}
            {isAdmin && allUsers && allUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedUserId || "me"}
                  onValueChange={(value) => setSelectedUserId(value === "me" ? null : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="選擇人員" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">我的貢獻</SelectItem>
                    {allUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* 貢獻統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">我的影片</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
              <p className="text-xs text-muted-foreground">
                提交的影片總數
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">我的筆記</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalNotes || 0}</div>
              <p className="text-xs text-muted-foreground">
                提交的筆記總數
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已通過</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.approvedNotes || 0}</div>
              <p className="text-xs text-muted-foreground">
                審核通過的筆記
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待審核</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.pendingNotes || 0}</div>
              <p className="text-xs text-muted-foreground">
                等待審核的筆記
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已拒絕</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.rejectedNotes || 0}</div>
              <p className="text-xs text-muted-foreground">
                被拒絕的筆記
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 我提交的影片 */}
        <Card>
          <CardHeader>
            <CardTitle>我提交的影片</CardTitle>
            <CardDescription>您上傳到系統的所有影片</CardDescription>
          </CardHeader>
          <CardContent>
            {myVideos && myVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myVideos.map((video) => (
                  <Link key={video.id} href={`/video/${video.id}`}>
                    <div className="group cursor-pointer rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                      <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Eye className="h-3 w-3" />
                        <span>{video.viewCount || 0} 次觀看</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {video.platform === 'youtube' ? 'YouTube' : 
                           video.platform === 'tiktok' ? '抖音' : '小紅書'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {video.category || '未分類'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>您還沒有提交任何影片</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 我提交的時間軸筆記 */}
        <Card>
          <CardHeader>
            <CardTitle>我提交的時間軸筆記</CardTitle>
            <CardDescription>您在影片中新增的所有時間軸筆記與審核狀態</CardDescription>
          </CardHeader>
          <CardContent>
            {myNotes && myNotes.length > 0 ? (
              <div className="space-y-4">
                {myNotes.map((note) => {
                  const statusIcon = note.status === 'APPROVED' ? CheckCircle : 
                                    note.status === 'REJECTED' ? XCircle : Clock;
                  const statusColor = note.status === 'APPROVED' ? 'text-green-600' : 
                                     note.status === 'REJECTED' ? 'text-red-600' : 'text-orange-600';
                  const statusBg = note.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-950/20' : 
                                  note.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-orange-50 dark:bg-orange-950/20';
                  const statusText = note.status === 'APPROVED' ? '已通過' : 
                                    note.status === 'REJECTED' ? '已拒絕' : '待審核';
                  const Icon = statusIcon;
                  
                  return (
                    <div key={note.id} className={`p-4 rounded-lg border ${statusBg}`}>
                      <div className="flex items-start gap-4">
                        <Icon className={`h-5 w-5 ${statusColor} mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={statusColor}>
                              {statusText}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(note.timeSeconds / 60)}:{String(note.timeSeconds % 60).padStart(2, '0')}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{note.content}</p>
                          {note.imageUrls && note.imageUrls.length > 0 && (
                            <div className="flex gap-2 mb-2">
                              {note.imageUrls.map((url, index) => (
                                <img 
                                  key={index}
                                  src={url} 
                                  alt={`筆記圖片 ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                          {note.status === 'REJECTED' && note.rejectReason && (
                            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-200">
                              <strong>拒絕原因：</strong> {note.rejectReason}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            提交時間：{new Date(note.createdAt).toLocaleString('zh-TW')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>您還沒有提交任何時間軸筆記</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
