import styles from "../../ally.module.css";
import {
  SubmitButton,
  GenericFieldWithLabel,
  ToggleWithLabel,
} from "../../../components/forms/Inputs";
import { useState } from "react";
import {
  agencies,
  positionScheduleType,
  travelPercentage,
} from "@/lib/utils/usaJobsCodes";
import {
  JobSearchObject,
  jobSearchZodSchema,
} from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";

import { delayAllyChat } from "@/lib/utils/allyChat";
import { usaJobsSearch } from "@/lib/utils/usaJobsSearch";
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
    if (results.length > 0) {
      setIsLoading(true);
      router.push("/ally/job-search/results");
    } else {
      setIsLoading(true);
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
        <form
          onSubmit={(e) => {
            console.log("Form onSubmit triggered directly!");
            handleSubmit(onSubmit, onError)(e);
          }}
        >
          <GenericFieldWithLabel
            errors={errors}
            label="Keywords (separate multiple keywords with a semicolon)"
            name="keyword"
            register={register}
            schema={jobSearchZodSchema}
          />
          <GenericFieldWithLabel
            errors={errors}
            label="Position Title"
            name="positionTitle"
            register={register}
            schema={jobSearchZodSchema}
          />
          <GenericFieldWithLabel
            errors={errors}
            label="Location"
            name="locationName"
            register={register}
            schema={jobSearchZodSchema}
          />
          <GenericFieldWithLabel
            errors={errors}
            label="Max distance from location (miles)"
            name="radius"
            register={register}
            schema={jobSearchZodSchema}
            type="number"
          />
          <GenericFieldWithLabel
            allowNull={true}
            errors={errors}
            label="Organization"
            name="organization"
            options={agencies}
            register={register}
            schema={jobSearchZodSchema}
          />
          <GenericFieldWithLabel
            allowNull={true}
            errors={errors}
            label="Desired Schedule"
            name="positionScheduleType"
            options={positionScheduleType}
            register={register}
            schema={jobSearchZodSchema}
          />
          <ToggleWithLabel
            errors={errors}
            label="Remote Only?"
            name="remote"
            register={register}
            schema={jobSearchZodSchema}
          />
          <GenericFieldWithLabel
            errors={errors}
            allowNull={true}
            label="How much travel?"
            name="travelPercentage"
            options={travelPercentage}
            register={register}
            schema={jobSearchZodSchema}
          />
          <SubmitButton>Submit</SubmitButton>
        </form>
      </div>
    </div>
  );
}
