"use client";
import ExperienceDashboard from "../components/ExperienceDashboard";

export default function EducationPage() {
  return (
    <div>
      <div className="info-box">
        <div>
          <strong>
            List any schools where you earned a diploma or degree—like high
            school, college, or trade school.
          </strong>
        </div>{" "}
        <div>
          Some Federal positions have education requirements, such as a specific
          degree or coursework. When education is used to qualify for a
          position, a Federal agency will ask you to provide a transcript when
          you apply to a job or upon tentative selection.
        </div>
      </div>
      <ExperienceDashboard experienceType="Education" />
    </div>
  );
}
