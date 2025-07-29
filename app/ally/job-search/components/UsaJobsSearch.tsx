import styles from "../../ally.module.css";
import BaseForm from "@/app/components/forms/BaseForm";
import {
  SubmitButton,
  SelectWithLabel,
  TextWithLabel,
  NumberWithLabel,
  ToggleWithLabel,
} from "../../../components/forms/Inputs";
import { FormEvent, useEffect, useState } from "react";
import {
  agencies,
  positionScheduleType,
  travelPercentage,
} from "@/app/utils/usaJobsCodes";
import { JobSearchObject } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";

import { delayAllyChat } from "@/app/utils/allyChat";
import { usaJobsSearch } from "@/app/utils/usaJobsSearch";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoading } from "@/app/providers/loadingContext";
export default function UsaJobsSearch({
  searchObject,
  setSearchObject,
  setSearchResults,
}: {
  searchObject: JobSearchObject;
  setSearchObject: Function;
  setSearchResults: Function;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { setIsLoading } = useLoading();

  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(jobSearchZodSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
  });

  const onSubmit = async (data: JobSearchObject): Promise<void> => {
    window.scrollTo(0, 0);
    setLoading(true);

    // Create the complete search data with user info from props
    const completeSearchData = {
      ...data,
      user: searchObject.user, // Preserve the user data from props
    };

    // Update the searchObject state for future use
    setSearchObject(completeSearchData);

    // Use the complete search data directly
    let results = await fetch("/api/jobs/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(completeSearchData),
    }).then((res) => res.json());
    setLoading(false);
    return res;
  }

  async function onSubmitUsaJobsSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.scrollTo(0, 0);
    let results = await search();
    if (results.length > 0) {
      router.push("/ally/job-search/results");
    } else {
      router.push("/ally/job-search/no-results");
    }
    setSearchResults(results);

  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };


  let allyStatements = [
    "Let's search for the job you want. Put in as much or as little information as you wish.",
  ];

  let { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  if (loading) {
    return <Loader text="Searching USA jobs..." />;
  }
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>{allyFormattedGraphs}</div>
      <div
        className={`${styles.userChatContainer} ${styles.fade}`}
        style={{ animationDelay: `${delay}s` }}
      >
        <BaseForm onSubmit={onSubmitUsaJobsSearch}>
          <TextWithLabel
            label="Keywords (separate multiple keywords with a semicolon)"
            name="keyword"
            onChange={onChange}
            value={searchObject.keyword || ""}
          />
          <TextWithLabel
            label="Position Title"
            name="positionTitle"
            onChange={onChange}
            value={searchObject.positionTitle || ""}
          />
          <TextWithLabel
            label="Location"
            name="locationName"
            onChange={onChange}
            value={searchObject.locationName || ""}
          />
          <NumberWithLabel
            label="Max distance from location (miles)"
            name="radius"
            onChange={onChange}
            value={searchObject.radius || undefined}
          />
          <SelectWithLabel
            allowNull={true}
            label="Organization"
            name="organization"
            options={agencies}
            onChange={onChange}
            value={searchObject.organization}
          />
          <SelectWithLabel
            allowNull={true}
            label="Desired Schedule"
            name="positionScheduleType"
            options={positionScheduleType}
            onChange={onChange}
            value={searchObject.positionScheduleType}
          />
          <ToggleWithLabel
            label="Remote Only?"
            checked={searchObject.remote === true}
            onChange={onChange}
            name={"remote"}
          />
          <SelectWithLabel
            allowNull={true}
            label="How much travel?"
            name="travelPercentage"
            options={travelPercentage}
            onChange={onChange}
            value={searchObject.travelPercentage}
          />

          <SubmitButton>Submit</SubmitButton>
        </form>

      </div>
    </div>
  );
}
