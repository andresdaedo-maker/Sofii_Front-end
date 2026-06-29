import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";
import { Order } from "@/types";
import Link from "next/link";

async function getOrders(): Promise<{ data: Order[] }> {
  try {
    return await fetchAPI('/orders?populate=*');
  } catch {
    return { data: [] };
  }
}

export default async function OrdersPage() {
  const { data: orders } = await getOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-500';
      case 'pagado': return 'bg-green-500';
      case 'vencido': return 'bg-red-500';
      case 'cancelado': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📋 Pedidos</h1>
        <Link href="/orders/new" className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
          + Nuevo Pedido
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders?.map((order: Order) => (
          <Card key={order.id} className="hover:shadow-lg transition">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{order.order_number}</CardTitle>
                <Badge className={getStatusColor(order.order_status)}>
                  {order.order_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Cliente: {order.client?.name}</p>
              <p className="text-sm text-gray-600">Vence: {order.due_date}</p>
              <div className="mt-2">
                {order.order_items?.map((item) => (
                  <p key={item.id} className="text-sm">
                    {item.quantity}x {item.product?.name} - ${item.subtotal}
                  </p>
                ))}
              </div>
              <p className="text-xl font-bold mt-2">Total: ${order.total}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders?.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No hay pedidos aún.</p>
      )}
    </div>
  );
}