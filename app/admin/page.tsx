"use client";
import { deleteAllModelRecords } from "../../lib/crud/genericDelete";
import SeedRoles from "./components/SeedRoles";

export default function AdminPage() {
  return (
    <div>
      <h1>System Administration</h1>
      <SeedRoles />
      <em> tk make cascading delete for join tables </em>
      <button
        onClick={async () =>
          await deleteAllModelRecords("PastJobApplication", true)
        }
      >
        Delete all PastJobApplication join records
      </button>
      <button
        onClick={async () => await deleteAllModelRecords("Qualification", true)}
      >
        Delete all Qualification records
      </button>
      <button
        onClick={async () =>
          await deleteAllModelRecords("QualificationApplication", true)
        }
      >
        Delete all QualificationApplication records
      </button>
    </div>
  );
}
