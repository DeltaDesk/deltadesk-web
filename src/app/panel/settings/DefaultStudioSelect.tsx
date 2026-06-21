"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDefaultStudio } from "./actions";
import type { Studio } from "@/lib/models/studios";

interface Props {
  studios: Studio[];
  currentStudioId: string | null;
}

const NONE = "__none__";

export default function DefaultStudioSelect({ studios, currentStudioId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(() => {
      updateDefaultStudio(value === NONE ? null : value);
    });
  }

  return (
    <Select
      defaultValue={currentStudioId ?? NONE}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-full sm:w-72">
        <SelectValue placeholder="Studio auswählen…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Kein Standard-Studio</SelectItem>
        {studios.map((studio) => (
          <SelectItem key={studio.id} value={studio.id}>
            {studio.name} – {studio.city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
