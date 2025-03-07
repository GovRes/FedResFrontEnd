import styles from "../ally.module.css";
import BaseForm from "../../forms/BaseForm";
import {
  SubmitButton,
  SelectWithLabel,
  TextWithLabel,
  NumberWithLabel,
  CheckboxWithLabel,
} from "../../forms/Inputs";
import { FormEvent, useState } from "react";
import {
  agencies,
  positionScheduleType,
  travelPercentage,
} from "@/app/utils/usaJobsCodes";

import { delayAllyChat } from "@/app/utils/allyChat";
import { usaJobsSearch } from "@/app/utils/usaJobsSearch";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";

export default function UsaJobsSearch({
  searchObject,
  setSearchObject,
  setSearchResults,
  setShowSearchForm,
}: {
  searchObject: any;
  setSearchObject: Function;
  setSearchResults: Function;
  setShowSearchForm: Function;
}) {
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);

  const onChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;
    const newValue = type === "checkbox" ? checked : value;
    setSearchObject({
      ...searchObject,
      [name]: newValue,
    });
  };

  async function search() {
    if (authStatus === "authenticated" && user) {
      let attr = await fetchUserAttributes();
      console.log(attr);
      return await usaJobsSearch({
        keyword: searchObject.keyword,
        locationName: searchObject.locationName,
        organization: searchObject.organization,
        positionTitle: searchObject.positionTitle,
        positionScheduleType: searchObject.positionScheduleType,
        radius: searchObject.radius,
        remote: searchObject.remote,
        travelPercentage: searchObject.travelPercentage,
        user: attr,
      });
    }
  }

  async function onSubmitUsaJobsSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log(searchObject);
    let results = await search();
    setShowSearchForm(false);
    setSearchResults(results);
    // const jobDescription = (
    //   event.currentTarget.elements.namedItem(
    //     "job-description"
    //   ) as HTMLInputElement
    // ).value;
    // setJobDescription(jobDescription);
  }

  let allyStatements = [
    "Let's search for the job you want. Put in as much or as little information as you wish.",
  ];

  let { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
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
          <CheckboxWithLabel
            label="Remote Only?"
            name="remote"
            handleChange={onChange}
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
