"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAPI, mutateAPI } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Search, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import DeleteDialog from "../dialogs/DeleteDialog";
import { OrderCardModal } from "@/components/OrderCardModal";
import { DownloadPDF } from "@/components/DownloadPDF";

const PAGE_SIZE = 50;

export default function RegistersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteOrder, setDeleteOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadPaidOrders(); }, []);

  const loadPaidOrders = async () => {
  setLoading(true);
  
  // Buscar pedidos pagados en orders
  const ordersData = await fetchAPI('/orders?populate=client&populate=product_items.product.categories&filters[order_status][$eq]=pagado&pagination[pageSize]=1000');
  
  // Buscar registros en paid-registers
  const paidData = await fetchAPI('/paid-registers?pagination[pageSize]=1000');
  
  // Combinar ambos
  const ordersFromOrders = Array.isArray(ordersData.data) ? ordersData.data : [];
  const ordersFromPaid = Array.isArray(paidData.data) ? paidData.data.map((reg: any) => ({
    ...reg,
    order_number: reg.order_number,
    client: { name: reg.client_name },
    total: reg.total,
    observaciones: reg.observaciones,
    updatedAt: reg.payment_date,
    product_items: reg.products?.map((p: any) => ({
      product: { name: p.name, categories: [{ name: reg.category_name }] },
      quantity: p.quantity,
      subtotal: p.subtotal,
    })),
    fromPaidRegister: true,
  })) : [];
  
  // Unir sin duplicados (por order_number)
  const allOrders = [...ordersFromOrders];
  ordersFromPaid.forEach((paidOrder: any) => {
    if (!allOrders.find(o => (o.order_number || `PED-${o.id}`) === paidOrder.order_number)) {
      allOrders.push(paidOrder);
    }
  });
  
  setOrders(allOrders);
  setLoading(false);
};
  const filteredOrders = orders.filter((order: any) => {
    if (search) {
      const s = search.toLowerCase();
      const orderNumber = (order.order_number || `PED-${order.id}`).toLowerCase();
      const clientName = (order.client?.name || order.client_name || "").toLowerCase();
      const category = order.product_items?.[0]?.product?.categories?.[0]?.name?.toLowerCase() || "";
      const observaciones = (order.observaciones || "").toLowerCase();
      const total = String(order.total || "");

      if (!orderNumber.includes(s) && !clientName.includes(s) && !category.includes(s) && !observaciones.includes(s) && !total.includes(s))
        return false;
    }
    if (dateFrom && new Date(order.updatedAt) < new Date(dateFrom)) return false;
    if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59); if (new Date(order.updatedAt) > to) return false; }
    return true;
  });

  const totalFiltered = filteredOrders.length;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setTotalPages(Math.ceil(totalFiltered / PAGE_SIZE) || 1); setCurrentPage(1); }, [totalFiltered]);

  const totalGeneral = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  const handleDeleteClick = (e: React.MouseEvent, order: any) => { e.preventDefault(); e.stopPropagation(); setDeleteOrder(order); };

  const confirmDelete = async () => {
    if (!deleteOrder) return;
    try {
      const orderId = deleteOrder.documentId || deleteOrder.id;
      await mutateAPI(`/orders/${orderId}`, 'DELETE');
      toast.success("Registro eliminado");
      setDeleteOrder(null);
      loadPaidOrders();
    } catch (error) { toast.error("Error al eliminar"); }
  };

  const clearFilters = () => { setDateFrom(""); setDateTo(""); setSearch(""); };

  if (loading) 
    return <div className="flex items-center justify-center h-64">
             <p className="text-gray-500 dark:text-gray-400">Cargando registros...</p>
           </div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/orders" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
            <ArrowLeft className="h-8 w-8" />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold dark:text-white">Registro de Pedidos Pagados</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalFiltered} pedidos registrados</p>
          </div>
        </div>
        {filteredOrders.length > 0 && <DownloadPDF orders={filteredOrders} totalGeneral={totalGeneral} />}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por número, cliente, categoría..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400">Desde:</label>
          <Input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)} 
            className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400">Hasta:</label>
          <Input 
            type="date" 
            value={dateTo} 
            onChange={(e) => setDateTo(e.target.value)} 
            className="w-40" />
        </div>
        {(dateFrom || dateTo) && 
          <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar filtros</Button>}
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-base font-bold text-black dark:text-white">Pedido</TableHead>
            <TableHead className="text-base font-bold text-black dark:text-white">Cliente</TableHead>
            <TableHead className="text-base font-bold text-black dark:text-white">Categoría</TableHead>
            <TableHead className="text-base font-bold text-black dark:text-white">Total</TableHead>
            <TableHead className="text-base font-bold text-black dark:text-white">Fecha Pago</TableHead>
            <TableHead className="text-base font-bold text-black dark:text-white">Estado</TableHead>
            <TableHead className="text-base font-bold text-black dark:text-white">Observaciones</TableHead>
            <TableHead className="text-base font-bold text-black dark:text-white">Acciones</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-gray-400 dark:text-gray-500 py-8">No se encontraron registros</TableCell></TableRow> :
              paginatedOrders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number || `PED-${order.id}`}</TableCell>
                  <TableCell>{order.client?.name || order.client_name || "—"}</TableCell>
                  <TableCell>
                    {order.product_items?.[0]?.product?.categories?.[0]?.name ? (
                      <Badge variant="outline" className="text-xs">{order.product_items[0].product.categories[0].name}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="font-bold">${order.total?.toLocaleString('es-CO')}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.updatedAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500">pagado</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{order.observaciones || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4 mr-1" /> Ver
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" 
                        onClick={(e) => handleDeleteClick(e, order)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Página {currentPage} de {totalPages} ({totalFiltered} registros)</p>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(currentPage - 1)} 
                disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => 
                <Button 
                  key={page} 
                  variant={currentPage === page ? "default" : "outline"} 
                  size="sm" onClick={() => setCurrentPage(page)} 
                  className="w-10">{page}</Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(currentPage + 1)} 
                disabled={currentPage === totalPages}>Siguiente <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </CardContent></Card>

      <OrderCardModal 
        open={!!selectedOrder} 
        onOpenChange={() => setSelectedOrder(null)} 
        order={selectedOrder} />

      <DeleteDialog 
        open={!!deleteOrder} 
        onOpenChange={() => setDeleteOrder(null)} 
        itemType="registro" 
        itemName={deleteOrder?.order_number || `PED-${deleteOrder?.id}`} 
        onConfirm={confirmDelete} />
    </div>
  );
}