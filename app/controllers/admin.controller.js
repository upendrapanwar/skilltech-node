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
router.get('/get-active-agents', getActiveAgents);
router.get('/get-agents-byid/:id', getAgentById);
router.delete('/delete-agent/:id', deleteAgentById);

router.get('/active-subscribed-ambassador', reportActiveSubcribedAmbassadors);

// TEST 1st
router.get('/active-subscribed-ambassador/:start_date/:end_date', getAllActiveSubcribedAmbassadors);

// router.get('/all-active-subscribed-ambassador', reportAllActiveSubcribedAmbassadors);


router.get('/active-subscribed-subscriber', reportActiveSubcribedSubscribers);


// TEST 2nd Active Subscription of Subscriber
router.get('/active-subscribed-subscriber/:start_date/:end_date', getAllActiveSubscriptionSubscriber);
// router.get('/all-active-subscribed-subscriber', reportAllActiveSubcribedSubscribers);

/***********START */

// TEST 3rd Defaulted Subscriptions Payments of Ambassador
router.get('/defaulted-subscription-paymentofambassador/:start_date/:end_date', getAllDefaultedSubscriptionPaymentOfAmbassador);

// TEST 4th Defaulted Subscriptions Payments of Subscriber
router.get('/defaulted-subscription-paymentofsubscriber/:start_date/:end_date', getAllDefaultedSubscriptionPaymentOfSubscribers);

//TEST 5th Subscription-cancelledby-ambassador
router.get('/subscription-cancelledby-ambassador/:start_date/:end_date', getSubscriptionCancelledByAmbassador);


//TEST 6th Subscription-cancelledby-subscriber
router.get('/subscription-cancelledby-subscriber/:start_date/:end_date', getSubscriptionCancelledBySubscriber);


router.get('/active-inactive-referral-per-ambassador/:start_date/:end_date', getAllActiveAndInactiveReferralPerAmbassador);
router.get('/active-referral-per-ambassador/:start_date/:end_date', getAllactiveReferralAmbassador);
router.get('/inactive-referral-per-ambassador/:start_date/:end_date', getAllInactiveReferralAmbassador);

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
    adminService.agentSubscription(req.query)
        .then(subscription => subscription ? res.status(200).json({ status: true, data: subscription }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
        .catch(err => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to get all the user list
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function getActiveAgents(req, res, next) {
    adminService.getActiveAgents(req.params)
        .then(activeAgents => activeAgents ? res.status(200).json({ status: true, data: activeAgents }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
        .catch(err => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to get agent data by id
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function getAgentById(req, res, next) {
    adminService.getAgentById(req.params)
        .then(agent => agent ? res.status(200).json({ status: true, data: agent }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: [] }))
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

/**
 * Fuction to delete agent by id
 * 
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * 
 * @return Json|null
 */

function deleteAgentById(req, res, next) {
    adminService.deleteAgentById(req.params)
        .then(sucess => sucess ? res.status(200).json({ status: true, data: "User deleted" }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err })));
}

/** 
 * Funtion to getOneuser by id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

function getAgentById(req, res, next) {
    adminService.getOneAgentById(req.params)
        .then(user => user ? res.status(200).json({ status: true, data: user }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err })))
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to get Active Subcriptions Ambassadors for report
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

function reportActiveSubcribedAmbassadors(req, res, next) {
    adminService.reportActiveSubcribedAmbassadors(req.params)
        .then(activeAmbassador => activeAmbassador ? res.status(200).json({ status: true, data: activeAmbassador }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err.message })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get All Active Subcriptions Ambassadors
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

// TEST 1st Active Subcripton of Ambassador
function getAllActiveSubcribedAmbassadors(req, res, next) {
    adminService.getAllActiveSubcribedAmbassadors(req.params)
        .then(activeAmbassador => activeAmbassador ? res.status(200).json({ status: true, data: activeAmbassador }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err.message })));
}
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Function to get all active subcribed subscribers for reports
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

function reportActiveSubcribedSubscribers(req, res, next) {
    adminService.reportActiveSubcribedSubscribers(req.params)
        .then(activeSubscriber => {
            activeSubscriber.length > 0 ?
                res.status(200).json({ status: true, data: activeSubscriber }) :
                res.status(400).json({ status: false, message: msg.common.no_data_err, data: null })
        })
        .catch(err => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function to get all active subcribed ambassador for reports
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */

function reportAllActiveSubcribedAmbassadors(req, res, next) {
    adminService.reportAllActiveSubcribedAmbassadors(req.params)
        .then(activeSubscriber => {
            activeSubscriber.length > 0 ?
                res.status(200).json({ status: true, data: activeSubscriber }) :
                res.status(400).json({ status: false, message: msg.common.no_data_err, data: null })
        })
        .catch(err => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get all active subcribeed subscribers
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
// TEST 2nd Active Subscription of Subscriber
function getAllActiveSubscriptionSubscriber(req, res, next) {
    adminService.getAllActiveSubscriptionSubscriber(req.params)
        .then(activeSubscriber => {
            activeSubscriber.length > 0 ?
                res.status(200).json({ status: true, data: activeSubscriber }) :
                res.status(400).json({ status: false, message: msg.common.no_data_err, data: null })
        })
        .catch(err => next(res.json({ status: false, message: err })));
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get all data of defauled payment of ambassador 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next
 *                  
 */
// TEST 3rd Defaulted Subscriptions Payments of Ambassador
function getAllDefaultedSubscriptionPaymentOfAmbassador(req, res, next) {
    adminService.getAllDefaultedSubscriptionPaymentOfAmbassador(req.params)
        .then(activeAmbassador => activeAmbassador ? res.status(200).json({ status: true, data: activeAmbassador }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err })))
}


/***
 * Functinn get All Defaulted Subcription Payment of Subscriber
 * @param {*} req
 * @param {*} res 
 * @param {*} next
 * 
 * 
 */
// TEST 4th Defaulted Subscriptions Payments of Subscriber
function getAllDefaultedSubscriptionPaymentOfSubscribers(req, res, next) {
    console.log("getAllDefaultedSubscriptionPaymentOfSubscribers")
    adminService.getAllDefaultedSubscriptionPaymentOfSubscriber(req.params)
        .then(activeSubscriber => activeSubscriber ? res.status(200).json({ status: true, data: activeSubscriber }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err })));
}



/**
 * Function for get all data Cancellation of Subscriptions – Cancelled by Ambassador
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
// TEST 5th
function getSubscriptionCancelledByAmbassador(req, res, next) {
    console.log("getSubscriptionCancelledByAmbassador")
    adminService.getSubscriptionCancelledByAmbassador(req.params)
        .then(cancelledSubscriber => cancelledSubscriber ? res.status(200).json({ status: true, data: cancelledSubscriber }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err.message })));

}

/**
 * Function for get all data Cencellation of Subcription -Cancelld by Subscriber
 * @param {*} req 
 * @param {*} res
 * @param {*} next
 * 
 */
// TEST 6th
function getSubscriptionCancelledBySubscriber(req, res, next) {
    adminService.getSubscriptionCancelledBySubscriber(req.params)
        .then(cancelledSubscriber => cancelledSubscriber ? res.status(200).json({ status: true, data: cancelledSubscriber }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err.message })));

}



/**
 * Function for get all data active and inactive Referral per ambassador
 * @param {*} req 
 * @param {*} res
 * @param {*} next
 * 
 */
function getAllActiveAndInactiveReferralPerAmbassador(req, res, next) {
    adminService.activeAndInactiveReferralPerAmbassador(req.params)
        .then(user => user ? res.status(200).json({ status: true, data: user }) : res.status(400).json({ status: false, message: msg.common.no_data_err.data.err, data: null }))
        .catch(err => next(res.json({ status: false, message: err })));
}

/**
 * Function for get all data active Referral per ambassador
 * @param {*} req 
 * @param {*} res
 * @param {*} next
 * 
 */
function getAllactiveReferralAmbassador(req, res, next) {
    adminService.activeReferralPerAmbassador(req.params)
        .then(activeReferral => activeReferral ? res.status(200).json({ status: true, data: activeReferral }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err })));


}

/**
 * Function for get all data inactive Referral per ambassador
 * @param {*} req 
 * @param {*} res
 * @param {*} next
 * 
 */
function getAllInactiveReferralAmbassador(req, res, next) {
    adminService.inactiveReferralPerAmbassador(req.params)
        .then(inactiveReferral => inactiveReferral ? res.status(200).json({ status: true, data: inactiveReferral }) : res.status(400).json({ status: false, message: msg.common.no_data_err, data: null }))
        .catch(err => next(res.json({ status: false, message: err })));

}