"use client";

import { updateExistingEducationTypes } from "../crud/batchUpdate";
import SeedRoles from "./components/SeedRoles";

export default function AdminPage() {
  return (
    <div>
      <h1>System Administration</h1>
      <SeedRoles />
      <button onClick={async () => await updateExistingEducationTypes()}>
        Update education types
      </button>
    </div>
  );
}
