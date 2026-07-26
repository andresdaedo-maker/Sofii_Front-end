"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface DownloadPDFProps {
  orders: any[];
  totalGeneral: number;
}

export function DownloadPDF({ orders, totalGeneral }: DownloadPDFProps) {
  const generatePDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text("Registro de Pedidos Pagados", 14, 20);
    doc.setFontSize(11);
    doc.text(`Total de pedidos: ${orders.length}`, 14, 28);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 34);

    // Tabla
    const tableData = orders.map((order) => [
      order.order_number || `PED-${order.id}`,
      order.client?.name || order.client_name || "—",
      order.product_items?.[0]?.product?.categories?.[0]?.name || "—",
      order.product_items?.map((item: any) => `${item.quantity}x ${item.product?.name || "—"}`).join(", "),
      `$${order.total?.toLocaleString('es-CO')}`,
      new Date(order.updatedAt).toLocaleDateString('es-CO'),
      order.observaciones || "—",
    ]);

    autoTable(doc, {
      head: [["Pedido", "Cliente", "Categoría", "Productos", "Total", "Fecha", "Observaciones"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0] },
    });

    // Total general
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total General: $${totalGeneral.toLocaleString('es-CO')} COP`, 14, finalY);

    doc.save(`registro-pedidos-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Button onClick={generatePDF} variant="outline">
      <FileDown className="h-4 w-4 mr-2" /> Descargar PDF
    </Button>
  );
}