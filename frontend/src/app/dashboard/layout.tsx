"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnnouncementBanner } from "@/components/common/announcement-banner";
import { SupportWidget } from "@/components/common/support-widget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />

      {/* พื้นที่เนื้อหาหลัก (SidebarInset) */}
      <SidebarInset className="bg-background min-h-screen">

        {/* Header Strip ด้านบน */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4 shadow-soft sticky top-0 z-10">
          <div className="flex items-center gap-2 mr-auto">
            <SidebarTrigger className="-ml-1 h-10 w-10 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-xl transition-all" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-slate-200" />

            {/* Breadcrumb - Can be dynamically updated later */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-medium text-slate-500">
                    หน้าต่างจัดการคำขอ
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Action ขวาสุดของ Header */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-accent text-muted-foreground relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive border border-card"></span>
            </Button>
          </div>
        </header>

        {/* Content Area จริงๆ */}
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          <AnnouncementBanner />
          {children}
        </div>
      </SidebarInset>
      <SupportWidget />
    </SidebarProvider>
  );
}
