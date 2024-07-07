const express = require("express");
const JobsController = require("../controllers/jobs.controller");
const EmployerController = require("../controllers/employer.controller");
const UserController = require("../controllers/user.controller");
const GenericControllers = require("../controllers/generic.controller");

const router = express.Router();

router.get("/home", GenericControllers.home);
router.get("/jobs", JobsController.allJobs);
router.get("/jobs/:id", JobsController.getJob);
router.get("/jobs/:jobId/apply/", JobsController.applyJobForm);
router.get("/register", UserController.register);
router.get("/users/login", UserController.login);
router.get("/user/:id", UserController.getUser);
router.get("/verifyEmail/:emailId/:token/user", UserController.verifyUser);
router.get("/user/:id/proposals", UserController.userProposal);
router.get("/user/:id/contracts", UserController.contracts);
router.get("/employers/register", EmployerController.register);
router.get("/employers/login", EmployerController.login);
router.get("/employers/:id", EmployerController.getEmployer);
router.get("/employers/:id/jobs/new", EmployerController.addJob);
router.get(
  "/verifyEmail/:emailId/:token/employer",
  EmployerController.verifyEmployer
);
router.get("/employers/:id/proposals", EmployerController.empProposals);
router.get("/employers/:id/contracts", EmployerController.displayContracts);
router.post("/logout", GenericControllers.logout);
router.post("/jobs/:jobId/apply", JobsController.applyJob);
router.post("/register", UserController.addUser);
router.post("/users/login", UserController.loginUser);
router.post("/user/:id/review/:empId/job/", UserController.addReview);
router.post("/employers", EmployerController.addEmployer);
router.post("/employers/:id/jobs", EmployerController.postJob);
router.post("/employers/login", EmployerController.loginEmployer);
router.post(
  "/employers/:id/proposal/:pId/accept",
  EmployerController.acceptProposal
);
router.post("/employers/:empId/review/:id/job/", EmployerController.addReview);
router.put("/user/:id", UserController.editUser);
router.put("/employers/:id/jobs/:jobId", EmployerController.editJob);
router.put(
  "/employers/:id/proposal/:pId/reject",
  EmployerController.rejectProposal
);
router.put(
  "/employers/:id/contracts/:cId/complete",
  EmployerController.completeContract
);
router.delete("/user/:id", UserController.delUser);
router.delete("/user/:id/proposals/:pId", UserController.delProposal);
router.delete("/employers/:id/jobs/:jobId", EmployerController.delJob);
router.delete("/employers/:id", EmployerController.delEmployer);

module.exports = router;
