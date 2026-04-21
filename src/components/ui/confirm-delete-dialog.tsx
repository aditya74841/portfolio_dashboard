"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone. This will permanently delete the item.",
  itemName,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  const [isInternalLoading, setIsInternalLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsInternalLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsInternalLoading(false);
    }
  };

  const loading = isLoading || isInternalLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-destructive/20 shadow-xl shadow-destructive/10">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-2 animate-pulse">
            <AlertTriangle className="size-8" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-sm">
              {description} {itemName && <span className="font-semibold text-foreground">"{itemName}"</span>}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row gap-3 pt-6 bg-transparent border-none">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
            disabled={loading}
            className="flex-1 rounded-xl h-11"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            disabled={loading}
            className="flex-1 rounded-xl h-11 gap-2 shadow-lg shadow-destructive/20"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
