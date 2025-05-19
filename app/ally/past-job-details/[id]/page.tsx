"use client";

import { use, useEffect, useState } from "react";
import ExperienceDetailPage from "../../components/ExperienceDetailPage";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [path, setPath] = useState<string>("");

  useEffect(() => {
    // Get current URL path
    const path = window.location.pathname;
    // Find the last segment before the ID
    const match = path.match(/\/([^\/]+)\/[^\/]+$/);
    if (match && match[1]) {
      setPath(match[1]);
    }
  }, []);

  return <ExperienceDetailPage />;
}
