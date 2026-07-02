"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { fetchAPI, mutateAPI } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Save, Trash2 } from "lucide-react";
import Link from "next/link";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    setLoading(true);
    const data = await fetchAPI(`/orders?populate=*&filters[id][$eq]=${params.id}`);
    if (data.data && data.data.length > 0) {
      setOrder(data.data[0]);
      setOrderStatus(data.data[0].order_status);
      setDueDate(data.data[0].due_date || "");
    }
    setLoading(false);
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

  const handleSave = async () => {
    try {
      await mutateAPI(`/orders/${order.documentId || order.id}`, 'PUT', {
        data: {
          order_status: orderStatus,
          due_date: dueDate,
        },
      });
      toast.success("Pedido actualizado");
      setEditing(false);
      loadOrder();
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleCopy = async () => {
    try {
      // Crear nuevo pedido con los mismos datos
      const newOrder = {
        data: {
          client_name: order.client?.name || "Cliente",
          due_date: order.due_date,
          order_status: "pendiente",
          client: order.client ? { connect: [{ id: order.client.id }] } : undefined,
        },
      };

      const res = await mutateAPI('/orders', 'POST', newOrder);
      const newOrderId = res.data.id;

      // Copiar los items
      if (order.order_items) {
        for (const item of order.order_items) {
          await mutateAPI('/order-items', 'POST', {
            data: {
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              product: { connect: [{ id: item.product?.id }] },
              order: { connect: [{ id: newOrderId }] },
            },
          });
        }
      }

      toast.success("Pedido copiado exitosamente");
      router.push("/orders");
    } catch (error) {
      toast.error("Error al copiar pedido");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pedido no encontrado</p>
        <Link href="/orders" className="text-blue-500 hover:underline mt-4 inline-block">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/orders" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold">{order.order_number}</h1>
          <Badge className={getStatusColor(order.order_status)}>
            {order.order_status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copiar Pedido
          </Button>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              ✏️ Editar
            </Button>
          ) : (
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Guardar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <p className="text-lg font-semibold">{order.client?.name || "Sin cliente"}</p>
              {order.client?.phone && (
                <p className="text-sm text-gray-500">📞 {order.client.phone}</p>
              )}
              {order.client?.email && (
                <p className="text-sm text-gray-500">📧 {order.client.email}</p>
              )}
            </div>

            <div>
              <Label>Estado</Label>
              {editing ? (
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full border rounded-md p-2 mt-1"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              ) : (
                <Badge className={getStatusColor(order.order_status)}>
                  {order.order_status}
                </Badge>
              )}
            </div>

            <div>
              <Label>Fecha de vencimiento</Label>
              {editing ? (
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">
                  {order.due_date
                    ? new Date(order.due_date).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : "Sin fecha"}
                </p>
              )}
            </div>

            <div>
              <Label>Fecha de creación</Label>
              <p className="text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Productos del pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cant</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.order_items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.product?.categories?.[0]?.name || "Sin categoría"}
                      </p>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unit_price}</TableCell>
                    <TableCell className="font-medium">${item.subtotal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t mt-4 pt-4 text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-3xl font-bold">${order.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}