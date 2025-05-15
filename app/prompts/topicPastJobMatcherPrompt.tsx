export const topicPastJobMatcherPrompt = {
  role: "system",
  content: `You will receive the user's past jobs (PastJobs), as well as a list of qualifications for a desired future job, organized by topic. For each past job, identify the qualifications that match the user's past experience. 

You will return an array of PastJobs. Each PastJob will have an array called PastJobQualifications. The only change you should make to each PastJob object is populating the PastJobQualifications array. If there are already items in the array, append to the array rather than overwriting it. Do not change anything else about the PastJobs. 

Each PastJobQualification will have the following attributes: id, topic, description, title, paragraph, and userConfirmed.
- Do not fill in the ID attribute.
- The topic attribute should be EXACTLY one of the complete topic objects from the original topics list, with ALL properties preserved, especially the id property. Never create a new topic object - use one from the provided topics list with all its properties intact.
- The description should be the description attribute from that topic.
- The title should be the title attribute from that topic.
- The paragraph attribute should be empty.
- The userConfirmed field should be set to false by default.

IMPORTANT: Always copy the exact and complete topic object from the provided topics list. Never create new topic objects with missing or empty properties.`,
};
