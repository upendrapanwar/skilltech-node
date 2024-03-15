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
router.post("/cancel-payfast-payment", cancelPayfastPayment);  
router.get("/send-email-ambassador/:id", sendEmailToAmbassador); 
router.post("/notify/:id", payFastNotify);
router.get("/getSubscriptionId",getSubscriptionId);

router.post('/defaulted-subscription-paymentof-subscriber', getAllDefaultedSubscriptionPaymentOfSubscribers);
router.post('/my-active-referral', getAllActiveReferral);
router.post('/my-inactive-referral', getAllInactiveReferral);
router.post('/payment-due-this-month', getAllPaymentDueThisMonth);
router.post('/defaulted-subscription-paymentof-subscriber/:start_date/:end_date', getDefaultedSubscriptionPaymentOfSubscribers);
router.post('/my-active-referral/:start_date/:end_date', getActiveReferral);
router.post('/my-inactive-referral/:start_date/:end_date', getInactiveReferral);
router.post('/payment-due-this-month/:start_date/:end_date', getPaymentDueThisMonth);

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
 * Function to cancel payfast payment
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @return JSON|null
 */
function cancelPayfastPayment(req, res, next) {
  commonService
    .cancelPayfastPayment(req)
    .then((data) =>
    data
        ? res.status(200).json({ status: true, data: data })
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
    .payFastNotify(req.body, req.params)
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

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get all data of defauled payment of subscriber
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
function getAllDefaultedSubscriptionPaymentOfSubscribers(req, res, next) {
  commonService.getDefaultedSubscriptionPaymentOfSubscribers(req)
      .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
      .catch(err => next(res.json({ status: false, message: err })))
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get data of defauled payment of subscriber by date
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
function getDefaultedSubscriptionPaymentOfSubscribers(req, res, next) {
  commonService.getDefaultedSubscriptionPaymentOfSubscribers(req)
      .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
      .catch(err => next(res.json({ status: false, message: err })))
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get all active referral of ambassador
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
function getAllActiveReferral(req, res, next) {
  commonService.getActiveReferral(req)
      .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
      .catch(err => next(res.json({ status: false, message: err })))
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get active referral of ambassador by date
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
function getActiveReferral(req, res, next) {
  commonService.getActiveReferral(req)
      .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
      .catch(err => next(res.json({ status: false, message: err })))
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get all inactive referral of ambassador
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
function getAllInactiveReferral(req, res, next) {
  commonService.getInactiveReferral(req)
      .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
      .catch(err => next(res.json({ status: false, message: err })))
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get inactive referral of ambassador by date
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
function getInactiveReferral(req, res, next) {
  commonService.getInactiveReferral(req)
      .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
      .catch(err => next(res.json({ status: false, message: err })))
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get all payment due to ambassador
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
function getAllPaymentDueThisMonth(req, res, next) {
  commonService.getPaymentDueThisMonth(req)
      .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
      .catch(err => next(res.json({ status: false, message: err })))
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get payment due to ambassador by date
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
function getPaymentDueThisMonth(req, res, next) {
  commonService.getPaymentDueThisMonth(req)
      .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
      .catch(err => next(res.json({ status: false, message: err })))
}
