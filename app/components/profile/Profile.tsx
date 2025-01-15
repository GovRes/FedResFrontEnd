import { useState } from "react";
import ProfileAttributes from "./ProfileAttributes";
import styles from './profileStyles.module.css'
import ResumeDashboard from "./ResumeDashboard";
export default function Profile(){
    const [checked, setChecked] = useState("profile");
    function onChange(e: { target: { id: any; }; }) {
        setChecked(e.target.id)
    }
    return(
        <div className={styles.profileContainer}>
            <div className={styles.tabs}>
                <input type="radio" name="tabs" id="profile" checked={checked==="profile"} onChange={onChange}/>
                <label htmlFor="profile">Profile</label>
                <div className={styles.tab}>
                    <ProfileAttributes />
                </div>
                <input type="radio" name="tabs" id="resumes" checked={checked==="resumes"} onChange={onChange} />
                <label htmlFor="resumes">Resumes</label>
                <div className={styles.tab}>
                    <ResumeDashboard />
                </div>
                <input type="radio" name="tabs" id="applications" checked={checked==="applications"} onChange={onChange} />
                <label htmlFor="applications">Applications</label>
                <div className={styles.tab}>
                    <div>Application tracker goes here</div>
                </div>
            </div>          
        </div>
    )
}
