import Link from "next/link";
import { Package, ShoppingCart, LayoutDashboard, Menu, Users, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FileText } from "lucide-react";
import { Dialog, DialogContent  } from "@/components/ui/dialog";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">TIDEFII</h1>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        
        <Link href="/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          <ShoppingCart className="h-5 w-5" />
          <span>Pedidos</span>
        </Link>
        
        <Link href="/products" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          <Package className="h-5 w-5" />
          <span>Productos</span>
        </Link>

        <Link href="/categories" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          <Tag className="h-5 w-5" />
          <span>Categorías</span>
        </Link>

        <Link href="/clients" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          <Users className="h-5 w-5" />
          <span>Clientes</span>
        </Link>

        <Link href="/registers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
      <FileText className="h-5 w-5" />
      <span>Registros</span>
      </Link>
      </nav>

      <div className="p-4 border-t dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">Sistema v1.0</p>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-sm flex-col">
        <SidebarContent />
      </aside>

      {/* Sidebar móvil */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-4 lg:p-6 pt-16 lg:pt-6">
        {children}
      </main>
    </div>
  );
}