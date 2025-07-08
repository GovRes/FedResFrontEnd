"use client";

import SeedRoles from "./components/SeedRoles";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            System Administration
          </h1>
          <SeedRoles />
        </div>
      </div>
    </div>
  );
}
