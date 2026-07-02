"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchAPI, mutateAPI } from "@/lib/api";
import { Plus, Pencil, Search, Trash, Trash2 } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

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

  const getProductId = (product: any): string => {
    return product.documentId || product.id;
  };

  const filteredProducts = products.filter((product: any) => {
    const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory 
      ? getCategoryName(product) === selectedCategory
      : true;
    return matchSearch && matchCategory;
  });

  const resetForm = () => {
    setName("");
    setPrice("");
    setStock("");
    setCategoryId("");
    setActive(true);
    setEditingProduct(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setActive(product.active);
    
    if (product.categories && product.categories.length > 0) {
      setCategoryId(String(product.categories[0].id));
    } else {
      setCategoryId("");
    }
    
    setOpen(true);
  };

  const saveProduct = async () => {
    if (!name || !price || !stock) {
      toast.error("Completa nombre, precio y stock");
      return;
    }

    try {
      if (editingProduct) {
        const productId = getProductId(editingProduct);
        
        const updateData: any = {
          name,
          price: Number(price),
          stock: Number(stock),
          active,
        };
        
        if (categoryId) {
          updateData.categories = { set: [{ id: Number(categoryId) }] };
        } else {
          updateData.categories = { set: [] };
        }
        
        await mutateAPI(`/products/${productId}`, 'PUT', { data: updateData });
        toast.success("Producto actualizado");
      } else {
        const createData: any = {
          name,
          price: Number(price),
          stock: Number(stock),
          active,
        };
        
        if (categoryId) {
          createData.categories = { connect: [{ id: Number(categoryId) }] };
        }
        
        await mutateAPI('/products', 'POST', { data: createData });
        toast.success("Producto creado");
      }
      
      setOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error("Error al guardar producto");
    }
  };

  const toggleActive = async (product: any) => {
    try {
      const productId = getProductId(product);
      await mutateAPI(`/products/${productId}`, 'PUT', { data: { active: !product.active } });
      toast.success("Estado actualizado");
      loadProducts();
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const deleteProduct = async (product: any) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      const productId = getProductId(product);
      await mutateAPI(`/products/${productId}`, 'DELETE');
      toast.success("Producto eliminado");
      loadProducts();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Productos</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre del producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-64 border rounded-md p-2"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryName(product)}</TableCell>
                    <TableCell>${product.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(product.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                        })}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => toggleActive(product)}>
                        <Badge variant={product.active ? "default" : "outline"} className="cursor-pointer">
                          {product.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(product)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del producto</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Pizza Grande" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={active || false}
                onChange={(e) => setActive(e.target.checked)}
                id="active"
              />
              <Label htmlFor="active">Producto activo</Label>
            </div>
            <Button onClick={saveProduct} className="w-full">
              {editingProduct ? "Actualizar" : "Crear"} Producto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}