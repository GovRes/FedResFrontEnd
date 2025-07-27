import styles from "../../ally.module.css";
import {
  SubmitButton,
  GenericFieldWithLabel,
  ToggleWithLabel,
} from "../../../components/forms/Inputs";
import { useEffect, useState } from "react";
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
  const { defaultValues, cleanData } = useSmartForm(jobSearchZodSchema);
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm({
    resolver: zodResolver(jobSearchZodSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
  });
  useEffect(() => {
    setSearchObject({
      ...searchObject,
      keyword: null,
      locationName: null,
      organization: null,
      positionTitle: null,
      positionScheduleType: null,
      radius: null,
      remote: null,
      travelPercentage: null,
    });
  }, []);
  const watchedFields = watch();
  useEffect(() => {
    if (watchedFields && Object.keys(watchedFields).length > 0) {
      setSearchObject((prev: JobSearchObject) => ({
        ...prev,
        ...watchedFields,
      }));
    }
  }, [watchedFields]);
  async function search() {
    setLoading(true);
    console.log("searchObject", searchObject);
    let res = await usaJobsSearch({
      ...searchObject,
      keyword: searchObject.keyword,
      locationName: searchObject.locationName,
      organization: searchObject.organization,
      positionTitle: searchObject.positionTitle,
      positionScheduleType: searchObject.positionScheduleType,
      radius: searchObject.radius,
      remote: searchObject.remote,
      travelPercentage: searchObject.travelPercentage,
    });
    setLoading(false);
    return res;
  }

  const onSubmit = async (data: JobSearchObject): Promise<void> => {
    window.scrollTo(0, 0);
    setLoading(true);
    let results = await search();
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
        <form onSubmit={handleSubmit(onSubmit, onError)}>
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
