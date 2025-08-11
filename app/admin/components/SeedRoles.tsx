"use client";
import { useState } from "react";
import { SeedRolesButton } from "./SeedRolesButton";
import type { SeedResult } from "@/lib/utils/seedRoles";
import { useRole } from "@/lib/hooks/usePermissions";

export default function SeedRoles() {
  const [seedHistory, setSeedHistory] = useState<
    Array<SeedResult & { timestamp: Date }>
  >([]);
  const { hasRole } = useRole("super_admin");
  const handleSeedComplete = (result: SeedResult) => {
    setSeedHistory((prev) => [...prev, { ...result, timestamp: new Date() }]);
  };
  return (
    <>
      {hasRole && (
        <>
          <div>
            <section>
              <h2>Role Management</h2>
              <p>
                Initialize the system with default user roles. This should
                typically only be done once during initial setup.
              </p>

              <div>
                <div>
                  <div>
                    <h3>Caution</h3>
                    <div>
                      <p>
                        This will create default roles (User, Admin) if they
                        don't already exist. Existing roles will not be
                        modified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <SeedRolesButton onSeedComplete={handleSeedComplete} />
            </section>
          </div>
          {seedHistory.length > 0 && (
            <div>
              <h3>Recent Seeding History</h3>
              <div>
                {seedHistory
                  .slice(-5)
                  .reverse()
                  .map((entry, index) => (
                    <div key={index}>
                      <div>
                        <span>{entry.timestamp.toLocaleString()}</span>
                        <span>{entry.success ? "Success" : "Failed"}</span>
                      </div>
                      <p>{entry.message}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
