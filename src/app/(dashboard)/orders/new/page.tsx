"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Client, Product, OrderItem } from "@/types";
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
    if (product.categories && product.categories.length > 0) {
      return product.categories[0].name;
    }
    return "Sin categoría";
  };

  // Filtrar productos por categoría y búsqueda
  const filteredProducts = Array.isArray(products)
    ? products.filter((product: any) => {
        const matchSearch = product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
          getCategoryName(product).toLowerCase().includes(searchProduct.toLowerCase());
        const matchCategory = selectedCategory
          ? getCategoryName(product) === selectedCategory
          : true;
        return matchSearch && matchCategory;
      })
    : [];

  const filteredClients = Array.isArray(clients)
    ? clients.filter((client) =>
        client.name.toLowerCase().includes(searchClient.toLowerCase()) ||
        (client.phone || "").includes(searchClient) ||
        (client.email || "").toLowerCase().includes(searchClient.toLowerCase())
      )
    : [];

  const addItem = () => {
    if (!selectedProduct) return;

    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;

    const newItem: OrderItem = {
      id: Date.now(),
      quantity: quantity,
      unit_price: product.price,
      subtotal: quantity * product.price,
      product: product,
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const saveOrder = async () => {
    if (!selectedClient || !dueDate || items.length === 0) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const orderItemsIds = [];
      for (const item of items) {
        const data = await mutateAPI('/order-items', 'POST', {
          data: {
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            product: { connect: [{ id: item.product.id }] },
          },
        });
        orderItemsIds.push(data.data.id);
      }

      const client = clients.find((c) => c.id === selectedClient);
      await mutateAPI('/orders', 'POST', {
        data: {
          client_name: client?.name || "Cliente",
          due_date: dueDate,
          order_status: "pendiente",
          client: { connect: [{ id: selectedClient }] },
          order_items: { connect: orderItemsIds.map((id) => ({ id })) },
        },
      });

      toast.success("Pedido creado exitosamente");
      window.location.href = "/orders";
    } catch (error) {
      toast.error("Error al crear el pedido");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">🛒 Nuevo Pedido</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda - Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleccionar cliente */}
            <div>
              <Label>Cliente</Label>
              <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedClient
                      ? clients.find((c) => c.id === selectedClient)?.name
                      : "Seleccionar cliente..."}
                    <Search className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] lg:w-[400px] p-0">
                  <div className="p-2">
                    <Input
                      placeholder="Buscar cliente..."
                      value={searchClient}
                      onChange={(e) => setSearchClient(e.target.value)}
                      className="mb-2"
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {searchClient === "" ? (
                        <p className="text-sm text-gray-400 p-4 text-center">
                          Escribe para buscar clientes...
                        </p>
                      ) : filteredClients.length === 0 ? (
                        <p className="text-sm text-gray-400 p-4 text-center">
                          No se encontraron clientes
                        </p>
                      ) : (
                        filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                            onClick={() => {
                              setSelectedClient(client.id);
                              setClientOpen(false);
                              setSearchClient("");
                            }}
                          >
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-xs text-gray-500">{client.phone}</p>
                            </div>
                            <Badge variant="outline">{client.client_type}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha límite */}
            <div>
              <Label>Fecha límite de pago</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            {/* Sección Agregar Producto */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Agregar Producto</h3>
              
              {/* Filtro por categoría */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <Label className="mb-2 block">Filtrar por categoría</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedProduct(null);
                    setSearchProduct("");
                  }}
                  className="w-full border rounded-md p-2 bg-white"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                       {cat.name}
                    </option>
                  ))}
                </select>
                {selectedCategory && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mostrando productos de: <strong>{selectedCategory}</strong>
                  </p>
                )}
              </div>

              {/* Seleccionar producto */}
              <div className="space-y-3">
                <div>
                  <Label>Producto</Label>
                  <Popover open={productOpen} onOpenChange={setProductOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedProduct
                          ? products.find((p: any) => p.id === selectedProduct)?.name
                          : "Buscar producto..."}
                        <Search className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] lg:w-[400px] p-0">
                      <div className="p-2">
                        <Input
                          placeholder="Buscar por nombre..."
                          value={searchProduct}
                          onChange={(e) => setSearchProduct(e.target.value)}
                          className="mb-2"
                        />
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredProducts.length === 0 ? (
                            <p className="text-sm text-gray-400 p-4 text-center">
                              No se encontraron productos
                            </p>
                          ) : (
                            filteredProducts.map((product: any) => (
                              <div
                                key={product.id}
                                className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                                onClick={() => {
                                  setSelectedProduct(product.id);
                                  setProductOpen(false);
                                  setSearchProduct("");
                                }}
                              >
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {getCategoryName(product)} | Stock: {product.stock}
                                  </p>
                                </div>
                                <p className="font-bold">${product.price}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Cantidad */}
                <div>
                  <Label>Cantidad</Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                </div>

                <Button onClick={addItem} className="w-full">+ Agregar al pedido</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha - Vista previa */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px]">
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-gray-800">
                  Cliente: {clients.find((c) => c.id === selectedClient)?.name || "Sin seleccionar"}
                </p>
                <p className="text-sm text-gray-500 mt-1">Vence: {dueDate || "Sin fecha"}</p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cant</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{getCategoryName(item.product)}</p>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.unit_price}</TableCell>
                        <TableCell>${item.subtotal}</TableCell>
                        <TableCell>
                          <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-400">Sin productos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t mt-4 pt-4 text-right">
                <p className="text-2xl font-bold">Total: ${total.toFixed(2)}</p>
              </div>
            </div>

            <Button onClick={saveOrder} disabled={loading} className="w-full mt-4">
              {loading ? "Guardando..." : "Guardar Pedido"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}