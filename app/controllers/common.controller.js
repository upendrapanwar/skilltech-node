/**
 * File Name: Common Controller
 * 
 * Description: Manages all the common operations required and provide output accordingly
 * 
 * Author: Skill Tech
 */

const config = require('../config/index');
const express = require('express');
const router = express.Router();
const commonService = require('../services/common.service');
const { array } = require('joi');
const { registerValidation, loginValidation,subscriberRegisterValidation } = require('../validations/user.validation');
const msg = require('../helpers/messages.json');
const multer = require("multer");


//Review Files Upload
var storageCertificate = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('testingn');
        cb(null, config.uploadDir + '/certificate/');
    },
    
    filename: function (req, file, cb) {
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        let newName = "IMG-" + Math.floor(Math.random() * 1000000) + "-" + Date.now() + "." + extension;
        console.log('testingn1');
        console.log('newName',newName);
        req.body.file = newName; 
        cb(null, newName);
    }
});

const fileFilterCertificate = function (req, file, cb) {
    console.log('file',file);
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var uploadCertificate = multer({ storage: storageCertificate,
    onFileUploadStart: function (file) {
        console.log(file.originalname + ' is starting ...')
    },
    onFileUploadData: function (file, data) {
        console.log(data.length + ' of ' + file.fieldname + ' arrived')
    },
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
    },
    fileFilter: fileFilterCertificate , limits: { fileSize: 1024 * 1024 * 5 }, }).fields([{ name: 'certificate', maxCount: 1 }, { name: 'bank_proof', maxCount: 1 }])

router.post('/signup', registerValidation, register);
router.post('/signin', authenticate);
router.post('/subscription', subscription);
router.post('/ambassador-subscription',uploadCertificate, ambassadorSubscription);

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
    commonService.create(req.body)
    .then(user => user ? res.status(201).json({ status: true, message: msg.user.signup.success, data: user }) : res.status(400).json({ status: false, message: msg.user.signup.error }))
    .catch(err => next(res.status(400).json({ status: false, message: err })));
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
	
    commonService.authenticate(req.body)
        .then(user => user ? (console.log(user) || user && user.is_active == true ? res.json({ status: true, message: msg.user.login.success, data: user })  : res.status(400).json({ status: false, message: msg.user.login.active })) : res.status(400).json({ status: false, message: msg.user.login.error }))
        .catch(err => next(err));
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
    commonService.subscription(req.body)
        .then(user => user ? (console.log(user) || user && user.is_active == true ? res.json({ status: true, message: msg.user.login.success, data: user })  : res.status(400).json({ status: false, message: msg.user.login.active })) : res.status(400).json({ status: false, message: msg.user.login.error }))
        .catch(err => next(err));
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
    console.log("Body: ", req.body);
    console.log("certificate: ", req.certificate);
    console.log("File: ", req.file);
    console.log("Files: ", req.files);
    commonService.ambassador_subscription(req.body)
        .then(user => user ? (console.log(user) || user && user.is_active == true ? res.json({ status: true, message: msg.user.ambessador.success, data: user })  : res.status(400).json({ status: false, message: msg.user.ambessador.success })) : res.status(400).json({ status: false, message: msg.user.ambessador.error }))
        .catch(err => next(err));
}
/*****************************************************************************************/
/*****************************************************************************************/
