"use client";

import { useState } from "react";
import { IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RESOURCES, type Row, type OptionsMap } from "./resources";
import ResourceSection from "./ResourceSection";
import AutoFillDialog from "./AutoFillDialog";

interface PlanManagerProps {
  data: Record<string, Row[]>;
  options: OptionsMap;
}

export default function PlanManager({ data, options }: PlanManagerProps) {
  const [autoFillOpen, setAutoFillOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setAutoFillOpen(true)}
          className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 sm:w-auto"
        >
          <IconSparkles size={16} stroke={2} />
          Plan automatisch füllen
        </Button>
      </div>

      <Tabs defaultValue={RESOURCES[0].key} className="gap-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 group-data-horizontal/tabs:h-auto">
          {RESOURCES.map(({ key, label, icon: Icon }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="h-9 flex-none gap-1.5"
            >
              <Icon size={16} stroke={1.8} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {RESOURCES.map((resource) => (
          <TabsContent key={resource.key} value={resource.key}>
            <ResourceSection
              resource={resource}
              rows={data[resource.key] ?? []}
              options={options}
            />
          </TabsContent>
        ))}
      </Tabs>

      <AutoFillDialog open={autoFillOpen} onOpenChange={setAutoFillOpen} />
    </div>
  );
}
