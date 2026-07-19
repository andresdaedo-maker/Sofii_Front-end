"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchAPI, mutateAPI } from "@/lib/api";
import { Order } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import DeleteDialog from "../dialogs/DeleteDialog";
import { Trash2 } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const searchParams = useSearchParams();
  const categoriaSeleccionada = searchParams.get('categoria') || '';

  useEffect(() => {
    loadOrders();
    loadCategories();
  }, [categoriaSeleccionada]);

  const loadOrders = async () => {
  const data = await fetchAPI('/orders?populate=client&populate=order_items.product.categories');
  let allOrders = Array.isArray(data.data) ? data.data : [];
  
  if (categoriaSeleccionada) {
    const filtered = allOrders.filter((order: Order) => {
      return order.order_items?.some((item: any) => {
        return item.product?.categories?.[0]?.name === categoriaSeleccionada;
      });
    });
    setOrders(filtered);
  } else {
    setOrders(allOrders);
  }
};

  const loadCategories = async () => {
    const data = await fetchAPI('/categories');
    setCategories(Array.isArray(data.data) ? data.data : []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-500';
      case 'pagado': return 'bg-green-500';
      case 'vencido': return 'bg-red-500';
      case 'cancelado': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDelete = (e: React.MouseEvent, order: Order) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteOrder(order);
  };

  const confirmDelete = async () => {
    if (!deleteOrder) return;
    try {
      const orderId = (deleteOrder as any).documentId || deleteOrder.id;
      await mutateAPI(`/orders/${orderId}`, 'DELETE');
      toast.success("Pedido eliminado exitosamente");
      setDeleteOrder(null);
      loadOrders();
    } catch (error) {
      toast.error("Error al eliminar el pedido");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold"> Pedidos</h1>
        {/*nuevo pedido*/}
        <Link href="/orders/new" className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">+ Nuevo Pedido</Link>
      </div>

        {/*Mostrar pedidos de categoria seleccionada*/}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/orders" className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${categoriaSeleccionada === '' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}> General</Link>
        {categories?.map((category: any) => (
          <Link key={category.id} href={`/orders?categoria=${encodeURIComponent(category.name)}`} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${categoriaSeleccionada === category.name ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}> {category.name}</Link>
        ))}
      </div>
       
      {categoriaSeleccionada && (
        <p className="text-sm text-gray-500 mb-4">Mostrando pedidos de: <strong>{categoriaSeleccionada}</strong> ({orders.length} pedidos)</p>
      )}
      {/*Tarjeta*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
 
        {orders.map((order: Order) => (
          <Link href={`/orders/${order.id}`} key={order.id}>
            <Card className="hover:shadow-lg transition cursor-pointer relative group h-full">
              <CardHeader className="pb-1 pt-3 px-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{order.order_number || `PED-${order.id}`}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order.order_status)}>{order.order_status}</Badge>
                    <Button 
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => handleDelete(e, order)}>
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-3 pb-3 pt-0 space-y-1 text-sm">

                 {/* Caja Cliente + Vence*/}
              <div className="flex justify-between items-start mb-1">
                {/*Cliente*/}
                <div>
                  <p className="text-xs text-gray-400 uppercase">Cliente</p>
                  <p className="text-lg font-semibold text-gray-800">{order.client?.name || "Sin cliente"}</p>
                </div>
                
                  {/*Categoria*/}
                {order.order_items?.[0]?.product?.categories?.[0]?.name && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 uppercase">Categoria</p>
                    <Badge 
                    variant="outline" 
                    className="tex-xs">
                      {order.order_items[0].product.categories[0].name}
                      </Badge>
                      </div>
                     )}
               
              </div>
 {/*Fecha de Vencimiento*/}
                <div className="text-sm">
                  <p className="text-xs text-gray-400 uppercase">Vence</p>
                  <p className="text-sm text-gray-600">{order.due_date ? new Date(order.due_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : "Sin fecha"}</p>
                </div>

                

                {/*Prodcuto + Subtotal*/}     
              <div className="border-t my-3"></div>
                <div className="space-y-1 mb-3">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-base">
                        <span className="text-gray-700">{item.quantity}x {item.product?.name || "Producto"}</span>
                        <span className="font-medium">${item.subtotal?.toLocaleString('es-CO')}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">Sin productos</p>
                  )}
                </div>

                {/*Total de  Precios Prodcutos*/}
                <div className="border-t my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-700">Total</span>
                  <span className="text-xl font-bold">${order.total?.toLocaleString('es-CO') || 0}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
          {/*si no hay productos */}
      {orders.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No hay pedidos{ categoriaSeleccionada ? ` de "${categoriaSeleccionada}"` : '' } aún.</p>
      )}

      {/*eliminar el pedido*/}
      <DeleteDialog
        open={!!deleteOrder}
        onOpenChange={() => setDeleteOrder(null)}
        title="¿Eliminar pedido?"
        message={`¿Estás seguro de eliminar el pedido ${deleteOrder?.order_number || `PED-${deleteOrder?.id}`}?`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}