const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    USA_JOBS_EMAIL: process.env.USA_JOBS_EMAIL,
    USA_JOBS_API_KEY: process.env.USA_JOBS_API_KEY,
    BROWSERLESS_TOKEN: process.env.BROWSERLESS_TOKEN,
  },
};

module.exports = nextConfig;
