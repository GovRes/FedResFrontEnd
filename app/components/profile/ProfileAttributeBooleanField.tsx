import { useEffect, useState } from "react";

import { GrCheckmark, GrClose, GrEdit } from "react-icons/gr";
import styles from './profileStyles.module.css';
import {handleUpdateUserAttribute} from '@/app/utils/userAttributeInterface';

export default function ProfileAttributeBooleanField({
    attributeKey, 
    title, 
    value, 
    setAttributes 
}: 
    { 
        attributeKey:string, 
        title: string, 
        value: boolean | string,
        setAttributes: Function
    }) {
    const stringToBool = (value === 'true');
    const [showEdit, setShowEdit] = useState(false);
    const [checked, setChecked] = useState(stringToBool);
    useEffect(() => {
        setChecked(value === 'true');
      }, [value]);
    async function submit(e: { preventDefault: () => void; target: any; }) {
        e.preventDefault();
        const response = await handleUpdateUserAttribute(attributeKey, checked.toString());
        console.log(response)
        if (response === "200") {
            setAttributes((prev: any) => ({...prev, [attributeKey]: checked.toString()}));
            setShowEdit(false);
        } else {
           return response;
        }
    }

    function onChange() {
        setChecked(!checked);
    }
    
    return (
        <div className={styles.editableContainer}>
            <span className={styles.attributeTitle}>{title}: {" "} </span>
            {
                showEdit ? 
                    <form className={styles.form} onSubmit={submit}>
                        <span className={styles.attributeToggle}>                         
                                <div className={`${styles.button} ${styles.r}`} id="button-1">
                                    <input type="checkbox" 
                                        className={styles.checkbox} 
                                        checked={checked}
                                        onChange={onChange}
                                    />
                                    <div className={styles.knobs}></div>
                                    <div className={styles.layer}></div>
                                </div>
                    </span>
                        <button type="submit" className={`${styles.icon} ${styles.submitButton}`}>
                            <GrCheckmark /> 
                        </button>
                        <button className={`${styles.icon} ${styles.cancelButton}`}  onClick={() => setShowEdit(false)}>
                            <GrClose />
                        </button>
                        </form>
                    : 
                    <span>{value}<span onClick={() => setShowEdit(true)} className={styles.icon}><GrEdit /></span></span>
            }
        </div>
    )
}