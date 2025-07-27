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
} from "@/app/utils/usaJobsCodes";
import {
  JobSearchObject,
  jobSearchZodSchema,
} from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";

import { delayAllyChat } from "@/app/utils/allyChat";
import { usaJobsSearch } from "@/app/utils/usaJobsSearch";
import { useRouter } from "next/navigation";
import { useSmartForm } from "@/lib/hooks/useFormDataCleaner";
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

  // Debug logging
  console.log("Form errors:", errors);
  console.log("Form is valid:", isValid);

  const onSubmit = async (data: JobSearchObject): Promise<void> => {
    console.log("onSubmit triggered!"); // Debug log
    window.scrollTo(0, 0);
    setLoading(true);

    // Update the searchObject with the final form data
    setSearchObject({
      ...searchObject,
      ...data,
    });

    console.log("Form data:", data);
    let results = await usaJobsSearch(searchObject);

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
    console.log("onError triggered!"); // Debug log
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
          <button
            type="submit"
            onClick={(e) => {
              console.log("Button clicked!");
              console.log("Event:", e);
            }}
          >
            Submit
          </button>
          {/* <SubmitButton>Submit</SubmitButton> */}
        </form>
      </div>
    </div>
  );
}
