import Link from "next/link";
import styles from "../profileStyles.module.css";

type NavItem = {
  id: string;
  label: string;
  path: string;
};

const navItems: NavItem[] = [
  { id: "profile", label: "Profile", path: "/profile" },
  { id: "resumes", label: "Resumes", path: "/profile/resumes" },
  { id: "past-jobs", label: "Past Jobs", path: "/profile/past-jobs" },
  { id: "volunteer", label: "Volunteer", path: "/profile/volunteers" },
  { id: "education", label: "Education", path: "/profile/educations" },
  { id: "awards", label: "Awards", path: "/profile/awards" },
  { id: "applications", label: "Applications", path: "/profile/applications" },
];

export default function ProfileNavigation({
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
