import NavBar from "./navbar";
import { Suspense } from "react";
export default function Header() {
  return (
    <Suspense>
      <NavBar />
    </Suspense>
  );
}
