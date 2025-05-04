"use client";
import { JobType, TopicType, PastJobType } from "@/app/utils/responseSchemas";
import { JSX, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import Sidebar from "@/app/components/ally/sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "@/app/components/ally/sharedComponents/DetailedListEditor/SidebarItem";
import styles from "@/app/components/ally/ally.module.css";
import EditSingleJob from "@/app/components/ally/pastJobsComponents/EditSingleJob";
import { topicPastJobMatcher } from "@/app/components/aiProcessing/topicPastJobMatcher";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import {
  getApplicationAssociations,
  getApplicationWithJob,
} from "@/app/crud/application";
import { fetchTopicsByJobId } from "@/app/crud/topic";

export default function PastJobsDetailsPage({}) {
  let itemsList: JSX.Element[] = [];
  const [job, setJob] = useState<JobType | null>(null);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<TopicType[]>([]);
  const [PastJobs, setPastJobs] = useState<PastJobType[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<PastJobType | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const { applicationId } = useApplication();

  function savePastJob(item: PastJobType) {
    let updatedItems = PastJobs.map((i) => (i.id !== item.id ? i : item));
    console.log({ updatedItems });
    setPastJobs(updatedItems);
  }

  // Navigate to specific job detail page when currentJobIndex changes
  useEffect(() => {
    if (PastJobs.length > 0 && currentJobIndex >= 0) {
      const selectedJob = PastJobs[currentJobIndex];
      if (selectedJob && selectedJob.id) {
        setCurrentItem(selectedJob);
        // Check if we're not already on this path to avoid unnecessary navigation
        const targetPath = `/ally/past-experience/past-job-details/${selectedJob.id}`;
        if (!pathname.includes(selectedJob.id)) {
          router.push(targetPath);
        }
      }
    }
  }, [PastJobs, currentJobIndex, router, pathname]);

  useEffect(() => {
    async function connectJobsToTopics() {
      if (topics.length > 0 && PastJobs.length > 0) {
        console.log(88);
        const result = await topicPastJobMatcher({
          PastJobs,
          topics,
        });
        console.log(101, result);
        // Mark the matching as complete
        setPastJobs(result as PastJobType[]);
      }
      return;
    }
    async function fetchTopics() {
      console.log(applicationId);
      let application = await getApplicationWithJob({
        id: applicationId || "de171305-f6bb-4be6-bf97-2bc768836f9f",
      });
      console.log(application);
      let topics = await fetchTopicsByJobId(application.jobId);
      console.log(topics);
      setJob(application.job);
      setTopics(topics);
      return;
    }
    async function fetchPastJobs() {
      let PastJobs = await getApplicationAssociations({
        applicationId: applicationId || "de171305-f6bb-4be6-bf97-2bc768836f9f",
        associationType: "PastJob",
      });
      setPastJobs(PastJobs);
      console.log(PastJobs);
      return;
    }
    setLoading(true);

    // Create and immediately call an async function
    (async () => {
      try {
        await fetchPastJobs();
        await fetchTopics();
        await connectJobsToTopics();
      } finally {
        setLoading(false);
      }
    })();

    // No return cleanup function needed
  }, [applicationId]);

  // Look for job ID in the URL path when page loads
  useEffect(() => {
    if (!loading && PastJobs.length > 0 && pathname) {
      const pathParts = pathname.split("/");
      const jobId = pathParts[pathParts.length - 1];

      // If valid job ID found in URL, set current index to that job
      if (jobId && jobId !== "past-job-details") {
        const jobIndex = PastJobs.findIndex((job) => job.id === jobId);
        if (jobIndex >= 0) {
          setCurrentJobIndex(jobIndex);
          setCurrentItem(PastJobs[jobIndex]);
          return;
        }
      }

      // If no valid job ID in URL, redirect to the first job
      if (PastJobs[0] && PastJobs[0].id) {
        router.push(`/ally/past-experience/past-job-details/${PastJobs[0].id}`);
      }
    }
  }, [loading, PastJobs, pathname, router]);

  if (loading) {
    return (
      <TextBlinkLoader text="Matching your job experience to the job you want" />
    );
  }

  if (PastJobs && PastJobs.length > 0) {
    itemsList = PastJobs.map((item: PastJobType, index) => {
      return (
        <SidebarItem
          currentIndex={currentJobIndex}
          index={index}
          key={item.id}
          setCurrentIndex={setCurrentJobIndex}
          item={item}
        />
      );
    });
  }

  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>Connect your past experience to your future role at {job?.title}</h3>
      <div className={styles.detailedListEditorContent}>
        {/* sidebar */}
        {/* <Sidebar
          currentIndex={currentJobIndex}
          setCurrentIndex={setCurrentJobIndex}
          items={PastJobs}
          titleText="Past Jobs"
        />
        {currentItem &&
          currentItem.PastJobQualifications &&
          currentItem.PastJobQualifications.length > 0 && (
            <EditSingleJob
              currentJobIndex={currentJobIndex}
              localPastJobs={PastJobs}
              // nextStep={savePastJob}
              PastJob={currentItem}
              PastJobsLength={PastJobs.length}
              setCurrentJobIndex={setCurrentJobIndex}
              savePastJob={savePastJob}
            />
          )} */}
      </div>
    </div>
  );
}
