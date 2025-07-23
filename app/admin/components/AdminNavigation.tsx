import NavigationLink from "@/app/components/loader/NavigationLink";
import { useRole } from "@/lib/hooks/usePermissions";
type NavItem = {
  id: string;
  label: string;
  path: string;
};

export default function AdminNavigation({
  currentPath,
}: {
  currentPath: string;
}) {
  const { hasRole } = useRole("super_admin");

  let navItems: NavItem[] = [
    { id: "user", label: "Users", path: "/admin/users" },
  ];

  if (hasRole) {
    navItems.push({
      id: "federal-jobs",
      label: "Federal Jobs",
      path: "/admin/federal-jobs",
    });
  }

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
          <NavigationLink href={item.path}>
            <label htmlFor={item.id}>{item.label}</label>
          </NavigationLink>
        </div>
      ))}
    </div>
  );
}
