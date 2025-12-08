import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Loader2, UserCircle, Film } from "lucide-react";
import { useLocation } from "wouter";

export default function Creators() {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch creator list
  const { data: creatorListData, isLoading } = trpc.dashboard.getCreatorList.useQuery({
    search: searchKeyword || undefined,
    limit,
    offset: (page - 1) * limit,
  });

  const creators = creatorListData?.creators || [];
  const totalPages = creatorListData ? Math.ceil(creatorListData.total / limit) : 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">創作者列表</h1>
            <p className="text-muted-foreground mt-1">
              查看所有影片創作者與影片數量
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>搜尋創作者</CardTitle>
            <CardDescription>輸入創作者名稱進行搜尋</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋創作者名稱..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator List */}
        <Card>
          <CardHeader>
            <CardTitle>創作者列表</CardTitle>
            <CardDescription>
              共 {creatorListData?.total || 0} 位創作者
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : creators.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>創作者名稱</TableHead>
                      <TableHead className="w-[150px]">影片數量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creators.map((creator: { creator: string | null; videoCount: number }, index: number) => (
                      <TableRow 
                        key={index}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (creator.creator) {
                            setLocation(`/creator/${encodeURIComponent(creator.creator)}`);
                          }
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-primary hover:underline">{creator.creator}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Film className="h-4 w-4 text-muted-foreground" />
                            <span className="text-primary hover:underline">{creator.videoCount} 部影片</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      第 {page} / {totalPages} 頁
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        上一頁
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        下一頁
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchKeyword ? "沒有找到符合條件的創作者" : "尚無創作者資料"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
