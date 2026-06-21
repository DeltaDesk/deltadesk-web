"use client";

import { useState } from "react";
import { IconPlus, IconPencil } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ResourceDef, type Row, type OptionsMap } from "./resources";
import ResourceForm from "./ResourceForm";
import DeleteButton from "./DeleteButton";

interface ResourceSectionProps {
  resource: ResourceDef;
  rows: Row[];
  options: OptionsMap;
}

export default function ResourceSection({
  resource,
  rows,
  options,
}: ResourceSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setFormOpen(true);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-3.5 bg-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{resource.label}</h2>
          <p className="text-xs text-gray-500">
            {rows.length} {rows.length === 1 ? "Eintrag" : "Einträge"}
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="w-full sm:w-auto">
          <IconPlus size={16} stroke={2} />
          {resource.singular} hinzufügen
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-gray-400">
          <resource.icon size={36} stroke={1.2} />
          <p className="text-sm">Keine {resource.label} vorhanden</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {resource.columns.map((column) => (
                <TableHead key={column.label}>{column.label}</TableHead>
              ))}
              <TableHead className="w-[1%] text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {resource.columns.map((column) => (
                  <TableCell key={column.label} className="text-gray-700">
                    {column.render(row)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-gray-500 hover:text-blue-600"
                      onClick={() => openEdit(row)}
                      aria-label="Bearbeiten"
                    >
                      <IconPencil size={16} stroke={1.8} />
                    </Button>
                    <DeleteButton
                      table={resource.table}
                      id={row.id}
                      label={resource.singular}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ResourceForm
        resource={resource}
        options={options}
        row={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
