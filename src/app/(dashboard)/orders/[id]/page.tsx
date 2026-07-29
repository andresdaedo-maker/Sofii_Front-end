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
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Trash2, Plus, X, Pencil, Search } from "lucide-react";
import Link from "next/link";
import DeleteDialog from "../../dialogs/DeleteDialog";
import PayConfirmDialog from "../../dialogs/PayConfirmDialog";
import SaveChangesDialog from "../../dialogs/SaveChangesDialog";


export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [originalOrderItems, setOriginalOrderItems] = useState<any[]>([]);

  const [newProductSearch, setNewProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState(1);
  const [newPrice, setNewPrice] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [showPayConfirm, setShowPayConfirm] =useState(false);
  const searchParams = useSearchParams();

  useEffect(() => { loadOrder(); }, []);
  useEffect(() => {
  if (searchParams.get('edit') === 'true' && order && order.order_status !== 'pagado') {
    startEditing();
  }
}, [order]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const url = `/orders?populate=client&populate=category&populate=product_items.product&filters[id][$eq]=${params.id}`;
      const data = await fetchAPI(url);
      
      if (data.data && data.data.length > 0) {
        const orderData = data.data[0];
        const orderInfo = orderData.attributes || orderData;
        
        setOrder(orderInfo);
        setOrderStatus(orderInfo.order_status);
        setDueDate(orderInfo.due_date || "");
        setObservaciones(orderInfo.observaciones || "");
        
        const items = orderInfo.product_items || [];
        setOrderItems(Array.isArray(items) ? items : []);
        setOriginalOrderItems(JSON.parse(JSON.stringify(Array.isArray(items) ? items : [])));
        
        const categoryData = orderInfo.category?.attributes || orderInfo.category;
        if (categoryData) {
          loadProductsByCategory(categoryData.documentId || categoryData.id);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar el pedido");
    }
    setLoading(false);
  };

  const loadProductsByCategory = async (categoryId: string) => {
    try {
      const data = await fetchAPI(`/products?populate=*&pagination[pageSize]=1000`);
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
        setFilteredProducts(filtered);
      }
    } catch (error) { 
      console.error("Error cargando productos:", error); 
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
      default: return 'bg-gray-500'; 
    } 
  };

  const hasChanges = () => {
    const itemsChanged = JSON.stringify(orderItems) !== JSON.stringify(originalOrderItems);
    const statusChanged = orderStatus !== (order?.order_status || "");
    const dateChanged = dueDate !== (order?.due_date || "");
    const obsChanged = observaciones !== (order?.observaciones || "");
    return itemsChanged || statusChanged || dateChanged || obsChanged;
  };

  const startEditing = () => { 
    setEditing(true); 
    resetAddForm(); 
  };
  
 const cancelEditing = () => { 
  router.push("/orders"); 
};

  const resetToOriginal = () => {
  setOrderItems(JSON.parse(JSON.stringify(originalOrderItems))); 
  setOrderStatus(order?.order_status || ""); 
  setDueDate(order?.due_date || ""); 
  setObservaciones(order?.observaciones || ""); 
  resetAddForm(); 
  setEditing(false);
  setShowSaveConfirm(false);
  router.push("/orders"); 
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
    setOrderItems([...orderItems, { 
      id: `temp-${Date.now()}`, 
      product: selectedProduct, 
      quantity: newQuantity, 
      unit_price: newPrice, 
      subtotal: newQuantity * newPrice, 
      isNew: true 
    }]);
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

  // Si está cambiando a pagado, mostrar confirmación primero
    const handleSave = async () => {
    if (orderStatus === 'pagado' && order?.order_status !== 'pagado') {
    setShowPayConfirm(true);
    return;
  }
  
  // Si no, guardar directamente
  await saveChanges();
};

const saveChanges = async () => {
  try {
    const orderId = order.documentId || order.id;

    const updateData: any = {
      order_status: orderStatus,
      due_date: dueDate,
      total: calculateTotal(),
      observaciones: observaciones,
      product_items: orderItems.map(item => ({
        id: item.isNew ? undefined : (item.documentId || item.id),
        product: getProductId(item.product),
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
    };

    await mutateAPI(`/orders/${orderId}`, 'PUT', updateData);

    
    if (orderStatus === 'pagado') {
      const catData = order.category?.attributes || order.category || {};
      const cliData = order.client?.attributes || order.client || {};
      await mutateAPI('/paid-registers', 'POST', {
        order_number: order.order_number || `PED-${order.id}`,
        client_name: cliData?.name || order.client_name || "Sin cliente",
        category_name: catData?.name || "",
        products: orderItems.map(item => ({
          name: getProductName(item.product),
          quantity: item.quantity,
          price: item.unit_price,
          subtotal: item.subtotal
        })),
        total: calculateTotal(),
        payment_date: new Date().toISOString().split('T')[0],
        observaciones: observaciones,
      });
    }

        toast.success(" Pedido actualizado");
    setEditing(false);
    setShowPayConfirm(false);
    router.push("/orders");
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

  if (loading) return 
  <div className="flex items-center justify-center h-64">
    <p className="text-gray-500 dark:text-gray-400">Cargando pedido...</p>
    </div>;
  if (!order) return 
  <div className="text-center py-12">
    <p className="text-gray-500 dark:text-gray-400">Pedido no encontrado</p>
    <Link href="/orders" className="text-blue-500 hover:underline mt-4 inline-block">Volver a pedidos</Link>
    </div>;

  const clientData = order.client?.attributes || order.client || {};
  const categoryData = order.category?.attributes || order.category || {};

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
  <Link 
    href="/orders" 
    className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
  >
    <ArrowLeft className="h-8 w-8" />
  </Link>
  <div><h1 className="text-2xl lg:text-3xl font-bold dark:text-white">{order.order_number || `PED-${order.id}`}</h1></div>
</div>
        <div className="flex gap-2">
  {editing ? (
    <>
      <Button 
      variant="outline" 
      onClick={cancelEditing}>
        <X 
        className="h-4 w-4 mr-2" /> Cancelar</Button>
      <Button 
      onClick={handleSave}>
        <Save 
        className="h-4 w-4 mr-2" /> Guardar</Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={() => setShowDelete(true)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
      {orderStatus !== 'pagado' && (
        <Button onClick={startEditing}><Pencil className="h-4 w-4 mr-2" /> Editar</Button>
      )}
    </>
  )}
</div>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Pedido</CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Cliente</Label><p className="text-base font-semibold dark:text-white">{clientData?.name || order.client_name || "Sin cliente"}</p>
                </div>
              <div>
                <Label>Teléfono</Label><p className="text-base font-semibold dark:text-white">{clientData?.phone || "—"}</p>
                </div>
              <div>
                <Label>Email</Label><p className="text-base font-semibold dark:text-white">{clientData?.email || "—"}</p>
              </div>
              <div>
                <Label>Fecha de Vencimiento</Label><p className="text-base font-semibold dark:text-white">{order.due_date ? new Date(order.due_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : "Sin fecha"}</p>
                </div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <select 
                    value={orderStatus} 
                    onChange={(e) => setOrderStatus(e.target.value)} 
                    className="border rounded-md p-1 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                  </select>
                ) : (
                  <Badge className={getStatusColor(orderStatus)}>{orderStatus}</Badge>
                )}
                {categoryData?.name && <Badge variant="outline"> {categoryData.name}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {editing && (
  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 overflow-visible">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">+ Agregar Producto al Pedido</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categoría: 
                <Badge variant="outline"> {categoryData?.name || "Sin categoría"}</Badge>
                </p>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="relative">
                  <Label>Producto</Label>
                  {selectedProduct ? (
                    <div className="flex items-center justify-between mt-1 p-2 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
                      <span className="text-sm font-medium text-green-800 dark:text-green-300 truncate">{getProductName(selectedProduct)}</span>
                      <button 
                      onClick={() => { setSelectedProduct(null); setNewProductSearch(""); setNewPrice(0); }} 
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 ml-2">
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
                      onChange={(e) => { setNewProductSearch(e.target.value); setShowDropdown(true); }} 
                      onFocus={() => setShowDropdown(true)} 
                      className="pl-8" />
                      </div>
                    {showDropdown && newProductSearch && (
                      <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {filteredBySearch.length > 0 ? filteredBySearch.map((product) => { const pData = product.attributes || product; 
                          return <div 
                                   key={getProductId(product)} 
                                    className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm border-b dark:border-gray-700 last:border-0" 
                                     onClick={() => selectProductForAdd(product)}>
                                      <p className="font-medium">{pData.name}</p>
                                       <p className="text-xs text-gray-500 dark:text-gray-400">${pData.price?.toLocaleString('es-CO')}</p></div>; }) : 
                                    <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">Sin resultados</div>}
                                 </div>
                             )}</>
                          )}
                </div>
                <div>
                  <Label>Cantidad</Label>
                   <Input 
                     type="number" 
                     min="1" 
                     value={newQuantity} 
                     onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)} 
                     className="mt-1" />
                     </div>
                <div>
                  <Label>Precio Unitario</Label>
                  <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={newPrice} 
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)} 
                  className="mt-1" />
                  </div>
                <div>
                  <Button 
                  className="w-full mt-6" 
                  onClick={confirmAddProduct} 
                  disabled={!selectedProduct}>
                    <Plus className="h-4 w-4 mr-2" /> Agregar</Button></div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div>
              <Label>Observaciones</Label>
              {editing ? 
              <textarea 
              value={observaciones} 
              onChange={(e) => setObservaciones(e.target.value)} 
              className="w-full border rounded-md p-2 mt-1 min-h-[80px] dark:bg-gray-800 dark:text-white dark:border-gray-600" 
              rows={3} 
              placeholder="Notas del pedido..." /> : 
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{order.observaciones || "Sin observaciones"}</p>}
              </div>
            </CardContent>
          </Card>

        <Card>
          <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-lg text-gray-700 dark:text-gray-300 font-semibold">Productos</TableHead>
                <TableHead className="text-lg text-gray-700 dark:text-gray-300 font-semibold">Cant</TableHead>
                <TableHead className="text-lg text-gray-700 dark:text-gray-300 font-semibold">Precio</TableHead>
                <TableHead className="text-lg text-gray-700 dark:text-gray-300 font-semibold">Subtotal</TableHead>
                {editing && <TableHead>
                    </TableHead>}
                    </TableRow>
                  </TableHeader>
            <TableBody>
              {orderItems.length > 0 ? orderItems.map((item: any, index: number) => (
                <TableRow key={item.id || index}>
                  <TableCell><p className="font-medium">{getProductName(item.product)}
                    </p>
                    </TableCell>
                  <TableCell>
                    {editing ? 
                     <Input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                      className="w-20" /> : item.quantity}
                  </TableCell>
                  <TableCell>
                    {editing ? 
                     <Input 
                       type="number" 
                       step="0.01" 
                       min="0" 
                       value={item.unit_price} 
                       onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)} 
                       className="w-24" /> : `$${item.unit_price?.toLocaleString('es-CO')}`}
                    </TableCell>
                  <TableCell className="font-medium">${(item.subtotal || 0)?.toLocaleString('es-CO')}</TableCell>
                  {editing && 
                  <TableCell>
                    <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" 
                     onClick={() => removeOrderItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>}
                </TableRow>
              )) : 
              <TableRow><TableCell colSpan={editing ? 5 : 4} className="text-center text-gray-400 dark:text-gray-500">No hay productos</TableCell>
              </TableRow>
              }
            </TableBody>
          </Table>
          <div className="border-t dark:border-gray-700 mt-4 pt-4 text-right">
            <p className="text-base text-gray-700 dark:text-gray-300 font-bold">Total</p>
            <p className="text-3xl font-bold dark:text-white">
              ${(editing ? calculateTotal() : (order.total || 0))?.toLocaleString('es-CO')} COP</p>
              </div>
        </CardContent>
        </Card>
      </div>

     {/* Diálogo de confirmación para eliminar */}
      <DeleteDialog 
        open={showDelete} 
        onOpenChange={setShowDelete} 
        title="¿Eliminar pedido?" 
        message={`¿Estás seguro de eliminar el pedido ${order.order_number || `PED-${order.id}`}?`} 
        onConfirm={handleDelete} 
       />

      {/* Diálogo de confirmación para guardar cambios */}
      <SaveChangesDialog 
        open={showSaveConfirm} 
        onOpenChange={setShowSaveConfirm}
        onSave={() => { setShowSaveConfirm(false); handleSave(); }}
        onDiscard={resetToOriginal}
       />

      {/* Diálogo de confirmación para marcar como pagado */}
     <PayConfirmDialog 
       open={showPayConfirm} 
       onOpenChange={setShowPayConfirm}
       onConfirm={saveChanges}
       orderNumber={order.order_number || `PED-${order.id}`}
      />
    </div>
  );
}