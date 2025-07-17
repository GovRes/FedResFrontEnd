"use client";
import ExperienceDashboard from "../components/ExperienceDashboard";

export default function PastJobsPage() {
  return (
    <div>
      <div className="info-box">
        <div>
          <strong>
            This is where you can review what the AI found—and make it better.
          </strong>
        </div>{" "}
        <div>
          If a job was missed, you can add it. If something needs fixing or you
          want to give more details, you can do that here. Just type it in or
          copy and paste from somewhere else.
        </div>
      </div>
      <ExperienceDashboard experienceType="PastJob" />
    </div>
  );
}
