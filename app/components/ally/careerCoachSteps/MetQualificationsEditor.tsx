import styles from "@/app/components/ally/ally.module.css";
import { QualificationsSchema, QualificationsType, QualificationType } from "@/app/utils/responseSchemas";
import BaseForm from "../../forms/BaseForm";
import { SubmitButton, TextArea } from "../../forms/Inputs";
import { FormEvent, useContext, useState } from "react";
import { qualificationDescriptionEditor } from "../../aiProcessing/qualificationDescriptionEditor";
import { AllyContext, AllyContextType } from "@/app/providers";
import { sendMessages } from "@/app/utils/api";
export const MetQualificationsEditor = ({ currentQualification, currentQualificationIndex, setCurrentQualificationIndex }: {
    currentQualification: QualificationType,
    currentQualificationIndex: number,
    setCurrentQualificationIndex: Function
}) => {
    let delay = 0.3;
    const {
        jobDescription,
        keywords,
        qualifications,
        resume,
        setLoading,
        setQualifications,
    } = useContext(AllyContext) as AllyContextType;
    console.log(23, qualifications)
    const [initialInvitation, setInitialInvitation] = useState(true);
    const [updatedDescription, setUpdatedDescription] = useState("");
    function updateQualificationDescription(qualifications: QualificationsType, description: string) {
        let updatedQualifications = qualifications.metQualifications.map((qualification) => {
            if (qualification.id === currentQualification.id) {
                qualification.description = description;
            }
            return qualification;   
        });
        console.log(32, qualifications)
        const validatedQualifications = QualificationsSchema.parse(qualifications);
        setQualifications({
            ...validatedQualifications,
            metQualifications: updatedQualifications,
        });
    }
    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let userFeedback = event.currentTarget.qualificationResponse.value;
        if (userFeedback && jobDescription && keywords && resume) {

            let updatedDescriptionRes = await qualificationDescriptionEditor({ jobDescription, keywords, resume, sendMessages, setLoading, qualification: currentQualification, userFeedback })
            setUpdatedDescription(updatedDescriptionRes.updatedDescription);
            setInitialInvitation(false);
            event.currentTarget.qualificationResponse.value = "";
        } else {
            if(qualifications) {

                updateQualificationDescription(qualifications, updatedDescription);
            }
            setCurrentQualificationIndex(currentQualificationIndex + 1);
        }
    };
    console.log({initialInvitation, updatedDescription})

    return (
        <>
            {currentQualification.description ? (
                <>
                    <div
                        className={`${styles.allyChatContainer} ${styles.fade}`}
                        style={{ animationDelay: `${delay + 0.5}s` }}
                    >
                        {initialInvitation ?
                            <>
                                <p
                                    className={styles.fade}
                                    style={{ animationDelay: `${delay + 0.5}s` }}
                                >
                                    Here's the description I wrote about your qualifications in{" "}
                                    {currentQualification.name}
                                </p>
                                <p
                                    className={styles.fade}
                                    style={{ animationDelay: `${delay + 1}s` }}
                                >
                                    <i>{currentQualification.description}</i>
                                </p>
                            </>
                            : <>
                                <p
                                    className={styles.fade}
                                    style={{ animationDelay: `${delay + 0.5}s` }}
                                >
                                    Here's my updated description for your qualifications in{" "}
                                    {currentQualification.name}
                                </p>
                                <p
                                    className={styles.fade}
                                    style={{ animationDelay: `${delay + 1}s` }}
                                >
                                    <i>{updatedDescription}</i>
                                </p>
                            </>
                        }
                        <p
                            className={styles.fade}
                            style={{ animationDelay: `${delay + 1.5}s` }}
                        >
                            If that sounds good to you, click "Next" to move on.
                            Otherwise, tell me what you'd like to change about this.
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <div
                        className={`${styles.allyChatContainer} ${styles.fade}`}
                        style={{ animationDelay: `${delay + 0.5}s` }}
                    >
                        <p
                            className={styles.fade}
                            style={{ animationDelay: `${delay + 0.5}s` }}
                        >
                            Can you tell me more about your experiences with{" "}
                            {currentQualification.name}?
                        </p>
                    </div>
                </>
            )}

            <div
                className={`${styles.userChatContainer} ${styles.fade}`}
                style={{ animationDelay: `${delay + 1.6}s` }}
            >
                <BaseForm onSubmit={onSubmit}>
                    <TextArea name="qualificationResponse" />
                    <SubmitButton type="submit">Next</SubmitButton>
                </BaseForm>
            </div>
        </>
    )
}