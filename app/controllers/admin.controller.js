const config = require('../config/index');
const express = require('express');
const router = express.Router();
const adminService = require('../services/admin.service');
const { array } = require('joi');
const { registerValidation } = require('../validations/user.validation');
const msg = require('../helpers/messages.json');

const multer = require('multer');

router.get('/agent-subscription', agentSubscription);
router.get('/agent-subscription-by-id/:id', agentSubscriptionById);

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
/*function register(req, res, next) {
    userService.create(req.body)
    .then(user => user ? res.status(201).json({ status: true, message: msg.user.signup.success, data: user }) : res.status(400).json({ status: false, message: msg.user.signup.error }))
    .catch(err => next(res.status(400).json({ status: false, message: err })));
}*/

/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Function to get all the user subscription
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function agentSubscription(req, res, next) {
    adminService.agentSubscription(req.params)
    .then(subscription => subscription ? res.status(200).json({ status: true, data: subscription }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Function to get agent subscription by id
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function agentSubscriptionById(req, res, next) {
    adminService.agentSubscription(req.params)
    .then(subscription => subscription ? res.status(200).json({ status: true, data: subscription }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
    .catch(err => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/