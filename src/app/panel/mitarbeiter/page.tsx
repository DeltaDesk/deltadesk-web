"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { type Employee } from "@/lib/models/employees";

const supabase = createClient();

export default function PageMitarbeiter({  }: {
  userId: string;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    
    // Query your public profiles table instead of auth.users
    const { data, error } = await supabase
      .from("profiles") 
      .select(`
        id,
        is_admin  
      `); // If you need auth data, you'd add: users(email) assuming the FK is configured

    if (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setEmployees((data as Employee[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
            Lädt…
          </div>
        ) : (
          <div className="min-w-160 relative">
            {employees.map((employee) => (
              <div key={employee.id} className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">{employee.is_admin ? "Admin" : "Mitarbeiter"}</h2>
                {/* <p className="text-sm text-gray-600">{employee.} Stunden pro Woche</p> */}
              </div>
            ))}
          </div>
        )}
      </div>
  );
}