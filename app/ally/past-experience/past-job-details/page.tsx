"use client";
import { JobType, TopicType, UserJobType } from "@/app/utils/responseSchemas";
import { JSX, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import Sidebar from "@/app/components/ally/sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "@/app/components/ally/sharedComponents/DetailedListEditor/SidebarItem";
import styles from "@/app/components/ally/ally.module.css";
import EditSingleJob from "@/app/components/ally/userJobsComponents/EditSingleJob";
import { topicUserJobMatcher } from "@/app/components/aiProcessing/topicUserJobMatcher";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useUserResume } from "@/app/providers/userResumeContext";
import {
  getUserResumeAssociations,
  getUserResumeWithJob,
} from "@/app/crud/userResume";
import { fetchTopicsByJobId } from "@/app/crud/topic";

export default function UserJobsDetailsPage({}) {
  let itemsList: JSX.Element[] = [];
  const [job, setJob] = useState<JobType | null>(null);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<TopicType[]>([]);
  const [userJobs, setUserJobs] = useState<UserJobType[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<UserJobType | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const { userResumeId } = useUserResume();

  function saveUserJob(item: UserJobType) {
    let updatedItems = userJobs.map((i) => (i.id !== item.id ? i : item));
    console.log({ updatedItems });
    setUserJobs(updatedItems);
  }

  // Navigate to specific job detail page when currentJobIndex changes
  useEffect(() => {
    if (userJobs.length > 0 && currentJobIndex >= 0) {
      const selectedJob = userJobs[currentJobIndex];
      if (selectedJob && selectedJob.id) {
        setCurrentItem(selectedJob);
        // Check if we're not already on this path to avoid unnecessary navigation
        const targetPath = `/ally/past-experience/past-job-details/${selectedJob.id}`;
        if (!pathname.includes(selectedJob.id)) {
          router.push(targetPath);
        }
      }
    }
  }, [userJobs, currentJobIndex, router, pathname]);

  useEffect(() => {
    async function connectJobsToTopics() {
      if (topics.length > 0 && userJobs.length > 0) {
        console.log(88);
        const result = await topicUserJobMatcher({
          userJobs,
          topics,
        });
        console.log(101, result);
        // Mark the matching as complete
        setUserJobs(result as UserJobType[]);
      }
      return;
    }
    async function fetchTopics() {
      console.log(userResumeId);
      let userResume = await getUserResumeWithJob({
        id: userResumeId || "de171305-f6bb-4be6-bf97-2bc768836f9f",
      });
      console.log(userResume);
      let topics = await fetchTopicsByJobId(userResume.jobId);
      console.log(topics);
      setJob(userResume.job);
      setTopics(topics);
      return;
    }
    async function fetchUserJobs() {
      let userJobs = await getUserResumeAssociations({
        userResumeId: userResumeId || "de171305-f6bb-4be6-bf97-2bc768836f9f",
        associationType: "UserJob",
      });
      setUserJobs(userJobs);
      console.log(userJobs);
      return;
    }
    setLoading(true);

    // Create and immediately call an async function
    (async () => {
      try {
        await fetchUserJobs();
        await fetchTopics();
        await connectJobsToTopics();
      } finally {
        setLoading(false);
      }
    })();

    // No return cleanup function needed
  }, [userResumeId]);

  // Look for job ID in the URL path when page loads
  useEffect(() => {
    if (!loading && userJobs.length > 0 && pathname) {
      const pathParts = pathname.split("/");
      const jobId = pathParts[pathParts.length - 1];

      // If valid job ID found in URL, set current index to that job
      if (jobId && jobId !== "past-job-details") {
        const jobIndex = userJobs.findIndex((job) => job.id === jobId);
        if (jobIndex >= 0) {
          setCurrentJobIndex(jobIndex);
          setCurrentItem(userJobs[jobIndex]);
          return;
        }
      }

      // If no valid job ID in URL, redirect to the first job
      if (userJobs[0] && userJobs[0].id) {
        router.push(`/ally/past-experience/past-job-details/${userJobs[0].id}`);
      }
    }
  }, [loading, userJobs, pathname, router]);

  if (loading) {
    return (
      <TextBlinkLoader text="Matching your job experience to the job you want" />
    );
  }

  if (userJobs && userJobs.length > 0) {
    itemsList = userJobs.map((item: UserJobType, index) => {
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
          items={userJobs}
          titleText="Past Jobs"
        />
        {currentItem &&
          currentItem.userJobQualifications &&
          currentItem.userJobQualifications.length > 0 && (
            <EditSingleJob
              currentJobIndex={currentJobIndex}
              localUserJobs={userJobs}
              // nextStep={saveUserJob}
              userJob={currentItem}
              userJobsLength={userJobs.length}
              setCurrentJobIndex={setCurrentJobIndex}
              saveUserJob={saveUserJob}
            />
          )} */}
      </div>
    </div>
  );
}
