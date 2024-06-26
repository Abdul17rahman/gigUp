const mongoose = require("mongoose");
const Schema = mongoose;

const availableJobs = [
  {
    title: "Software Engineer",
    description: "This is specific to backend development with nodejs",
    employer: new Schema.Types.ObjectId("667b21943f33e80e991602d4"),
    location: "Kampala-Uganda",
    created_date: Date.now().toString(),
    numOfPos: 4,
    duration: "4 days",
    status: "active",
  },
  {
    title: "Accountant",
    description: "We're looking for a proffessional ACP accountant.",
    employer: new Schema.Types.ObjectId("667b21bb3f33e80e991602d7"),
    location: "Nairobi Kenya",
    created_date: Date.now().toString(),
    numOfPos: 1,
    duration: "2 weeks",
    status: "active",
  },
  {
    title: "Sales",
    description: "Door to door sells person.",
    employer: new Schema.Types.ObjectId("667b21bb3f33e80e991602d7"),
    location: "Kampala-Uganda",
    created_date: Date.now().toString(),
    numOfPos: 5,
    duration: "6 hours",
    status: "active",
  },
  {
    title: "Driver",
    description: "Light weight vehicle driver for our CEO",
    employer: new Schema.Types.ObjectId("667b21bb3f33e80e991602d7"),
    location: "Kampala-Uganda",
    created_date: Date.now().toString(),
    numOfPos: 5,
    duration: "1 month",
    status: "active",
  },
  {
    title: "Data Engineer",
    description:
      "Preferably a data scientist who is familiar with data collection",
    employer: new Schema.Types.ObjectId("667b21943f33e80e991602d4"),
    location: "Dar Tanzania",
    created_date: Date.now().toString(),
    numOfPos: 2,
    duration: "1 week",
    status: "active",
  },
  {
    title: "Electrical Engineer",
    description: "Specific to indoor installation and cabling.",
    employer: new Schema.Types.ObjectId("667b21943f33e80e991602d4"),
    location: "Kampala-Uganda",
    created_date: Date.now().toString(),
    numOfPos: 4,
    duration: "4 days",
    status: "active",
  },
];

module.exports = availableJobs;
