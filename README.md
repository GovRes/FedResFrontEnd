The steps of the AI process currently are:
1) User pastes resume (component: Resume)
2) User pastes job description from USAJobs.Gov (component: UsaJobs)
3) The job description goes to the jobDescriptionReviewer, which calls the prompt "jobDescriptionReviewerPrompt" to extract key phrases from the job description.
4) Next up, the process hands off to the qualifications reviewer, which receives the job description, key phrases, and resume, and calls the "qualificationsReviewerPrompt" to return met and unmet qualifications.
5) It passes the job description, key phrases, resume, met qualifications, and unmet qualifications to the "advancedQualificationsReviewerPrompt", which "checks the work" of the qualificationsReviewerPrompt and returns met and unmet qualifications, and a recommendation about whether the user should or should not apply for this job.
6) The CareerCoach component asks the user to review met and unmet qualifications, and adjust these lists.
7) The qualificationsRecommender passes the job description, key words, resume, and updated met and unmet qualifications back to the qualificationsRecommenderPrompt prompt to check in one more time about whether it recommends that the user apply for the job.
8) The topic categorizer takes the key phrases and organizes them into topics.
8) The Career Coach (component: EditMetQualifications) offers the user their qualifications one at a time, and works with the user to write a description of what in their past experience meets this qualification.