"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  itemName?: string;
  itemType?: string; 
  onConfirm: () => void;
}

export default function DeleteDialog({
  open,
  onOpenChange,
  title,
  message,
  itemName,
  itemType = "elemento",
  onConfirm,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || `Eliminar ${itemType}`}</DialogTitle>
          <DialogDescription>
            {message || `¿Estás seguro de eliminar ${itemName ? `"${itemName}"` : `este ${itemType}`}? Esta acción no se puede deshacer.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}