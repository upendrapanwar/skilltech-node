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

router.post('/signup', registerValidation, register);
router.post('/signin', loginValidation, authenticate);
router.post('/subscription', subscription);


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
