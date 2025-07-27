import axios from "axios";
var host = "data.usajobs.gov";
var userAgent = process.env.USA_JOBS_EMAIL;
var authKey = process.env.USA_JOBS_API_KEY;
const instance = axios.create({
  baseURL: "https://data.usajobs.gov/api/",
  timeout: 100000,
  headers: {
    Host: host,
    "User-Agent": userAgent,
    "Authorization-Key": authKey,
  },
});

export async function usaJobsTextFetch({ jobId }: { jobId: string }) {
  try {
    const response = await instance.get(
      `HistoricJoa/AnnouncementText/${jobId}`,
      {}
    );
    console.log("Response from USA Jobs API:", response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
