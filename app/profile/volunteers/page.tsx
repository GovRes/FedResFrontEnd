"use client";
import ExperienceDashboard from "../components/ExperienceDashboard";

export default function VolunteerPage() {
  return (
    <div>
      <div className="info-box">
        <div>
          <strong>
            If the AI missed any volunteer work, you can add it here.
          </strong>
        </div>{" "}
        <div>
          You can also edit or improve what’s already been pulled in. Just type
          it in or copy and paste from another document.
        </div>
      </div>
      <ExperienceDashboard experienceType="Volunteer" />
    </div>
  );
}
