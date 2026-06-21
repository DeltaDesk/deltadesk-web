"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RESOURCES, type Row, type OptionsMap } from "./resources";
import ResourceSection from "./ResourceSection";

interface PlanManagerProps {
  data: Record<string, Row[]>;
  options: OptionsMap;
}

export default function PlanManager({ data, options }: PlanManagerProps) {
  return (
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
  );
}
