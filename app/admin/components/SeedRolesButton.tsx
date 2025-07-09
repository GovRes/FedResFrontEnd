"use client";

import { useState } from "react";
import { seedRoles, type SeedResult } from "@/app/utils/seedRoles";

interface SeedRolesButtonProps {
  onSeedComplete?: (result: SeedResult) => void;
}

export function SeedRolesButton({ onSeedComplete }: SeedRolesButtonProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<SeedResult | null>(null);

  const handleSeedRoles = async () => {
    setIsSeeding(true);
    setLastResult(null);

    try {
      const result = await seedRoles();
      setLastResult(result);
      onSeedComplete?.(result);
    } catch (error) {
      const errorResult: SeedResult = {
        success: false,
        message: `Unexpected error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        details: [],
      };
      setLastResult(errorResult);
      onSeedComplete?.(errorResult);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div>
      <div>
        <button onClick={handleSeedRoles} disabled={isSeeding}>
          {isSeeding ? <span>Seeding Roles...</span> : "Seed Default Roles"}
        </button>

        {lastResult && (
          <div>{lastResult.success ? "✅ Success" : "❌ Error"}</div>
        )}
      </div>

      {lastResult && (
        <div>
          <h4>Seeding Result</h4>
          <p>{lastResult.message}</p>

          {lastResult.details.length > 0 && (
            <div>
              <h5>Details:</h5>
              <div>
                {lastResult.details.map((detail, index) => (
                  <div key={index}>
                    <span />
                    <span>{detail.role}</span>
                    <span>
                      {detail.action === "created" && "Created successfully"}
                      {detail.action === "existed" && "Already exists"}
                      {detail.action === "error" && `Error: ${detail.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
