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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type FieldDef,
  type OptionsMap,
  type ResourceDef,
  type Row,
} from "./resources";
import { isoToLocalInput, localInputToIso } from "./datetime";
import { saveRow } from "./actions";

interface ResourceFormProps {
  resource: ResourceDef;
  options: OptionsMap;
  row: Row | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  // Reset the form when the dialog (re)opens for a different row — done during
  // render (React's recommended pattern) rather than in an effect.
  const currentKey = open ? `open:${row?.id ?? "new"}` : "closed";
  if (currentKey !== formKey) {
    setFormKey(currentKey);
    if (open) setValues(initialValues(resource.fields, row));
  }

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
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

    startTransition(async () => {
      try {
        await saveRow(resource.table, row?.id ?? null, toPayload(resource.fields, values));
        toast.success(row ? `${resource.singular} aktualisiert` : `${resource.singular} hinzugefügt`);
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Speichern fehlgeschlagen");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
  );
}

interface FieldControlProps {
  id: string;
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  options: OptionsMap;
}

function FieldControl({ id, field, value, onChange, options }: FieldControlProps) {
  if (field.type === "select") {
    const items = (field.optionsKey && options[field.optionsKey]) || [];
    return (
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Auswählen…" />
        </SelectTrigger>
        <SelectContent>
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
            : "text"
      }
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
