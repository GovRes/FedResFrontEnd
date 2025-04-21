import { useContext, useEffect, useRef } from "react";
import { TextBlinkLoader } from "../loader/Loader";
import { AllyContext } from "@/app/providers";
import { jobDescriptionKeywordFinder } from "../aiProcessing/jobDescriptionKeywordFinder";

export default function ExtractKeywords() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const {
    job,
    loading,
    loadingText,
    setKeywords,
    setLoading,
    setLoadingText,
    setStep,
  } = context;
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchEducations() {
      if (job) {
        const keywordsRes = await jobDescriptionKeywordFinder({
          job,
          setLoading,
          setLoadingText,
        });
        setKeywords(keywordsRes);
        setStep("sort_topics");
      }
    }
    fetchEducations();
    hasFetched.current = true;
  }, [job, setLoading, setLoadingText]);
  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  return (
    <div>
      <h3>Keywords extracted!</h3>
    </div>
  );
}
