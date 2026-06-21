"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setWorkingTimeAction } from "./actions";
import type { WorkingTimeOption } from "@/lib/models/employees";

interface Props {
  profileId: string;
  currentWorkingTimeId: string | null;
  options: WorkingTimeOption[];
}

export default function WorkingTimeSelect({ profileId, currentWorkingTimeId, options }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(() => {
      setWorkingTimeAction(profileId, value);
    });
  }

  return (
    <Select
      defaultValue={currentWorkingTimeId ?? undefined}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-6 text-[11px] px-1.5 py-0 gap-1 border-0 bg-transparent text-gray-500 shadow-none focus:ring-0 hover:bg-gray-100 rounded w-full -ml-0.5">
        <SelectValue placeholder="Arbeitszeit wählen…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id} className="text-xs">
            {opt.name} ({opt.hours_per_week} Std./Woche)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
