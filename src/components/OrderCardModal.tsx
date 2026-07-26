"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";

interface OrderCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export function OrderCardModal({ open, onOpenChange, order }: OrderCardModalProps) {
  if (!order) return null;

  const downloadCardPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    // Título
    doc.setFontSize(20);
    doc.text(order.order_number || `PED-${order.id}`, 14, y);
    doc.setFontSize(12);
    doc.text("PAGADO", 160, y);
    y += 10;

    // Cliente
    doc.setFontSize(10);
    doc.text("CLIENTE", 14, y);
    y += 6;
    doc.setFontSize(14);
    doc.text(order.client?.name || order.client_name || "Sin cliente", 14, y);
    y += 10;

    // Categoría
    if (order.category?.name) {
      doc.setFontSize(10);
      doc.text("CATEGORÍA", 14, y);
      y += 6;
      doc.setFontSize(12);
      doc.text(order.category.name, 14, y);
      y += 10;
    }

    // Vence
    doc.setFontSize(10);
    doc.text("VENCE", 14, y);
    y += 6;
    doc.setFontSize(12);
    doc.text(
      order.due_date
        ? new Date(order.due_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
        : "Sin fecha",
      14, y
    );
    y += 12;

    // Línea
    doc.line(14, y, 196, y);
    y += 8;

    // Productos - CAMBIADO A product_items
    order.product_items?.forEach((item: any) => {
      const productName = item.product?.attributes?.name || item.product?.name || "Producto";
      doc.setFontSize(12);
      doc.text(`${item.quantity}x ${productName}`, 14, y);
      doc.text(`$${item.subtotal?.toLocaleString('es-CO')}`, 180, y, { align: "right" });
      y += 8;
    });

    // Línea
    y += 2;
    doc.line(14, y, 196, y);
    y += 8;

    // Observaciones
    if (order.observaciones) {
      doc.setFontSize(10);
      doc.text("OBSERVACIONES", 14, y);
      y += 6;
      doc.setFontSize(11);
      doc.text(order.observaciones, 14, y, { maxWidth: 180 });
      y += 12;
      doc.line(14, y, 196, y);
      y += 8;
    }

    // Total
    doc.setFontSize(12);
    doc.text("Total", 14, y);
    doc.setFontSize(16);
    doc.text(`$${order.total?.toLocaleString('es-CO') || 0}`, 180, y, { align: "right" });

    doc.save(`pedido-${order.order_number || order.id}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <Card className="border-0 shadow-none h-full">
          <CardHeader className="pb-1 pt-3 px-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                {order.order_number || `PED-${order.id}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={downloadCardPDF}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                <Badge className="bg-green-500">pagado</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-3 pb-3 pt-0 space-y-1 text-sm">
            {/* Cliente */}
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Cliente</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {order.client?.name || order.client?.attributes?.name || order.client_name || "Sin cliente"}
              </p>
            </div>

            {/* Categoría */}
            {order.category?.name && (
              <div className="mb-1">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Categoría</p>
                <Badge variant="outline" className="text-xs">
                  {order.category.name}
                </Badge>
              </div>
            )}

            {/* Vence */}
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Vence</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {order.due_date
                  ? new Date(order.due_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
                  : "Sin fecha"}
              </p>
            </div>

            {/* Productos - CAMBIADO A product_items */}
            <div className="border-t dark:border-gray-700 my-3"></div>
            <div className="space-y-1 mb-3">
              {order.product_items && order.product_items.length > 0 ? (
                order.product_items.map((item: any, index: number) => {
                  const productName = item.product?.attributes?.name || item.product?.name || "Producto";
                  return (
                    <div key={item.id || index} className="flex justify-between text-base">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.quantity}x {productName}
                      </span>
                      <span className="font-medium">${item.subtotal?.toLocaleString('es-CO')}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400">Sin productos</p>
              )}
            </div>

            {/* Observaciones */}
            {order.observaciones && (
              <>
                <div className="border-t dark:border-gray-700 my-3"></div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Observaciones</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.observaciones}</p>
                </div>
              </>
            )}

            {/* Total */}
            <div className="border-t dark:border-gray-700 my-3"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Total</span>
              <span className="text-xl font-bold">${order.total?.toLocaleString('es-CO') || 0}</span>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}