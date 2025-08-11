"use client";
import { deleteAllModelRecords } from "../../lib/crud/genericDeleteAll";
import SeedRoles from "./components/SeedRoles";

export default function AdminPage() {
  return (
    <div>
      <h1>System Administration</h1>
      <SeedRoles />
      <button
        onClick={async () => await deleteAllModelRecords("Application", true)}
      >
        Delete all Application records
      </button>
    </div>
  );
}
