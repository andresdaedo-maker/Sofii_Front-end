"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Client, OrderItem } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchAPI, mutateAPI } from "@/lib/api";
import { Search } from "lucide-react";

export default function NewOrderPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);

  useEffect(() => {
    loadClients();
    loadProducts();
    loadCategories();
  }, []);

  const loadClients = async () => {
    const data = await fetchAPI('/clients');
    setClients(Array.isArray(data.data) ? data.data : []);
  };

  const loadProducts = async () => {
    const data = await fetchAPI('/products?populate=*');
    setProducts(Array.isArray(data.data) ? data.data : []);
  };

  const loadCategories = async () => {
    const data = await fetchAPI('/categories');
    setCategories(Array.isArray(data.data) ? data.data : []);
  };

  const getCategoryName = (product: any): string => {
    if (product.categories && product.categories.length > 0) return product.categories[0].name;
    return "Sin categoría";
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((product: any) => {
        const matchSearch = product.name.toLowerCase().includes(searchProduct.toLowerCase()) || getCategoryName(product).toLowerCase().includes(searchProduct.toLowerCase());
        const matchCategory = selectedCategory ? getCategoryName(product) === selectedCategory : true;
        return matchSearch && matchCategory;
      })
    : [];

  const filteredClients = Array.isArray(clients)
    ? clients.filter((client) => client.name.toLowerCase().includes(searchClient.toLowerCase()) || (client.phone || "").includes(searchClient) || (client.email || "").toLowerCase().includes(searchClient.toLowerCase()))
    : [];

  const addItem = () => {
    if (!selectedProduct) return;
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;
    const priceToUse = editPrice ? Number(editPrice) : product.price;
    const newItem: OrderItem = {
      id: Date.now(),
      quantity: quantity,
      unit_price: priceToUse,
      subtotal: quantity * priceToUse,
      product: product,
    };
    setItems([...items, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setEditPrice("");
  };

  const removeItem = (id: number) => setItems(items.filter((item) => item.id !== id));
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const saveOrder = async () => {
  if (!selectedClient || !dueDate || items.length === 0) {
    toast.error("Completa todos los campos");
    return;
  }
  setLoading(true);
  try {
    // Paso 1: Crear el Order
    const orderResponse = await mutateAPI('/orders', 'POST', {
      data: {
        due_date: dueDate,
        order_status: "pendiente",
        total: total,
        client: { id: selectedClient },
      }
    });

    const orderId = orderResponse.data.id;

    // Paso 2: Crear cada OrderItem
    for (const item of items) {
      await mutateAPI('/order-items', 'POST', {
        data: {
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          product: { id: item.product?.id },
          order: { id: orderId },
        }
      });
    }

    toast.success("Pedido creado exitosamente");
    window.location.href = "/orders";
  } catch (error: any) {
    console.error("Error:", error);
    toast.error(error.message || "Error al crear el pedido");
  }
  setLoading(false);
};

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">🛒 Nuevo Pedido</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Datos del Pedido</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedClient ? clients.find((c) => c.id === selectedClient)?.name : "Seleccionar cliente..."}
                    <Search className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] lg:w-[400px] p-0">
                  <div className="p-2">
                    <Input placeholder="Buscar cliente..." value={searchClient} onChange={(e) => setSearchClient(e.target.value)} className="mb-2" />
                    <div className="max-h-[200px] overflow-y-auto">
                      {searchClient === "" ? <p className="text-sm text-gray-400 p-4 text-center">Escribe para buscar...</p> :
                       filteredClients.length === 0 ? <p className="text-sm text-gray-400 p-4 text-center">No encontrado</p> :
                       filteredClients.map((client) => (
                         <div key={client.id} className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer rounded" onClick={() => { setSelectedClient(client.id); setClientOpen(false); setSearchClient(""); }}>
                           <div><p className="font-medium">{client.name}</p><p className="text-xs text-gray-500">{client.phone}</p></div>
                           <Badge variant="outline">{client.client_type}</Badge>
                         </div>
                       ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div><Label>Fecha límite</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Agregar Producto</h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <Label className="mb-2 block">Filtrar por categoría</Label>
                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedProduct(null); setSearchProduct(""); setEditPrice(""); }} className="w-full border rounded-md p-2 bg-white">
                  <option value=""> Todas las categorías</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.name}> {cat.name}</option>))}
                </select>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Producto</Label>
                  <Popover open={productOpen} onOpenChange={setProductOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">{selectedProduct ? products.find((p: any) => p.id === selectedProduct)?.name : "Buscar producto..."}<Search className="ml-2 h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] lg:w-[400px] p-0">
                      <div className="p-2">
                        <Input placeholder="Buscar..." value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} className="mb-2" />
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredProducts.length === 0 ? <p className="text-sm text-gray-400 p-4 text-center">No encontrado</p> :
                           filteredProducts.map((product: any) => (
                             <div key={product.id} className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer rounded" onClick={() => { setSelectedProduct(product.id); setEditPrice(String(product.price)); setProductOpen(false); setSearchProduct(""); }}>
                               <div><p className="font-medium">{product.name}</p><p className="text-xs text-gray-500">{getCategoryName(product)} | Stock: {product.stock}</p></div>
                               <p className="font-bold">${product.price}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div><Label>Precio unitario</Label><Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} /></div>
                <div><Label>Cantidad</Label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>
                <Button onClick={addItem} className="w-full">+ Agregar al pedido</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Vista Previa</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px]">
              <p className="text-lg font-bold text-center">Cliente: {clients.find((c) => c.id === selectedClient)?.name || "Sin seleccionar"}</p>
              <p className="text-sm text-center text-gray-500">Vence: {dueDate || "Sin fecha"}</p>
              <Table>
                <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Cant</TableHead><TableHead>Precio</TableHead><TableHead>Subtotal</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}><TableCell>{item.product?.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>${item.unit_price}</TableCell><TableCell>${item.subtotal}</TableCell><TableCell><button onClick={() => removeItem(item.id)} className="text-red-500">✕</button></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-2xl font-bold text-right mt-4">Total: ${total.toFixed(2)}</p>
            </div>
            <Button onClick={saveOrder} disabled={loading} className="w-full mt-4">{loading ? "Guardando..." : " Guardar Pedido"}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}