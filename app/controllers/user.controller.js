const config = require('../config/index');
const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const { array } = require('joi');
const { registerValidation } = require('../validations/user.validation');
const msg = require('../helpers/messages.json');

const multer = require('multer');

router.post('/signup', registerValidation, register);
router.put('/update-profile-details/:id', updateProfileDetails);
router.put('/update-ambassador-profile-details/:id', updateAmbassadorProfileDetails);
router.get('/get-profile-details/:id', getProfileDetails);
router.get('/check-southafrican-id/:id', checkSouthAfricanId);
router.post('/save-moodle-id/:id', saveMoodleLoginId);
router.post('/save-cart-item/:id', saveCartItem);
router.get('/get-cart-item/:id', getCartItem);


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
    userService.create(req.body)
    .then(user => user ? res.status(201).json({ status: true, message: msg.user.signup.success, data: user }) : res.status(400).json({ status: false, message: msg.user.signup.error }))
    .catch(err => next(res.status(400).json({ status: false, message: err })));
}

/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Function update profile details the Subscriber
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function updateProfileDetails(req, res, next) {
    userService.updateProfileDetails(req.params, req.body)
    .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Function update profile details the Ambassador
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function updateAmbassadorProfileDetails(req, res, next) {
    userService.updateAmbassadorProfileDetails(req.params, req.body)
    .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function get profile details the user
 *
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function getProfileDetails(req, res, next) {
    userService.getProfileDetails(req.params)
    .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to check South African ID
 *
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function checkSouthAfricanId(req, res, next) {
    userService.checkSouthAfricanId(req)
    .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to check South African ID
 *
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function saveMoodleLoginId(req, res, next) {
    userService.saveMoodleLoginId(req)
    .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to save cart items
 *
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function saveCartItem(req, res, next) {
    userService.saveCartItem(req)
    .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to get cart items
 *
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function getCartItem(req, res, next) {
    userService.getCartItem(req)
    .then(data => data ? res.status(200).json({ status: true, data: data }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}

/*****************************************************************************************/
/*****************************************************************************************/

