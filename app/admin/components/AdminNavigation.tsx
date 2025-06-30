import Link from "next/link";
import styles from "../adminStyles.module.css";

type NavItem = {
  id: string;
  label: string;
  path: string;
};

const navItems: NavItem[] = [
  { id: "user", label: "Users", path: "/admin/users" },
  { id: "federal-jobs", label: "Federal Jobs", path: "/admin/federal-jobs" },
];

export default function AdminNavigation({
  currentPath,
}: {
  currentPath: string;
}) {
  return (
    <div className="tabs">
      {navItems.map((item) => (
        <div key={item.id}>
          <input
            type="radio"
            name="tabs"
            id={item.id}
            checked={currentPath === item.path}
            readOnly
          />
          <Link href={item.path}>
            <label htmlFor={item.id}>{item.label}</label>
          </Link>
        </div>
      ))}
    </div>
  );
}
