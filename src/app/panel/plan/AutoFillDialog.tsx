"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { autoFillSchedule } from "./actions";

interface AutoFillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ISO weekday (1 = Mon … 7 = Sun) with its short German label. */
const WEEKDAYS = [
  { dow: 1, label: "Mo" },
  { dow: 2, label: "Di" },
  { dow: 3, label: "Mi" },
  { dow: 4, label: "Do" },
  { dow: 5, label: "Fr" },
  { dow: 6, label: "Sa" },
  { dow: 7, label: "So" },
];

export default function AutoFillDialog({ open, onOpenChange }: AutoFillDialogProps) {
  const [hours, setHours] = useState("10");
  const [days, setDays] = useState<Set<number>>(
    () => new Set(WEEKDAYS.map((w) => w.dow)),
  );
  const [minTime, setMinTime] = useState("08:00");
  const [maxTime, setMaxTime] = useState("22:00");
  const [pending, startTransition] = useTransition();

  function toggleDay(dow: number, checked: boolean) {
    setDays((prev) => {
      const next = new Set(prev);
      if (checked) next.add(dow);
      else next.delete(dow);
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const hoursNum = Number(hours);
    if (!Number.isFinite(hoursNum) || hoursNum < 1) {
      toast.error("Bitte eine gültige Stundenzahl pro Woche angeben.");
      return;
    }
    if (days.size === 0) {
      toast.error("Bitte mindestens einen Wochentag auswählen.");
      return;
    }
    if (maxTime <= minTime) {
      toast.error("Die Endzeit muss nach der Startzeit liegen.");
      return;
    }

    startTransition(async () => {
      const result = await autoFillSchedule({
        hoursPerWeek: hoursNum,
        weekdays: [...days],
        minTime,
        maxTime,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.created === 0) {
        toast.info("Keine neuen Kurse eingeplant.");
      } else {
        toast.success(
          `${result.created} Kurse erstellt · ${result.assigned} zugewiesen` +
            (result.cancelled > 0 ? ` · ${result.cancelled} ohne Vertretung` : ""),
        );
      }
      if (result.capped) {
        toast.warning(
          "Das Zeitfenster reichte nicht für alle Stunden – es wurden nur die passenden Slots gefüllt.",
        );
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan automatisch füllen</DialogTitle>
          <DialogDescription>
            Erstellt Kurse aus den vorhandenen Kursarten für die aktuelle Woche
            und weist verfügbare Mitarbeiter zu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="autofill-hours">Stunden pro Woche</Label>
            <Input
              id="autofill-hours"
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Wochentage, an denen Kurse stattfinden dürfen</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w) => (
                <label
                  key={w.dow}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 has-[[data-state=checked]]:border-blue-300 has-[[data-state=checked]]:bg-blue-50 has-[[data-state=checked]]:text-blue-700"
                >
                  <Checkbox
                    checked={days.has(w.dow)}
                    onCheckedChange={(c) => toggleDay(w.dow, c === true)}
                  />
                  {w.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="autofill-min">Öffnungszeit von</Label>
              <Input
                id="autofill-min"
                type="time"
                value={minTime}
                onChange={(e) => setMinTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="autofill-max">bis</Label>
              <Input
                id="autofill-max"
                type="time"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Füllen…" : "Plan füllen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
