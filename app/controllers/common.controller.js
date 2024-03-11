/**
 * File Name: Common Controller
 *
 * Description: Manages all the common operations required and provide output accordingly
 *
 * Author: Skill Tech
 */

const config = require("../config/index");
const express = require("express");
const router = express.Router();
const commonService = require("../services/common.service");
const { array } = require("joi");
const {
  registerValidation,
  loginValidation,
  subscriberRegisterValidation,
} = require("../validations/user.validation");
const msg = require("../helpers/messages.json");
const multer = require("multer");

//Review Files Upload
var storageCertificate = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("testingn");
    cb(null, config.uploadDir + "/certificate/");
  },

  filename: function (req, file, cb) {
    let extArray = file.mimetype.split("/");
    let extension = extArray[extArray.length - 1];
    let newName =
      "IMG-" +
      Math.floor(Math.random() * 1000000) +
      "-" +
      Date.now() +
      "." +
      extension;
    console.log("newName", newName);
    req.body.file = newName;
    cb(null, newName);
  },
});

const fileFilterCertificate = function (req, file, cb) {
  console.log("file", file);
  // Accept images only
  //if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
  //req.fileValidationError = 'Only image files are allowed!';
  //return cb(new Error('Only image files are allowed!'), false);
  //}
  cb(null, true);
};

var uploadCertificate = multer({
  storage: storageCertificate,
  onFileUploadStart: function (file) {
    console.log(file.originalname + " is starting ...");
  },
  onFileUploadData: function (file, data) {
    console.log(data.length + " of " + file.fieldname + " arrived");
  },
  onFileUploadComplete: function (file) {
    console.log(file.fieldname + " uploaded to  " + file.path);
  },
  //fileFilter: fileFilterCertificate,
  limits: { fileSize: 1024 * 1024 * 5 },
}).fields([
  { name: "certificate", maxCount: 1 },
  { name: "bank_proof", maxCount: 1 },
]);

router.post("/signup", registerValidation, register);
router.post("/signin", authenticate);
router.post("/subscription", subscription);
router.post("/ambassador-subscription", ambassadorSubscription); 
router.post("/complete-registration", completeRegisteration);
router.post("/generate-signature", generateSignature);
router.post("/save-subscription", saveMembershipSubscription);
router.get("/get-referral-code", getReferralCode); 
router.post("/fetch-ambassador-code", fetchAmbassadorCode);
router.get("/check-referral-code/:code", checkReferralCode);
router.get("/get-my-courses/:id", getMyCourses);
router.get("/get-user-courses/:id", getUserCourses);
router.post("/save-query", saveQuery);
router.put("/cancel-course/:id", cancelCourseByUser);  
router.get("/send-email-ambassador/:id", sendEmailToAmbassador); 
router.post("/notify", payFastNotify);
router.get("/getSubscriptionId",getSubscriptionId);

module.exports = router;

/**
 * Function registers the user
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function register(req, res, next) {
  commonService
    .create(req.body)
    .then((user) =>
      user
        ? res.status(201).json({
            status: true,
            message: msg.user.signup.success,
            data: user,
          })
        : res
            .status(400)
            .json({ status: false, message: "User already Exist!" })
    )
    .catch((err) =>
      next(res.status(400).json({ status: false, message: err }))
    );
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function authenticate the user
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */

function authenticate(req, res, next) {
  console.log("authenticate");
  commonService
    .authenticate(req.body)
    .then((user) =>
      user
        ? console.log(user) || (user && user.is_active == true)
          ? res.json({
              status: true,
              message: msg.user.login.success,
              data: user,
            })
          : res
              .status(400)
              .json({ status: false, message: msg.user.login.active })
        : res.status(400).json({ status: false, message: msg.user.login.error })
    )
    .catch((err) => next(err));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function used for subscription purpose
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */

function subscription(req, res, next) {
  commonService
    .subscription(req.body)
    .then((user) =>
      user
        ? res.status(201).json({
            status: true,
            message: msg.user.signup.success,
            data: user,
          })
        : res
            .status(400)
            .json({ status: false, message: msg.user.signup.error })
    )
    .catch((err) =>
      next(res.status(400).json({ status: false, message: err }))
    );
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function saves paid subscription for high vista
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null 
 */
function saveMembershipSubscription(req, res, next) {
  commonService
    .saveMembershipSubscription(req.body)
    .then((subscriber) =>
      subscriber
        ? res.status(200).json({ status: true, data: subscriber })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )

    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function generates the referral code for ambassador
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function getReferralCode(req, res, next) {
  commonService
    .getReferralCode(req.body)
    .then((referralcode) =>
      referralcode
        ? res.status(200).json({ status: true, data: referralcode })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
function checkReferralCode(req, res, next) {
  commonService
    .checkReferralCode(req)
    .then((data) =>
      data
        ? res.status(200).json({ status: true, data: data })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/**
 * Function to get the user courses
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function getMyCourses(req, res, next) {
  commonService
    .getMyCourses(req.params)
    .then((courses) =>
      courses
        ? res.status(200).json({ status: true, data: courses })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to get all the user courses
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function getUserCourses(req, res, next) {
  commonService
    .getUserCourses(req.params)
    .then((courses) =>
      courses
        ? res.status(200).json({ status: true, data: courses })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Function to get the referral code for ambassador
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function fetchAmbassadorCode(req, res, next) {
  commonService
    .fetchAmbassadorCode(req.body)
    .then((referralcode) =>
      referralcode
        ? res.status(200).json({ status: true, data: referralcode })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function used for subscription purpose for ambassador
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */

function ambassadorSubscription(req, res, next) {
  commonService
    .ambassador_subscription(req.body)
    .then((user) =>
      user
        ? console.log(user) || (user && user.is_active == true)
          ? res.json({
              status: true,
              message: msg.user.ambessador.success,
              data: user,
            })
          : res
              .status(400)
              .json({ status: false, message: msg.user.ambessador.success })
        : res
            .status(400)
            .json({ status: false, message: msg.user.ambessador.error })
    )
    .catch((err) => next(err));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function used to check if registration is complete
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */

function completeRegisteration(req, res, next) {
  commonService
    .completeRegisteration(req.body)
    .then((user) =>
      user
        ? console.log(user) || (user && user.is_active == true)
          ? res.json({
              status: true,
              message: msg.user.ambessador.success,
              data: user,
            })
          : res
              .status(400)
              .json({ status: false, message: msg.user.ambessador.success })
        : res
            .status(400)
            .json({ status: false, message: msg.user.ambessador.error })
    )
    .catch((err) => next(err));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function used to check if registration is complete
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function generateSignature(req, res, next) {
  //commonService.generateSignature(req.body)
  //    .then(user => user ? (console.log(user) || user && user.is_active == true ? res.json({ status: true, message: msg.user.ambessador.success, data: user })  : res.status(400).json({ status: false, message: msg.user.ambessador.success })) : res.status(400).json({ status: false, message: msg.user.ambessador.error }))
  //    .catch(err => next(err));
  commonService
    .generateSignature(req.body)
    .then((user) =>
      user
        ? res.status(200).json({ status: true, data: user })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to save query for user
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */

function saveQuery(req, res, next) {
  commonService
    .saveQuery(req.body)
    .then((data) =>
      data
        ? res.status(201).json({ status: true, data: data })
        : res.status(400).json({ status: false, message: "" })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to remove the user courses
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function cancelCourseByUser(req, res, next) {
  commonService
    .cancelCourseByUser(req)
    .then((removedCourse) =>
      removedCourse
        ? res.status(200).json({ status: true, data: removedCourse })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to send email to ambassador
*
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function sendEmailToAmbassador(req, res, next) {
  commonService
    .sendEmailToAmbassador(req)
    .then((removedCourse) =>
      removedCourse
        ? res.status(200).json({ status: true, data: removedCourse })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
  }

/**
 * Function to get response from payfast notify url
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function payFastNotify(req, res, next) {
  console.log("Notify URL is running in controller.");
  commonService
    .payFastNotify(req)
    .then((payFastResponse) =>
      payFastResponse
        ? res.status(200).json({ status: true, data: payFastResponse })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to get subscription Id
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function getSubscriptionId(req, res, next) {
  commonService
    .getSubscriptionId()
    .then((response) =>
      response
        ? res.status(200).json({ status: true, data: response })
        : res
            .status(400)
            .json({ status: false, message: msg.common.no_data_err, data: [] })
    )
    .catch((err) => next(res.json({ status: false, message: err })));  
}
