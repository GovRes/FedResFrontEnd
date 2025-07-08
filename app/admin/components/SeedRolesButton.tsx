"use client";

import { useState } from "react";
import { seedRoles, type SeedResult } from "@/app/utils/seedRoles";

interface SeedRolesButtonProps {
  onSeedComplete?: (result: SeedResult) => void;
  className?: string;
}

export function SeedRolesButton({
  onSeedComplete,
  className = "",
}: SeedRolesButtonProps) {
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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <button
          onClick={handleSeedRoles}
          disabled={isSeeding}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            isSeeding
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          }`}
        >
          {isSeeding ? (
            <span className="flex items-center gap-2">Seeding Roles...</span>
          ) : (
            "Seed Default Roles"
          )}
        </button>

        {lastResult && (
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              lastResult.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {lastResult.success ? "✅ Success" : "❌ Error"}
          </div>
        )}
      </div>

      {lastResult && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Seeding Result</h4>
          <p className="text-sm text-gray-700 mb-3">{lastResult.message}</p>

          {lastResult.details.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-800">Details:</h5>
              <div className="space-y-1">
                {lastResult.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        detail.action === "created"
                          ? "bg-green-500"
                          : detail.action === "existed"
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="font-mono text-gray-600">
                      {detail.role}
                    </span>
                    <span className="text-gray-500">
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
