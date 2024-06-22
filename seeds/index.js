const Job = require("../models/jobs.model");
const availableJobs = require("./data");
const connectDb = require("../utils/db");

connectDb("gigUp");

const createSeed = async () => {
  await Job.deleteMany({});
  availableJobs.forEach(async (job) => {
    const jb = Job(job);
    await jb.save();
  });
  console.log("Database seeded");
};

createSeed();
