"use client";

import { useState } from "react";
import { SeedRolesButton } from "./components/SeedRolesButton";
import type { SeedResult } from "@/app/utils/seedRoles";

export default function AdminPage() {
  const [seedHistory, setSeedHistory] = useState<
    Array<SeedResult & { timestamp: Date }>
  >([]);

  const handleSeedComplete = (result: SeedResult) => {
    setSeedHistory((prev) => [...prev, { ...result, timestamp: new Date() }]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            System Administration
          </h1>

          <div className="space-y-6">
            <section className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Role Management
              </h2>
              <p className="text-gray-600 mb-4">
                Initialize the system with default user roles. This should
                typically only be done once during initial setup.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Caution
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
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
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Seeding History
              </h3>
              <div className="space-y-3">
                {seedHistory
                  .slice(-5)
                  .reverse()
                  .map((entry, index) => (
                    <div key={index} className="bg-gray-50 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">
                          {entry.timestamp.toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.success
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.success ? "Success" : "Failed"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {entry.message}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
