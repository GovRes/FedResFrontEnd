import { useContext, useEffect, useRef } from "react";
import { TextBlinkLoader } from "../loader/Loader";
import { AllyContext } from "@/app/providers";
import { topicsCategorizer } from "../aiProcessing/topicCategorizer";

export default function SortTopics() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const {
    job,
    keywords,
    loading,
    loadingText,
    setLoading,
    setLoadingText,
    setStep,
    setTopics,
  } = context;
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchEducations() {
      if (job) {
        const topicRes = await topicsCategorizer({
          job,
          keywords,
          setLoading,
          setLoadingText,
        });
        setTopics(topicRes);
        setStep("resume");
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
      <h3>Topics sorted!</h3>
    </div>
  );
}
