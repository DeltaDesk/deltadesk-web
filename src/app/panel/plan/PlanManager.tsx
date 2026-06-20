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
      <TabsList className="h-auto flex-wrap">
        {RESOURCES.map(({ key, label, icon: Icon }) => (
          <TabsTrigger key={key} value={key} className="gap-1.5">
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
