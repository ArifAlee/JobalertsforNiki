const nodemailer = require("nodemailer");
const fs = require("fs");
const fetch = require("node-fetch"); //install: npm install node-fetch@2, if error finding module

// API ENDPOINTS AND HEADERS
const url = "https://api.theirstack.com/v1/jobs/search";
const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization:
    "Bearer <token>", // Replace <token> with your token
};

// Load the payload for API request
const payload = JSON.parse(fs.readFileSync("payload.json", "utf-8"));

// File to track previously fetched job IDs
const previousJobsFile = "previous_jobs.json";

//function to read previous jobs
const getPreviousJobs = () => {
  if (fs.existsSync(previousJobsFile)) {
    return JSON.parse(fs.readFileSync(previousJobsFile, "utf-8"));
  }
  return [];
};

// function to save current jobs, writes in previousJobsFile
const saveCurrentJobs = (jobs) => {
  fs.writeFileSync(previousJobsFile, JSON.stringify(jobs, null, 2));
};

// Fetch jobs from the API
const fetchJobs = async () => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("API Response:", data); // for debugging api response

    if (data.data && Array.isArray(data.data)) {
      const previousJobs = getPreviousJobs();
      const newJobs = data.data.filter((job) => !previousJobs.includes(job.id));

      if (newJobs.length > 0) {
        console.log(`${newJobs.length} new job(s) found.`);
        sendEmail(newJobs); //email gets sent if job(s) found
        saveCurrentJobs(data.data.map((job) => job.id)); // Update the job list by id which will save it in previousJobsFile
      } else {
        noNewJobs(); // sends email that no new job has been found
        console.log("No new jobs found.");
      }
    } else {
      console.error("Unexpected API response format:", data);
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
  }
};

//function if no job found then to send email saying no new jobs
const noNewJobs = () => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "<your email>", //email account 
      pass: "<your app pass>", //enabling 'app password' for gmail works the best
    },
  });

//NO NEW JOBS EMAIL SENT TO ME COS NIKI WILL FIND IT ANNOYING
  const mailOptions = {
    from: "<your email>", //email should match auth user
    to: "<recipient email>",
    subject: "No new jobs",
    text: `Hi Niki,\n\nNo new jobs matching your skills found this week.\n\nKind regards,\n\nJobalertsforNiki Bot`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

// Send an email notification when there is a new job posted
const sendEmail = (jobs) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "<your email>", //your email
      pass: "<your app pass>", //use 'app password' for gmail
    },
  });

  //showing job title, company and salary, for each job
  const jobDescriptions = jobs
    .map((job) => `• ${job.job_title} at ${job.company} - ${job.salary_string}`)
    .join("\n");

  const mailOptions = {
    from: "<your email>", //email should match auth user
    to: "<recipient email>",
    subject: "New Job Alert!",
    text: `Hi Niki,\n\nHere are the latest jobs posted:\n\n${jobDescriptions}\n\nKind regards,\nJobalertsforNiki Bot`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

fetchJobs();

// Run the job fetch function, set an interval to run once a day
// const INTERVAL = 24 * 60 * 60 * 1000; // 24hr interval

// // Function to repeatedly fetch jobs every 24hrs
// const startJobCheck = () => {
//   console.log("Starting job checker...");
//   fetchJobs(); // Run once immediately
//   setInterval(() => {
//     console.log("Checking for new jobs...");
//     fetchJobs();
//   }, INTERVAL);
// };
// startJobCheck();
