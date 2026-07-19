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
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await fetchAPI('/clients');
    setClients(Array.isArray(data.data) ? data.data : []);
  };

  const getClientId = (client: any): string => {
    return client.documentId || client.id;
  };

  const filteredClients = clients.filter((client: any) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    (client.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (client.phone || "").includes(search)
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setEditingClient(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (client: any) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setAddress(client.address || "");
    setOpen(true);
  };

  const saveClient = async () => {
    if (!name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      if (editingClient) {
        const clientId = getClientId(editingClient);
        await mutateAPI(`/clients/${clientId}`, 'PUT', {
          data: { name, email, phone, address },
        });
        toast.success("Cliente actualizado");
      } else {
        await mutateAPI('/clients', 'POST', {
          data: { name, email, phone, address },
        });
        toast.success("Cliente creado");
      }
      
      setOpen(false);
      resetForm();
      loadClients();
    } catch (error) {
      toast.error("Error al guardar cliente");
    }
  };

  const deleteClient = async (client: any) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    try {
      const clientId = getClientId(client);
      await mutateAPI(`/clients/${clientId}`, 'DELETE');
      toast.success("Cliente eliminado");
      loadClients();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Clientes</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
       {/* tabla de clientes*/}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Fecha registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client: any) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-sm">{client.email || "—"}</TableCell>
                    <TableCell className="text-sm">{client.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {client.address || "Sin dirección"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(client.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteClient(client)}>
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
              {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Nombre completo" 
              />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="cliente@email.com" 
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="3001234567" 
              />
            </div>
            <div>
              <Label>Descripción / Dirección</Label>
              <Input 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="Dirección o descripción del cliente" 
              />
            </div>
            <Button onClick={saveClient} className="w-full">
              {editingClient ? "Actualizar" : "Crear"} Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}