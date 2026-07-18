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
import { ArrowLeft, Save, Trash2, Plus, X, Pencil, Search } from "lucide-react";
import Link from "next/link";
import DeleteDialog from "../../dialogs/DeleteDialog";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [originalOrderItems, setOriginalOrderItems] = useState<any[]>([]);

  // Estados del formulario para agregar producto
  const [newProductSearch, setNewProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState(1);
  const [newPrice, setNewPrice] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const url = `/orders?populate=client&populate=order_items.product.categories&filters[id][$eq]=${params.id}`;
      console.log("🔍 Cargando pedido:", url);
      
      const data = await fetchAPI(url);
      console.log("✅ Datos:", data);
      
      if (data.data && data.data.length > 0) {
        const orderData = data.data[0];
        const orderInfo = orderData.attributes || orderData;
        
        console.log("📦 Order items:", orderInfo.order_items);
        
        setOrder(orderInfo);
        setOrderStatus(orderInfo.order_status);
        setDueDate(orderInfo.due_date || "");
        
        const items = orderInfo.order_items || [];
        setOrderItems(Array.isArray(items) ? items : []);
        setOriginalOrderItems(JSON.parse(JSON.stringify(Array.isArray(items) ? items : [])));
        
        const categoryData = orderInfo.category?.attributes || orderInfo.category;
        if (categoryData) {
          loadProductsByCategory(categoryData.documentId || categoryData.id);
        }
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("Error al cargar el pedido");
    }
    setLoading(false);
  };

  const loadProductsByCategory = async (categoryId: string) => {
    try {
      console.log("🔍 Cargando productos para categoría ID:", categoryId);
      const data = await fetchAPI(`/products?populate=*`);
      
      if (data.data) {
        const filtered = data.data.filter((product: any) => {
          const pData = product.attributes || product;
          const categories = pData.categories || [];
          return categories.some((cat: any) => {
            const catData = cat.attributes || cat;
            const catId = cat.documentId || cat.id;
            return catId == categoryId;
          });
        });
        
        console.log("✅ Productos filtrados:", filtered);
        setFilteredProducts(filtered);
      }
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
    }
  };

  const filteredBySearch = filteredProducts.filter((product) => {
    if (!newProductSearch) return true;
    const pData = product.attributes || product;
    const name = (pData.name || "").toLowerCase();
    return name.includes(newProductSearch.toLowerCase());
  });

  const getProductName = (product: any) => {
    if (!product) return "Sin producto";
    return product.attributes?.name || product.name || "Sin producto";
  };

  const getProductId = (product: any) => {
    if (!product) return "";
    return product.documentId || product.id || "";
  };

  const getProductPrice = (product: any) => {
    if (!product) return 0;
    return product.attributes?.price || product.price || 0;
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

  const startEditing = () => {
    setEditing(true);
    resetAddForm();
  };

  const cancelEditing = () => {
    setOrderItems(JSON.parse(JSON.stringify(originalOrderItems)));
    setOrderStatus(order?.order_status || "");
    setDueDate(order?.due_date || "");
    resetAddForm();
    setEditing(false);
  };

  const resetAddForm = () => {
    setSelectedProduct(null);
    setNewProductSearch("");
    setNewQuantity(1);
    setNewPrice(0);
    setShowDropdown(false);
  };

  const selectProductForAdd = (product: any) => {
    const pData = product.attributes || product;
    setSelectedProduct(product);
    setNewPrice(pData.price || 0);
    setNewProductSearch(pData.name || "");
    setShowDropdown(false);
  };

  const confirmAddProduct = () => {
    if (!selectedProduct) {
      toast.error("Selecciona un producto primero");
      return;
    }
    
    setOrderItems([
      ...orderItems,
      {
        id: `temp-${Date.now()}`,
        product: selectedProduct,
        quantity: newQuantity,
        unit_price: newPrice,
        subtotal: newQuantity * newPrice,
        isNew: true,
      },
    ]);
    
    toast.success("Producto agregado");
    resetAddForm();
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      updated[index].subtotal = (updated[index].quantity || 0) * (updated[index].unit_price || 0);
    }

    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  const handleSave = async () => {
    try {
      const orderId = order.documentId || order.id;
      
      await mutateAPI(`/orders/${orderId}`, 'PUT', {
        data: {
          order_status: orderStatus,
          due_date: dueDate,
          total: calculateTotal(),
        },
      });

      const currentIds = orderItems
        .filter(item => !item.isNew)
        .map(item => item.documentId || item.id);
      
      for (const originalItem of originalOrderItems) {
        const itemId = originalItem.documentId || originalItem.id;
        if (!currentIds.includes(itemId)) {
          await mutateAPI(`/order-items/${itemId}`, 'DELETE');
        }
      }

      for (const item of orderItems) {
        if (!item.product) continue;
        
        const productId = getProductId(item.product);
        const itemData = {
          data: {
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            product: productId,
          },
        };

        if (item.isNew) {
          const newItem = await mutateAPI('/order-items', 'POST', itemData);
          await mutateAPI(`/orders/${orderId}`, 'PUT', {
            data: {
              order_items: { connect: [newItem.data.documentId || newItem.data.id] }
            }
          });
        } else {
          const itemId = item.documentId || item.id;
          await mutateAPI(`/order-items/${itemId}`, 'PUT', itemData);
        }
      }

      toast.success("✅ Pedido actualizado");
      setEditing(false);
      loadOrder();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async () => {
    try {
      const orderId = order.documentId || order.id;
      await mutateAPI(`/orders/${orderId}`, 'DELETE');
      toast.success("Pedido eliminado");
      router.push("/orders");
    } catch (error) {
      toast.error("Error al eliminar");
    }
    setShowDelete(false);
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

  const clientData = order.client?.attributes || order.client || {};
  const categoryData = order.category?.attributes || order.category || {};

  return (
    <div>
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/orders" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              {order.order_number || `PED-${order.id}`}
            </h1>
            <div className="flex gap-2 mt-1">
              <Badge className={getStatusColor(order.order_status)}>
                {order.order_status}
              </Badge>
              {categoryData?.name && (
                <Badge variant="outline"> {categoryData.name}</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!editing ? (
            <>
              <Button variant="outline" onClick={() => setShowDelete(true)} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
              <Button onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={cancelEditing}>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> Guardar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INFORMACIÓN DEL PEDIDO */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <p className="text-lg font-semibold">
                {clientData?.name || order.client_name || "Sin cliente"}
              </p>
              {clientData?.phone && <p className="text-sm text-gray-500">📞 {clientData.phone}</p>}
              {clientData?.email && <p className="text-sm text-gray-500">📧 {clientData.email}</p>}
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
                        year: 'numeric', month: 'long', day: 'numeric'
                      })
                    : "Sin fecha"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FORMULARIO PARA AGREGAR PRODUCTO (visible solo en modo edición) */}
      {editing && (
        <Card className="mt-6 border-2 border-dashed border-gray-300 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg"> Agregar Producto al Pedido</CardTitle>
            <p className="text-sm text-gray-500">
              Categoría: <Badge variant="outline"> {categoryData?.name || "Sin categoría"}</Badge>
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Buscador de producto */}
              <div className="relative">
                <Label>Producto</Label>
                {selectedProduct ? (
                  <div className="flex items-center justify-between mt-1 p-2 bg-green-50 border border-green-300 rounded-md">
                    <span className="text-sm font-medium text-green-800 truncate">
                      {getProductName(selectedProduct)}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        setNewProductSearch("");
                        setNewPrice(0);
                      }}
                      className="text-green-600 hover:text-green-800 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mt-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Buscar producto..."
                        value={newProductSearch}
                        onChange={(e) => {
                          setNewProductSearch(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="pl-8"
                      />
                    </div>
                    {showDropdown && newProductSearch && (
                      <div className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {filteredBySearch.length > 0 ? (
                          filteredBySearch.map((product) => {
                            const pData = product.attributes || product;
                            return (
                              <div
                                key={getProductId(product)}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                                onClick={() => selectProductForAdd(product)}
                              >
                                <p className="font-medium">{pData.name}</p>
                                <p className="text-xs text-gray-500">${pData.price}</p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            Sin resultados
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Cantidad */}
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              {/* Precio */}
              <div>
                <Label>Precio Unitario</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              {/* Botón Agregar */}
              <div>
                <Button 
                  className="w-full"
                  onClick={confirmAddProduct}
                  disabled={!selectedProduct}
                >
                  <Plus className="h-4 w-4 mr-2" /> Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {/* PRODUCTOS */}
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
                  {editing && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.length > 0 ? (
                  orderItems.map((item: any, index: number) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <p className="font-medium">
                          {getProductName(item.product)}
                        </p>
                      </TableCell>
                      <TableCell>
                        {editing ? (
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {editing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        ) : (
                          `$${item.unit_price}`
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${item.subtotal || 0}
                      </TableCell>
                      {editing && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeOrderItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={editing ? 5 : 4} className="text-center text-gray-400">
                      No hay productos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="border-t mt-4 pt-4 text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-3xl font-bold">
                ${editing ? calculateTotal() : (order.total || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    

      <DeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="¿Eliminar pedido?"
        message={`¿Estás seguro de eliminar el pedido ${order.order_number || `PED-${order.id}`}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}