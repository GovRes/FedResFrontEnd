import { FormEvent, useEffect, useState } from "react";
import styles from "./ally.module.css";
import { Qualification } from "./AllyContainer";
import CareerCoachStep0 from "./careerCoachSteps/CareerCoachStep0";
import CareerCoachStep1 from "./careerCoachSteps/CareerCoachStep1";
import CareerCoachStep2 from "./careerCoachSteps/CareerCoachStep2";
import CareerCoachStep3 from "./careerCoachSteps/CareerCoachStep3";
import BaseForm from "../forms/BaseForm";
import { TextArea, SubmitButton } from "../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WEB_SOCKET_URL, TEST_WEB_SOCKET_URL } from "@/app/constants";
const socketUrl = TEST_WEB_SOCKET_URL;
export default function CareerCoach({
  email,
  qualifications,
  step,
  setStep,
}: {
  email?: string;
  qualifications: {
    unmetQualifications: Qualification[];
    metQualifications: Qualification[];
  };
  step: number;
  setStep: (step: number) => void;
}) {
  interface QualifcationFeedback {
    qualification: Qualification | null;
    feedback: string;
  }
  const [metQualifications, setMetQualifications] = useState(
    qualifications.metQualifications
  );

  const [qualificationFeedback, setQualificationFeedback] =
    useState<QualifcationFeedback>({
      qualification: null,
      feedback: "",
    });
  const [unmetQualifications, setUnmetQualifications] = useState(
    qualifications.unmetQualifications
  );
  const [careerCoachStep, setCareerCoachStep] = useState(0);
  let allyStatements = [
    "I've reviewed your resume and job description. Here are some of the qualifications you meet.",
  ];

  const { readyState, sendJsonMessage, lastJsonMessage, lastMessage } =
    useWebSocket(socketUrl, { share: true });
  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      console.log("sending message");
      sendJsonMessage({ email, step, qualificationFeedback });
      console.log("last message received", lastMessage);
    }
  }, [
    readyState,
    qualificationFeedback.qualification,
    qualificationFeedback.feedback,
  ]);
  useEffect(() => {
    if (careerCoachStep > 3) {
      setStep(4);
    }
  }, [careerCoachStep, setStep]);
  switch (careerCoachStep) {
    case 0:
      return (
        <div>
          <CareerCoachStep0
            metQualifications={metQualifications}
            unmetQualifications={unmetQualifications}
            setCareerCoachStep={setCareerCoachStep}
            setMetQualifications={setMetQualifications}
            setUnmetQualifications={setUnmetQualifications}
          />
        </div>
      );
    case 1:
      return (
        <div>
          <CareerCoachStep1
            metQualifications={metQualifications}
            unmetQualifications={unmetQualifications}
            setCareerCoachStep={setCareerCoachStep}
            setMetQualifications={setMetQualifications}
            setUnmetQualifications={setUnmetQualifications}
          />
        </div>
      );
    case 2:
      return (
        <div>
          <CareerCoachStep2
            metQualifications={metQualifications}
            setCareerCoachStep={setCareerCoachStep}
            setQualificationFeedback={setQualificationFeedback}
          />
        </div>
      );
    case 3:
      return (
        <div>
          <CareerCoachStep3
            metQualifications={metQualifications}
            setCareerCoachStep={setCareerCoachStep}
            setQualificationFeedback={setQualificationFeedback}
          />
        </div>
      );
    default:
      return <div>Nothing to see here</div>;
  }
}
