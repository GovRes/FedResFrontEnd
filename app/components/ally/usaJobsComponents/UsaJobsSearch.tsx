import styles from "../ally.module.css";
import BaseForm from "../../forms/BaseForm";
import {
  SubmitButton,
  SelectWithLabel,
  TextWithLabel,
  NumberWithLabel,
  CheckboxWithLabel,
  ToggleWithLabel,
} from "../../forms/Inputs";
import { FormEvent, useState } from "react";
import {
  agencies,
  positionScheduleType,
  travelPercentage,
} from "@/app/utils/usaJobsCodes";
import { TextBlinkLoader } from "@/app/components/loader/Loader";

import { delayAllyChat } from "@/app/utils/allyChat";
import { usaJobsSearch } from "@/app/utils/usaJobsSearch";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { UserType } from "@/app/utils/userAttributeInterface";

export interface JobSearchObject {
  keyword?: string;
  locationName?: string;
  radius?: string;
  organization?: keyof typeof agencies;
  positionTitle?: string;
  positionScheduleType?: string;
  remote?: boolean;
  travelPercentage?: string;
  user: UserType;
}

export default function UsaJobsSearch({
  searchObject,
  setSearchObject,
  setSearchResults,
  setShowSearchForm,
}: {
  searchObject: JobSearchObject;
  setSearchObject: Function;
  setSearchResults: Function;
  setShowSearchForm: Function;
}) {
  const [loading, setLoading] = useState(false);

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;
    console.log({ name, value, type, checked });
    const newValue = type === "checkbox" ? checked : value;
    setSearchObject({
      ...searchObject,
      [name]: newValue,
    });
  };

  async function search() {
    setLoading(true);

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

  async function onSubmitUsaJobsSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.scrollTo(0, 0);
    let results = await search();

    setShowSearchForm(false);
    setSearchResults(results);
  }

  let allyStatements = [
    "Let's search for the job you want. Put in as much or as little information as you wish.",
  ];

  let { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  if (loading) {
    return <TextBlinkLoader text="Searching USA jobs..." />;
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
          />
          <TextWithLabel
            label="Position Title"
            name="positionTitle"
            onChange={onChange}
          />
          <TextWithLabel
            label="Location"
            name="locationName"
            onChange={onChange}
          />
          <NumberWithLabel
            label="Max distance from location (miles)"
            name="radius"
            onChange={onChange}
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
          <SubmitButton type="submit">Submit</SubmitButton>
        </BaseForm>
      </div>
    </div>
  );
}
