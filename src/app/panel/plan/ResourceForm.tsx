"use client";

import { useRef, useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type FieldDef,
  type OptionsMap,
  type ResourceDef,
  type Row,
  type SaveDecision,
  type SickConflict,
} from "./resources";
import {
  formatWeekday,
  formatWeekdayShort,
  isoToLocalInput,
  localInputToIso,
} from "./datetime";
import { saveRow } from "./actions";

interface ResourceFormProps {
  resource: ResourceDef;
  options: OptionsMap;
  row: Row | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Sentinel for the "clear selection" item — Radix forbids empty-string values. */
const CLEAR_VALUE = "__clear__";

type Values = Record<string, string>;

/** Build the initial string values for the form from an existing row (or empty). */
function initialValues(fields: FieldDef[], row: Row | null): Values {
  const values: Values = {};
  for (const field of fields) {
    const raw = row?.[field.key];
    if (field.type === "datetime") {
      values[field.key] = isoToLocalInput(raw);
    } else {
      values[field.key] = raw == null ? "" : String(raw);
    }
  }
  return values;
}

/** Convert string form values into the typed payload sent to the database. */
function toPayload(fields: FieldDef[], values: Values): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.key];
    if (field.type === "number") {
      payload[field.key] = value === "" ? null : Number(value);
    } else if (field.type === "datetime") {
      payload[field.key] = localInputToIso(value);
    } else {
      payload[field.key] = value;
    }
  }
  return payload;
}

export default function ResourceForm({
  resource,
  options,
  row,
  open,
  onOpenChange,
}: ResourceFormProps) {
  const [values, setValues] = useState<Values>({});
  const [formKey, setFormKey] = useState<string>("closed");
  const [pending, startTransition] = useTransition();
  // Set when the server reports the chosen leader is sick; drives the AlertDialog.
  const [conflict, setConflict] = useState<SickConflict | null>(null);

  // Track how many Selects are currently open, plus a short guard window after
  // one closes. A Radix Select sits on a higher dismissable layer than the
  // Dialog, so clicking inside the form (but outside the open dropdown) closes
  // the Select *before* the Dialog's outside handler runs — a DOM query would
  // already see it gone. The ref + guard keeps that click from closing the form.
  const openSelectsRef = useRef(0);
  const closeGuardUntilRef = useRef(0);

  function handleSelectOpenChange(selectOpen: boolean) {
    if (selectOpen) {
      openSelectsRef.current += 1;
    } else {
      openSelectsRef.current = Math.max(0, openSelectsRef.current - 1);
      closeGuardUntilRef.current = Date.now() + 350;
    }
  }


  // Reset the form when the dialog (re)opens for a different row — done during
  // render (React's recommended pattern) rather than in an effect.
  const currentKey = open ? `open:${row?.id ?? "new"}` : "closed";
  if (currentKey !== formKey) {
    setFormKey(currentKey);
    setConflict(null);
    if (open) setValues(initialValues(resource.fields, row));
  }

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * Persist the form. With no `decision`, a sick leader makes the server return a
   * conflict, which opens the AlertDialog instead of saving. The dialog re-calls
   * this with "force" (assign anyway) or "substitute" (find a replacement).
   */
  function submit(decision?: SaveDecision) {
    startTransition(async () => {
      const result = await saveRow(
        resource.table,
        row?.id ?? null,
        toPayload(resource.fields, values),
        decision,
      );
      if (result && "confirm" in result) {
        setConflict(result.confirm);
        return;
      }
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        decision === "substitute"
          ? "Ersatz wird gesucht"
          : row
            ? `${resource.singular} aktualisiert`
            : `${resource.singular} hinzugefügt`,
      );
      setConflict(null);
      onOpenChange(false);
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const missing = resource.fields.find(
      (field) => field.required && !values[field.key]
    );
    if (missing) {
      toast.error(`Bitte „${missing.label}“ ausfüllen`);
      return;
    }

    const validationError = resource.validate?.(values);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    submit();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => {
            if (
              openSelectsRef.current > 0 ||
              Date.now() < closeGuardUntilRef.current
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {row ? `${resource.singular} bearbeiten` : `${resource.singular} hinzufügen`}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formular für {resource.singular}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {resource.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`${resource.key}-${field.key}`}>
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </Label>
                <FieldControl
                  id={`${resource.key}-${field.key}`}
                  field={field}
                  value={values[field.key] ?? ""}
                  onChange={(v) => setValue(field.key, v)}
                  options={options}
                  onSelectOpenChange={handleSelectOpenChange}
                />
              </div>
            ))}

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
                {pending ? "Speichern…" : "Speichern"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SickConflictDialog
        conflict={conflict}
        pending={pending}
        onClose={() => setConflict(null)}
        onConfirm={submit}
      />
    </>
  );
}

interface SickConflictDialogProps {
  conflict: SickConflict | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (decision: SaveDecision) => void;
}

/**
 * Asks how to handle assigning a sick employee. For an `overlap` the unit lies
 * inside the sick range, so we offer to search a replacement; for a `warn` the
 * sickness ends the day before, so we offer to assign anyway.
 */
function SickConflictDialog({
  conflict,
  pending,
  onClose,
  onConfirm,
}: SickConflictDialogProps) {
  const isOverlap = conflict?.kind === "overlap";
  return (
    <AlertDialog open={conflict !== null} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        {conflict && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isOverlap ? "Mitarbeiter ist krank" : "Krankmeldung beachten"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isOverlap
                  ? `${conflict.name} ist bis ${formatWeekdayShort(conflict.until)} krank. Ersatz suchen oder abbrechen?`
                  : `${conflict.name} ist bis ${formatWeekday(conflict.until)} krank. Wirklich bereits ${formatWeekday(conflict.unitDate)} zuweisen?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>
                {isOverlap ? "Abbrechen" : "Nein"}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm(isOverlap ? "substitute" : "force");
                }}
              >
                {isOverlap ? "Ersatz suchen" : "Ja"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface FieldControlProps {
  id: string;
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  options: OptionsMap;
  onSelectOpenChange: (open: boolean) => void;
}

function FieldControl({ id, field, value, onChange, options, onSelectOpenChange }: FieldControlProps) {
  if (field.type === "select") {
    const items = (field.optionsKey && options[field.optionsKey]) || [];
    return (
      <Select
        value={value || undefined}
        onValueChange={(v) => onChange(v === CLEAR_VALUE ? "" : v)}
        onOpenChange={onSelectOpenChange}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Auswählen…" />
        </SelectTrigger>
        <SelectContent>
          {!field.required && (
            <SelectItem value={CLEAR_VALUE} className="text-gray-500">
              — Keine —
            </SelectItem>
          )}
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        id={id}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }

  return (
    <Input
      id={id}
      type={
        field.type === "number"
          ? "number"
          : field.type === "datetime"
            ? "datetime-local"
            : field.type === "date"
              ? "date"
              : "text"
      }
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
