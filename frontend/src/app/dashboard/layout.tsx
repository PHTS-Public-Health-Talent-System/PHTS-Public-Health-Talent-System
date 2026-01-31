import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AuthProvider } from "@/components/providers/auth-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
        <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-sm font-medium text-muted-foreground">
                ระบบบริหารจัดการเงิน พ.ต.ส. (PHTS)
            </h1>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-muted/20 min-h-[calc(100vh-4rem)]">
                <main className="py-4 flex-1">
                    {children}
                </main>
            </div>
        </SidebarInset>
        </SidebarProvider>
    </AuthProvider>
  )
}
