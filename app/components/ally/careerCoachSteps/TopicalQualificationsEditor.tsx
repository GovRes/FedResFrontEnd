import { FormEvent, useContext, useState } from "react";
import styles from "@/app/components/ally/ally.module.css";
import BaseForm from "@/app/components/forms/BaseForm";
import { SubmitButton, TextArea } from "@/app/components/forms/Inputs";
import {
  qualificationsEvidenceQuestionResponder,
  qualificationsEvidenceFeedbackResponder,
} from "@/app/components/aiProcessing/qualificationsEvidenceWriter";
import { AllyContext, AllyContextType } from "@/app/providers";
import { TopicType } from "@/app/utils/responseSchemas";
export const TopicalQualificationsEditor = ({
  currentTopic,
  setCurrentTopicIndex,
  setCurrentTopic,
}: {
  currentTopic?: TopicType;
  currentTopicIndex: number;
  setCurrentTopic: Function;
  setCurrentTopicIndex: Function;
}) => {
  let delay = 0.3;
  const {
    job,
    keywords,
    resumes,
    topics,
    setLoading,
    setLoadingText,
    setTopics,
  } = useContext(AllyContext) as AllyContextType;

  const [initialInvitation, setInitialInvitation] = useState(false);

  function updateTopicEvidence(topics: TopicType[], evidence: string) {
    console.log(currentTopic?.id);
    let updatedTopics = topics.map((topic) => {
      if (currentTopic && topic.id === currentTopic.id) {
        topic.evidence = evidence;
      }
      return topic;
    });
    setTopics(updatedTopics);
  }

  const onSubmitQuestionResponse = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    let userResponse = event.currentTarget.questionResponse.value;
    if (currentTopic && job && keywords && resumes && userResponse) {
      let updatedDescriptionRes = await qualificationsEvidenceQuestionResponder(
        {
          currentTopic: currentTopic,
          job,
          resumes,
          setLoading,
          setLoadingText,
          userResponse,
        }
      );
      setCurrentTopic((prev: any) =>
        prev ? { ...prev, question: updatedDescriptionRes.question } : prev
      );
      console.log(43, updatedDescriptionRes);
    }
  };
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let userResponse = event.currentTarget.qualificationResponse.value;
    if (currentTopic && userResponse && job && keywords && resumes) {
      try {
        let updatedDescriptionRes =
          await qualificationsEvidenceFeedbackResponder({
            currentTopic: currentTopic,
            job,
            resumes,
            setLoading,
            setLoadingText,
            userResponse,
          });
        console.log(51, updatedDescriptionRes);
        setCurrentTopic((prev: any) =>
          prev ? { ...prev, evidence: updatedDescriptionRes.evidence } : prev
        );
        setInitialInvitation(false);
      } catch (error) {
        console.error(error);
      }
    } else {
      if (topics && currentTopic && currentTopic.evidence) {
        console.log(currentTopic.evidence);
        updateTopicEvidence(topics, currentTopic.evidence);
      }
      setCurrentTopicIndex((prev: number) => prev + 1);
    }
  };

  if (currentTopic) {
    console.log(currentTopic);
    if (currentTopic.question && !currentTopic.evidence) {
      return (
        <div>
          <div
            className={`${styles.allyChatContainer} ${styles.fade}`}
            style={{ animationDelay: `${delay + 0.5}s` }}
          >
            {" "}
            <p
              className={styles.fade}
              style={{ animationDelay: `${delay + 0.5}s` }}
            >
              I have a question that will help me write a better description of
              your experience: <br />
            </p>
            <p>
              <em>{currentTopic.question}</em>
            </p>
          </div>
          <div
            className={`${styles.userChatContainer} ${styles.fade}`}
            style={{ animationDelay: `${delay + 1.6}s` }}
          >
            <BaseForm onSubmit={onSubmitQuestionResponse}>
              <TextArea name="questionResponse" />
              <SubmitButton type="submit">Next</SubmitButton>
            </BaseForm>
          </div>
        </div>
      );
    } else if (currentTopic.evidence) {
      return (
        <>
          {initialInvitation ? (
            <p
              className={styles.fade}
              style={{ animationDelay: `${delay + 0.5}s` }}
            >
              Here's the evidence I wrote for your qualifications in{" "}
              {currentTopic.name}
            </p>
          ) : (
            <p
              className={styles.fade}
              style={{ animationDelay: `${delay + 0.5}s` }}
            >
              Here's my updated evidence for your qualifications in{" "}
              {currentTopic.name}
            </p>
          )}
          <p
            className={styles.fade}
            style={{ animationDelay: `${delay + 1}s` }}
          >
            <i>{currentTopic.evidence}</i>
          </p>
          <p
            className={styles.fade}
            style={{ animationDelay: `${delay + 1.5}s` }}
          >
            If that sounds good to you, click "Next" to move on. Otherwise, tell
            me what you'd like to change about this.
          </p>
          <div
            className={`${styles.userChatContainer} ${styles.fade}`}
            style={{ animationDelay: `${delay + 1.6}s` }}
          >
            <BaseForm onSubmit={onSubmit}>
              <TextArea name="qualificationResponse" />
              <SubmitButton type="submit">Return Feedback</SubmitButton>
              <SubmitButton type="submit">Next</SubmitButton>
            </BaseForm>
          </div>
        </>
      );
    }
  } else {
    return <div>no current topic</div>;
  }
};
