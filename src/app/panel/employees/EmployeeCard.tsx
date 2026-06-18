import { IconPin, IconClock, IconShieldStar, IconCheck } from "@tabler/icons-react";
import EmployeeAvatar from "./EmployeeAvatar";
import { type Employee } from "@/lib/models/employees";

interface EmployeeCardProps {
  employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const hoursLabel = `${employee.working_time_hours ?? "?"} Std. /Woche`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all duration-150 hover:border-blue-300 hover:shadow-sm">
      <div className="flex items-start gap-3.5">
        <EmployeeAvatar id={employee.id} name={employee.name} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {employee.name || "Unbekannt"}
          </h3>
          {employee.is_admin ? (
            <span className="inline-flex items-center gap-1 mt-1">
              <IconShieldStar size={13} stroke={2.2} className="text-blue-600 shrink-0" />
              <code className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium ">
                Administrator
              </code>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 mt-1">
              <IconCheck size={13} stroke={2.2} className="text-gray-400 shrink-0" />
              <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[11px] font-medium ">
                Mitarbeiter
              </code>
            </span>
          )}
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        {employee.default_studio_name && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <IconPin size={14} stroke={2} className="text-gray-400 shrink-0" />
            <span className="truncate">{employee.default_studio_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-gray-600">
          <IconClock size={14} stroke={2} className="text-gray-400 shrink-0" />
          <span>{hoursLabel}</span>
        </div>
      </dl>
    </div>
  );
}
