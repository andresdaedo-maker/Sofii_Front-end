import Link from "next/link";
import { Package, ShoppingCart, LayoutDashboard } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">📦 Sistema Pedidos</h1>
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
        </nav>

        <div className="p-4 border-t">
          <p className="text-xs text-gray-400">Sistema v1.0</p>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}