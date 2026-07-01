import Link from "next/link";
import { Package, ShoppingCart, LayoutDashboard, Menu, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">Detalles Sofii</h1>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-black"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        
        <Link
          href="/orders"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-black"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Pedidos</span>
        </Link>
        
        <Link
          href="/products"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-black"
        >
          <Package className="h-5 w-5" />
          <span>Productos</span>
        </Link>

        <Link
          href="/categories"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-gray-700
          hover:text-black">
            
            <Tag className="h-5 w-5"/>
            <span> Categorias</span>
        </Link>
    
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-gray-400">Sistema v1.0</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:flex w-64 bg-white border-r shadow-sm flex-col">
        <SidebarContent />
      </aside>

      {/* Sidebar móvil */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
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