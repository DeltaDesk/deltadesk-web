"use client";

import { useState, useTransition } from "react";
import { IconUserPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptEmployeeAction } from "./actions";

interface PendingUser {
  id: string;
  email: string;
  created_at: string;
}

interface AcceptEmployeeDialogProps {
  user: PendingUser;
}

export default function AcceptEmployeeDialog({ user }: AcceptEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAccept() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await acceptEmployeeAction(user.id, name);
        setOpen(false);
        setName("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
      >
        <IconUserPlus size={13} stroke={2} />
        Annehmen
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mitarbeiter annehmen</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Name des Mitarbeiters</Label>
              <Input
                id="emp-name"
                placeholder="Vorname Nachname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAccept()}
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Abbrechen
            </Button>
            <Button onClick={handleAccept} disabled={pending || !name.trim()}>
              Annehmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
