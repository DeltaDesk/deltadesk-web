"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconHeartbeat } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitSickLeave } from "../plan/actions";

/** Duration choices — always starting today, the value is the number of extra days. */
const DURATION_OPTIONS = [
  { value: "0", label: "Heute" },
  { value: "1", label: "Heute + Morgen" },
  { value: "2", label: "Heute + 2 Tage" },
  { value: "3", label: "Heute + 3 Tage" },
  { value: "4", label: "Heute + 4 Tage" },
  { value: "5", label: "Heute + 5 Tage" },
  { value: "6", label: "Heute + 6 Tage" },
];

export default function SickLeaveForm() {
  const [days, setDays] = useState<string>("0");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await submitSickLeave(Number(days), text);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Krankmeldung eingereicht");
      setText("");
      setDays("0");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="flex items-center gap-2 text-blue-600">
        <IconHeartbeat size={20} stroke={1.8} />
        <h2 className="text-sm font-semibold text-gray-900">Krank melden</h2>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sickleave-duration">Dauer</Label>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger id="sickleave-duration" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sickleave-note">Notiz (optional)</Label>
        <Textarea
          id="sickleave-note"
          value={text}
          placeholder="z. B. Grippe"
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird eingereicht…" : "Krankmeldung einreichen"}
      </Button>
    </form>
  );
}
