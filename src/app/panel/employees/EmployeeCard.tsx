import { IconPin, IconClock } from "@tabler/icons-react";
import EmployeeAvatar from "./EmployeeAvatar";
import AdminToggleButton from "./AdminToggleButton";
import WorkingTimeSelect from "./WorkingTimeSelect";
import { type Employee, type WorkingTimeOption } from "@/lib/models/employees";

interface EmployeeCardProps {
  employee: Employee;
  isCurrentUser: boolean;
  currentUserIsAdmin: boolean;
  workingTimeOptions: WorkingTimeOption[];
}

export default function EmployeeCard({ employee, isCurrentUser, currentUserIsAdmin, workingTimeOptions }: EmployeeCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3.5 transition-all duration-150 hover:border-blue-300 hover:shadow-sm">
      <div className="flex items-center gap-2.5">
        <EmployeeAvatar id={employee.id} name={employee.name} size={36} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {employee.name || "Unbekannt"}
            {isCurrentUser && (
              <span className="ml-1.5 text-[12px] font-semibold text-gray-500">(ich)</span>
            )}
          </h3>
          {currentUserIsAdmin && !isCurrentUser ? (
            <AdminToggleButton profileId={employee.id} isAdmin={employee.is_admin} />
          ) : (
            <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium ${
              employee.is_admin
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {employee.is_admin ? "Administrator" : "Mitarbeiter"}
            </span>
          )}
        </div>
      </div>

      <dl className="mt-2.5 space-y-1 text-xs text-gray-500">
        {employee.default_studio_name && (
          <div className="flex items-center gap-1.5">
            <IconPin size={12} stroke={2} className="text-gray-400 shrink-0" />
            <span className="truncate">{employee.default_studio_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <IconClock size={12} stroke={2} className="text-gray-400 shrink-0" />
          {currentUserIsAdmin ? (
            <WorkingTimeSelect
              profileId={employee.id}
              currentWorkingTimeId={employee.working_time}
              options={workingTimeOptions}
            />
          ) : (
            <span>{employee.working_time_hours ?? "?"} Std./Woche</span>
          )}
        </div>
      </dl>
    </div>
  );
}
