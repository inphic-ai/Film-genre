import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Package, 
  FileText, 
  Settings, 
  CheckSquare,
  Film,
  Plus,
  Search,
  Tag as TagIcon,
  Bell,
  Activity,
  Sparkles
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { NotificationBell } from "./NotificationBell";
import { AISearchDialog } from "./AISearchDialog";

const menuItems = [
  { icon: LayoutDashboard, label: "數據視覺化", path: "/dashboard", roles: ["admin", "staff", "viewer"] },
  { icon: Film, label: "影片看板", path: "/board", roles: ["admin", "staff", "viewer"] },
  { icon: Package, label: "商品知識中樞", path: "/products", roles: ["admin", "staff", "viewer"] },
  { icon: FileText, label: "我的貢獻", path: "/my-contributions", roles: ["admin", "staff"] },
  { icon: Bell, label: "通知中心", path: "/notifications", roles: ["admin", "staff", "viewer"] },
  { icon: TagIcon, label: "標籤管理", path: "/admin/tags", roles: ["admin"] },
  { icon: Settings, label: "系統管理", path: "/admin/settings", roles: ["admin"] },
  { icon: Activity, label: "效能監控", path: "/admin/performance", roles: ["admin"] },
  { icon: CheckSquare, label: "審核中心", path: "/admin/review", roles: ["admin"] },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 288;
const MIN_WIDTH = 240;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200/70">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8 text-emerald-500" />
              <h1 className="text-2xl font-semibold tracking-tight text-center">
                INPHIC 影片知識庫
              </h1>
            </div>
            <p className="text-sm text-slate-600 text-center max-w-sm">
              請登入以存取影片知識庫系統
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all"
          >
            登入系統
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  // 根據使用者角色過濾導航項目
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || "viewer")
  );

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 導航到看板總覽並傳遞搜尋關鍵字（使用 fullTextSearch API）
      setLocation(`/board?search=${encodeURIComponent(searchQuery.trim())}&useFullText=true`);
      setSearchQuery(""); // 清空搜尋框
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-emerald-500 text-white";
      case "staff":
        return "bg-sky-500 text-white";
      case "viewer":
        return "bg-slate-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "管理員";
      case "staff":
        return "員工";
      case "viewer":
        return "訪客";
      default:
        return "未知";
    }
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-slate-950 text-slate-50"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 justify-center border-b border-slate-800">
            <div className="flex items-center gap-3 px-4 transition-all w-full">
              {!isCollapsed ? (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 shrink-0">
                    <Film className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-base tracking-tight truncate text-slate-50">
                      INPHIC
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      影片知識庫系統
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 shrink-0">
                  <Film className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 bg-slate-950">
            <SidebarMenu className="px-3 py-4">
              {filteredMenuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-11 transition-all font-normal ${
                        isActive 
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" 
                          : "text-slate-300 hover:bg-slate-800 hover:text-slate-50"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-emerald-400" : "text-slate-400"}`}
                      />
                      <span className="text-sm">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-slate-800 bg-slate-950">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-800 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                  <Avatar className="h-9 w-9 border border-slate-700 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-slate-800 text-slate-50">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-slate-50">
                      {user?.name || "-"}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={`text-xs px-1.5 py-0 h-5 ${getRoleBadgeColor(user?.role || "viewer")}`}>
                        {getRoleLabel(user?.role || "viewer")}
                      </Badge>
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-emerald-500/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-slate-100">
        {/* 頂部導航列 */}
        <div className="flex border-b h-16 items-center justify-between bg-white/80 backdrop-blur px-4 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg" />}
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
              aria-label="Toggle navigation"
            >
              <PanelLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {activeMenuItem?.label || "INPHIC"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 全域搜尋框 */}
            <div className="hidden md:flex items-center gap-2">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="搜尋影片、商品編號、標籤..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-9 w-64 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl"
                />
              </form>
              
              {/* AI 智慧搜尋按鈕 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiSearchOpen(true)}
                className="h-9 gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600 font-medium">AI 搜尋</span>
              </Button>
            </div>

            {/* AI 搜尋對話框 */}
            <AISearchDialog open={aiSearchOpen} onOpenChange={setAiSearchOpen} />

            {/* 通知圖示 */}
            <NotificationBell />

            {/* 新增影片按鈕 */}
            {(user?.role === "admin" || user?.role === "staff") && (
              <Button
                onClick={() => setLocation("/manage")}
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-9 px-4"
              >
                <Plus className="h-4 w-4 mr-1" />
                新增影片
              </Button>
            )}
          </div>
        </div>

        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
