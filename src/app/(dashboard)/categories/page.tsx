"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchAPI, mutateAPI } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DeleteDialog from "../dialogs/DeleteDialog";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteCategory, setDeleteCategory] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await fetchAPI('/categories?pagination[pageSize]=1000');
    setCategories(Array.isArray(data.data) ? data.data : []);
  };

  const getCategoryId = (category: any): string => {
    return category.documentId || category.id;
  };

  const filteredCategories = categories.filter((cat: any) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingCategory(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (category: any) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setOpen(true);
  };

  const saveCategory = async () => {
    if (!name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      if (editingCategory) {
        const categoryId = getCategoryId(editingCategory);
        await mutateAPI(`/categories/${categoryId}`, 'PUT', {
          data: { name, description },
        });
        toast.success("Categoría actualizada");
      } else {
        await mutateAPI('/categories', 'POST', {
          data: { name, description },
        });
        toast.success("Categoría creada");
      }
      
      setOpen(false);
      resetForm();
      loadCategories();
    } catch (error) {
      toast.error("Error al guardar categoría");
    }
  };

  const handleDeleteClick = (category: any) => {
    setDeleteCategory(category);
  };

  const confirmDelete = async () => {
    if (!deleteCategory) return;
    try {
      const categoryId = deleteCategory.documentId || deleteCategory.id;
      await mutateAPI(`/categories/${categoryId}`, 'DELETE');
      toast.success("Categoría eliminada");
      setDeleteCategory(null);
      loadCategories();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold dark:text-white">Categorías</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-lg font-bold text-black dark:text-white">Nombre</TableHead>
                <TableHead className="text-lg font-bold text-black dark:text-white">Descripción</TableHead>
                <TableHead className="text-lg font-bold text-black dark:text-white">Fecha de creación</TableHead>
                <TableHead className="text-lg font-bold text-black dark:text-white">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 dark:text-gray-500 py-8">
                    No se encontraron categorías
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description || "Sin descripción"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(category.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(category)}>
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
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la categoría</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ej: Alimentos, Bebidas, Servicios" 
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Descripción opcional" 
              />
            </div>
            <Button onClick={saveCategory} className="w-full">
              {editingCategory ? "Actualizar" : "Crear"} Categoría
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <DeleteDialog
        open={!!deleteCategory}
        onOpenChange={() => setDeleteCategory(null)}
        itemType="categoría"
        itemName={deleteCategory?.name}
        onConfirm={confirmDelete}
      />
    </div>
  );
}