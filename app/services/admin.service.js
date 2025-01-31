/**
 * File Name: Admin Service
 * 
 * Description: Manages login,signup and all admin operations
 * 
 * Author: Skill Tech
 */

const config = require('../config/index'); 
const commonService = require("../services/common.service");
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || config.connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;

const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const msg = require("../helpers/messages.json");
const { User, Subscriptionpayment, Purchasedcourses, Referral, Sed } = require('../helpers/db');
const crypto = require("crypto");
const { unsubscribe } = require('diagnostics_channel');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const cron = require('node-cron');
const axios = require('axios');
const { Buffer } = require('buffer');

module.exports = {
    agentSubscription,
    getActiveAgents,
    getAgentById,
    deleteAgentById,
    getOneAgentById,
    
    getAllActiveSubcribedAmbassadors,
    getAllActiveSubscriptionSubscriber,
    getDefaultedSubscriptionPaymentOfAmbassador,
    getDefaultedSubscriptionPaymentOfSubscribers,
    getSubscriptionCancelledByAmbassador,
    getSubscriptionCancelledBySubscriber,
    getAllActiveAndInactiveReferralPerAmbassador,
    getAllActiveReferralAmbassador,
    getAllInactiveReferralAmbassador,
    getActiveAndInactiveReferralPerAmbassador,
    getActiveReferralAmbassador,
    getInactiveReferralAmbassador,
    getPaymentDueToAmbassador,
    getBulkPaymentReport,
    getConsolidatedInformationReport,
    getSubscriberManullyLinkedReport,
    getSEDProgressReport,
    getSubscriberLoginCredentials, 
    
    saveLinkedReferralCodeByAdmin,
    getLinkedReferralCodeByAdmin,
    editLinkedReferralCodeByAdmin,
    deleteLinkedReferralCodeByAdmin,
    submitLinkedReferralCodesByAdmin, 
    saveSEDSubscribers,
    sendSEDEmails,
    checkSEDBulkUploadEmails,
};

/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Send email to the intended user
 * 
 * @param {*} mailOptions 
 * @returns 
 */
function sendMail(mailOptions) {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        port: config.mail_port, // true for 465, false for other ports
        host: config.mail_host,
        auth: {
            user: config.mail_auth_user,
            pass: config.mail_auth_pass,
        },
        tls: {
            rejectUnauthorized: false
        },
        secure: config.mail_is_secure,
    });

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log('*** Error', err);
        } else {
            console.log('*** Success', info);
        }

    });
    return true;
}

/*****************************************************************************************/
/*****************************************************************************************/

/**
 * get all courses
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function agentSubscription(param) {
    console.log('code', param.id);
    let courseData = await Subscriptionpayment.find()
        .select("plan_name subscription_type frequency billing_date payment_mode payment_status amount payment_cycle item_name item_description m_payment_id is_recurring userid createdAt updatedAt").sort({ createdAt: 'desc' });
    if (courseData) {
        return courseData;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * get all active agents
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function getActiveAgents(param) {

    let agentsData = await User.find({ is_active: true, role: 'subscriber' }).sort({ createdAt: 'desc' });
    if (agentsData) {
        return agentsData;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * get agent by id
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function getAgentById(param) {

    let agentData = await User.find({ _id: param.id }).sort({ createdAt: 'desc' });
    if (agentData) {
        return agentData;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * delete Agent by id
 * @param {param}
 * 
 * @return null|boolen
 */
async function deleteAgentById(param) {

    let agentData = await User.findById({ _id: param.id });

    if (agentData) {
        await User.findByIdAndDelete({ _id: agentData._id });
        return true;

    } else {
        return null;
    }
}

/**
 * get single user by id
 * @param {param}
 * 
 * @return null|Object
 */
async function getOneAgentById(param) {
    let agent = User.findById({ _id: id });

    if (agent && agent.length > 0) {
        return agent;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * get Active subscriptions of Ambassadors 
 * @param {param}
 * 
 * @return null|Object
 */
async function getAllActiveSubcribedAmbassadors(param) {
    try {
        let query = {
            is_active: true,
        };

        if (param && param.start_date && param.end_date) {
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }

        const activeSubscribedAmbassadors = await Purchasedcourses.find(query)
            .populate({
                path: 'userId',
                match: { role: 'ambassador' },
                select: 'firstname surname id_number referral_code ambassador_date',
                options: {
                    sort: { createdAt: 1 }
                }
            })
            .exec();

        console.log("activeSubscribedAmbassadors", activeSubscribedAmbassadors);
        
        if (activeSubscribedAmbassadors.length > 0) {
            const result = activeSubscribedAmbassadors.map(data => {
                const user = data.userId;
                if (!user) {
                    return null; // Skip this entry if userId is null
                }
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                };
                return {
                    Ambassador_firstname: user.firstname,
                    Ambassador_lastname: user.surname,
                    id_number: user.id_number,
                    referral_code: user.referral_code,
                    ambassador_date: formatDate(user.ambassador_date),
                    subscription_status: data.is_active ? 'Active' : 'Inactive',
                    subscription_date: formatDate(data.createdAt)
                };
            }).filter(entry => entry !== null);
            return result;
        } else {
            return [];
        }
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}
/**
 * get all Active subscriptions of Subscribers 
 *  `
 * @param {param}
 *
 * @return null|Object
 * 
 */
async function getAllActiveSubscriptionSubscriber(param) {
    try {
        let query = {
            is_active: true,
        };

        if (param && param.start_date && param.end_date) {
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }

        const activeSubscribedSubscriber = await Purchasedcourses.find(query)
            .populate({
                path: 'userId',
                match: { role: 'subscriber' },
                select: 'firstname surname id_number',
                options: {
                    sort: { createdAt: 1 } // Adjust the sorting options as needed
                }
            })
            .exec();

        console.log("activeSubscribedSubscriber", activeSubscribedSubscriber);
        
        if (activeSubscribedSubscriber.length > 0) {
            const result = activeSubscribedSubscriber.map(data => {
                const user = data.userId;
                if (!user) {
                    return null;
                };
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                };
                return {
                    Subscriber_firstname: user.firstname,
                    Subscriber_lastname: user.surname,
                    id_number: user.id_number,
                    subscription_status: data.is_active ? 'Active' : 'Inactive',
                    subscription_date: formatDate(data.createdAt)
                };
            }).filter(entry => entry !== null);
            return result;
        } else {
            return [];
        }
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}

/**
 * get all defaulted subscriptions payment of Subscribers ambassador
 *  
 * @param {param}
 * 
 * @return null|Object
 * 
 */
async function getDefaultedSubscriptionPaymentOfAmbassador(param) {
    try {
        console.log("param", param)
        let query = {
            role: 'ambassador',
            is_active: false
        };

        if (param && param.start_date && param.end_date) {
            query.subscription_stopped_payment_date = { $gte: new Date(param.start_date), $lte: new Date(param.end_date) };
        }

        let defaultAmbassador = await User.find(
            query,
            {
                role: 1,   
                firstname: 1,
                surname: 1,
                id_number: 1,
                referral_code: 1,
                subscription_stopped_payment_date: 1,
            }
        ).sort({ createdAt: -1 });

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };
        const result = defaultAmbassador.filter(entry => entry.subscription_stopped_payment_date !== null).map(data => ({
            Ambassador_firstname: data.firstname,
            Ambassador_lastname: data.surname,
            id_number: data.id_number,
            referral_code: data.referral_code,
            payment_status: 'Insufficient funds',
            last_paid_date: formatDate(data.subscription_stopped_payment_date) || "none",
        }));
        console.log("Defaulted Subscriptions Ambassador************", result);
        if (result && result.length > 0) {
            return result;
        } else {
            return [];
        }
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
};


async function getDefaultedSubscriptionPaymentOfSubscribers(param) {
    try {
        console.log("param", param)
        let query = {
            role: 'subscriber',
            is_active: false
        };

        if (param && param.start_date && param.end_date) {
            query.subscription_stopped_payment_date = { $gte: new Date(param.start_date), $lte: new Date(param.end_date) };
        }

        let defaultAmbassador = await User.find(
            query,
            {
                role: 1,
                firstname: 1,
                surname: 1,
                id_number: 1,
                referral_code: 1,
                subscription_stopped_payment_date: 1,
            }
        ).sort({ createdAt: -1 });

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };
        const result = defaultAmbassador.filter(entry => entry.subscription_stopped_payment_date !== null).map(data => ({
            Subscriber_firstname: data.firstname,
            Subscriber_lastname: data.surname,
            id_number: data.id_number,
            referral_code: data.referral_code,
            payment_status: 'Insufficient funds',
            last_paid_date: formatDate(data.subscription_stopped_payment_date) || "none",
        }));
        console.log("Defaulted Subscriptions Ambassador", result);
        if (result && result.length > 0) {
            return result;
        } else {
            return [];
        }
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}


/**
 * get all data Cancellation of Subscriptions – Cancelled by Ambassador
 * @param {param}
 * @return null|Object 
 */
async function getSubscriptionCancelledByAmbassador(param) {
    try {
        const startDate = param && param.start_date ? new Date(param.start_date) : new Date(0); // Default to beginning of time
        const endDate = param && param.end_date ? new Date(param.end_date) : new Date(); // Default to current date/time
        const pipeline = [
            {
                $match: {
                    is_active: false,
                    cancellation_date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $match: {
                    cancellation_date: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $match: {
                    "user.role": "ambassador"
                }
            },
            {
                $project: {
                    _id: 0,
                    Ambassador_firstname: "$user.firstname",
                    Ambassador_lastname: "$user.surname",
                    id_number: "$user.id_number",
                    referral_code: "$user.referral_code",
                    cancellation_date: 1
                }
            },
            {
                $sort: {
                    cancellation_date: -1
                }
            }
        ];

        const cancellationRecords = await Purchasedcourses.aggregate(pipeline);
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };
        const formattedRecords = cancellationRecords.map(record => ({
            ...record,
            cancellation_date: formatDate(record.cancellation_date)
        }));
        console.log("getSubscriptionCancelledBySubscriber.......", cancellationRecords);
        return formattedRecords;
    } catch (error) {
        console.error("Error in getSubscriptionCancelledBySubscriber:", error);
        throw error; // Rethrow the error to be caught by the caller
    }
}




/**
 * get all data Cancellation of Subscriptions – Cancelled by subscribers
 * 
 * @param {param}
 * @return null|Object 
 * 
 */

async function getSubscriptionCancelledBySubscriber(param) {
    try {
        const startDate = param && param.start_date ? new Date(param.start_date) : new Date(0); // Default to beginning of time
        const endDate = param && param.end_date ? new Date(param.end_date) : new Date(); // Default to current date/time
        const pipeline = [
            {
                $match: {
                    is_active: false,
                    cancellation_date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $match: {
                    cancellation_date: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $match: {
                    "user.role": "subscriber"
                }
            },
            {
                $project: {
                    _id: 0,
                    Subscriber_firstname: "$user.firstname",
                    Subscriber_lastname: "$user.surname",
                    id_number: "$user.id_number",
                    referral_code: "$user.referral_code",
                    cancellation_date: 1
                }
            },
            {
                $sort: {
                    cancellation_date: -1
                }
            }
        ];

        const cancellationRecords = await Purchasedcourses.aggregate(pipeline);

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };
        const formattedRecords = cancellationRecords.map(record => ({
            ...record,
            cancellation_date: formatDate(record.cancellation_date)
        }));
        console.log("getSubscriptionCancelledBySubscriber.......", cancellationRecords);
        return formattedRecords;
    } catch (error) {
        console.error("Error in getSubscriptionCancelledBySubscriber:", error);
        throw error; // Rethrow the error to be caught by the caller
    } 
};


/**
 * Function get Active and inactive referralsPer Ambassador – Year To Date (YTD)
 *  `
 * @param {param}
 *
 * @return null|Object
 * 
 */
async function getAllActiveAndInactiveReferralPerAmbassador(param) {
    if (!param) {
        return null;
    }

    let referralData = await Referral.aggregate([
        {
            $match: {
                purchagedcourseId: { $ne: null }, 
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "referral_code",
                foreignField: "referral_code",
                as: "ambassador"
            }
        },
        {
            $match: {
                "ambassador.is_active": true,
            }
        },
        {
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                id_number: { $arrayElemAt: ["$subscriber.id_number", 0] },
                referral_code: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
                HVG_Subscription_status: {
                    $cond: {
                        if: { $or: [{ $eq: ["$is_active", true] }, { $eq: [{ $ifNull: ["$is_active", ""] }, ""] }] },
                        then: "Active",
                        else: "Inactive"
                    }
                }
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();
    console.log("referralData for getAllActiveAndInactiveReferralPerAmbassador", referralData)

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    const formattedData = referralData.map(data => ({
        ...data,
        Date_of_use_of_referral_code: formatDate(data.Date_of_use_of_referral_code)
    }));

    return formattedData;
}
/**
 * Function get Active and inactive referralsPer Ambassador – Year To Date (YTD) by date selection
 *   
 * @param {param} 
 * @result null|Object
 * 
 */
async function getActiveAndInactiveReferralPerAmbassador(param) {
    if (!param) {
        return null;
    }

    let referralData = await Referral.aggregate([
        {
            $match: {
                purchagedcourseId: { $ne: null }, 
                createdAt: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "referral_code",
                foreignField: "referral_code",
                as: "ambassador"
            }
        },
        {
            $match: {
                "ambassador.is_active": true,
            }
        },
        {
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                id_number: { $arrayElemAt: ["$subscriber.id_number", 0] },
                referral_code: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
                HVG_Subscription_status: {
                    $cond: {
                        if: { $or: [{ $eq: ["$is_active", true] }, { $eq: [{ $ifNull: ["$is_active", ""] }, ""] }] },
                        then: "Active",
                        else: "Inactive"
                    }
                }
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    const formattedData = referralData.map(data => ({
        ...data,
        Date_of_use_of_referral_code: formatDate(data.Date_of_use_of_referral_code)
    }));

    return formattedData;
}


/**
 * Function get All Active Referrals per Ambassador
 *  `
 * @param {param}
 *
 * @return null|Object
 * 
 */
async function getAllActiveReferralAmbassador(param) {
    if (!param) {
        return null;
    }

    let referralData = await Referral.aggregate([
        {
            $match: {
                purchagedcourseId: { $ne: null }, 
                is_active: true,
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "referral_code",
                foreignField: "referral_code",
                as: "ambassador"
            }
        },
        {
            $match: {
                "ambassador.is_active": true,
            }
        },
        {
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                id_number: { $arrayElemAt: ["$subscriber.id_number", 0] },
                referral_code: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    const formattedData = referralData.map(data => ({
        ...data,
        Date_of_use_of_referral_code: formatDate(data.Date_of_use_of_referral_code)
    }));

    return formattedData;
}
/**
 * Function get Active Referrals per Ambassador by date selection
 * @param {param}
 * 
 * @result null|Object
 */
async function getActiveReferralAmbassador(param) {
    if (!param) {
        return null;
    }

    let referralData = await Referral.aggregate([
        {
            $match: {
                purchagedcourseId: { $ne: null },
                is_active: true,
                createdAt: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "referral_code",
                foreignField: "referral_code",
                as: "ambassador"
            }
        },
        {
            $match: {
                "ambassador.is_active": true,
            }
        },
        {
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                id_number: { $arrayElemAt: ["$subscriber.id_number", 0] },
                referral_code: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    const formattedData = referralData.map(data => ({
        ...data,
        Date_of_use_of_referral_code: formatDate(data.Date_of_use_of_referral_code)
    }));

    return formattedData;
}

/**
 * Function get All Inactive Referrals per Ambassador
 *  `
 * @param {param}
 *
 * @return null|Object
 * 
 */
async function getAllInactiveReferralAmbassador(param) {
    if (!param) {
        return null;
    }

    let referralData = await Referral.aggregate([
        {
            $match: {
                purchagedcourseId: { $ne: null },
                is_active: false,
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "referral_code",
                foreignField: "referral_code",
                as: "ambassador"
            }
        },
        {
            $match: {
                "ambassador.is_active": true,
            }
        },
        {
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                id_number: { $arrayElemAt: ["$subscriber.id_number", 0] },
                referral_code: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    console.log("getAllInactiveReferralAmbassador referralData", referralData)

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    const formattedData = referralData.map(data => ({
        ...data,
        Date_of_use_of_referral_code: formatDate(data.Date_of_use_of_referral_code)
    }));

    return formattedData;

}
/**
 * Function get Inactive Referrals per Ambassador by date selection
 * @param {param}
 * 
 * @result null|Object
 */
async function getInactiveReferralAmbassador(param) {
    if (!param) {
        return null;
    }

    let referralData = await Referral.aggregate([
        {
            $match: {
                purchagedcourseId: { $ne: null },
                is_active: false,
                createdAt: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "referral_code",
                foreignField: "referral_code",
                as: "ambassador"
            }
        },
        {
            $match: {
                "ambassador.is_active": true,
            }
        },
        {
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                id_number: { $arrayElemAt: ["$subscriber.id_number", 0] },
                referral_code: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    const formattedData = referralData.map(data => ({
        ...data,
        Date_of_use_of_referral_code: formatDate(data.Date_of_use_of_referral_code)
    }));

    return formattedData;

}


/**
 * Function to get data for payment due to Ambassador by date selection
 * @param {param}
 * 
 * @result null|Object
 */

async function getPaymentDueToAmbassador(param) {
    try {
        let query = {
            purchagedcourseId: { $ne: null },
            is_active: true,
        };
    
        if (param && param.start_date && param.end_date) {
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            }
        };
        const ambassadors = await Referral.find(query);
        console.log("ambassadors", ambassadors);
        const referralsSet = new Set(ambassadors.map(referral => referral.referral_code));
        const referrals = Array.from(referralsSet);
        console.log("referrals", referrals);
        
        const ambassadorData = await User.find({
            referral_code: { $in: referrals },
            is_active: true,
          })
          .select('firstname surname id_number referral_code')
          .exec();

        const result = ambassadorData.reduce((acc, data) => {
            const referralCount = ambassadors.filter(referral => referral.referral_code === data.referral_code).length;
            const amountDue = referralCount * 250;
            acc.push({
                Ambassador_firstname: data.firstname,
                Ambassador_lastname: data.surname,
                id_number: data.id_number,
                referral_code: data.referral_code,
                referral_count: referralCount,
                due_amount: amountDue,
            });
            return acc;
        }, []);

        console.log(result);
        return result;
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}

/**
 * Function for getting bulk payment report of all ambassador
 * @param {param}
 * 
 * @result null|Object
 */
async function getBulkPaymentReport(param) {
    try {
        console.log("getBulkPaymentReport - param: ", param)
        // const now = new Date();
        // const currentMonth = now.getMonth();
        // const currentYear = now.getFullYear();
        // const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
        // const endDate = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));
        let query = { 
            purchagedcourseId: { $ne: null },
            is_active: true,
        };
        if (param && param.start_date && param.end_date) {
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            }
        };
        console.log("query", query);
        const ambassadors = await Referral.find(query);
        console.log("ambassadors", ambassadors);
        const referralsSet = new Set(ambassadors.map(referral => referral.referral_code));
        const referrals = Array.from(referralsSet);
        console.log("referrals", referrals);

        const ambassadorData = [];
        for (let i = 0; i < referrals.length; i++) {
            let queryUser = { 
                referral_code: referrals[i],
                is_active: true,
              };
            const ambassadorDetails = await User.findOne(queryUser)
                .select('firstname surname id_number email referral_code account_holder_name account_number type_of_account branch_code')
                .exec();
            if (ambassadorDetails) {
                ambassadorData.push(ambassadorDetails);
            }
        }
        console.log("ambassadorData", ambassadorData); 
        
        
        const result = ambassadorData.reduce((acc, data) => {
            const referralCount = ambassadors.filter(referral => referral.referral_code === data.referral_code).length;
            console.log("referralCount************", referralCount); 
            const amountDue = referralCount * 250;
            acc.push({
                recipient_name: `${data.firstname} ${data.surname}`,
                recipient_account: data.account_number || 'N/A',
                // recipient_acount_type: data.type_of_account || 'N/A',
                recipient_acount_type: '1',
                branch_code: data.branch_code || 'N/A',
                amount: amountDue ? amountDue : '0',
                own_reference: data.referral_code || 'N/A',
                recipient_reference: 'High Vista Guild',
                // email_1_notify: `${data.firstname} ${data.surname}`,
                email_1_notify: "Yes",
                email_1_address: data.email,
                email_1_subject: "You've received a payment from High Vista Guild",
                email_2_notify: '',
                email_2_address: '',
                email_2_subject: '',
                email_3_notify: '',
                email_3_address: '',
                email_3_subject: '',
                email_4_notify: '',
                email_4_address: '',
                email_4_subject: '',
                email_5_notify: '',
                email_5_address: '',
                email_5_subject: '',
                fax_1_notify: '',
                fax_1_code: '',
                fax_1_number: '',
                fax_1_subject: '',
                fax_2_notify: '',
                fax_2_code: '',
                fax_2_number: '',
                fax_2_subject: '',
                sms_1_notify: '',
                sms_1_code: '',
                sms_1_number: '',
                sms_2_notify: '',
                sms_2_code: '',
                sms_2_number: ''
            });
            
            return acc;
        }, []);

        console.log(result);
        return result;
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}
/**
 * Function for getting consolidated information report of all ambassador & subscribe
 * @param {param}
 * 
 * @result null|Object
 */

async function getConsolidatedInformationReport(param) {
    try {
        let query = {
            // role: { $in: ['subscriber', 'ambassador'] }
        };
        if (param && param.start_date && param.end_date) {
            query.subscription_date = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }

        const userData = await User.find(query)
        .select("firstname surname id_number email mobile_number alternate_mobile_number province race gender bank account_number account_holder_name type_of_account bank_proof certificate role is_active referral_code subscription_date subscription_cancellation_date subscription_stopped_payment_date is_sed_subscriber sed_data")
        .populate({
            path: "sed_id",
            model: Sed,
            select: "benefactor_name benefactor_email benefactor_contact_firstname benefactor_contact_surname benefactor_contact_mobile_number start_date_sponsored_subscription end_date_sponsored_subscription",
        })

        // Filter out admin users
        const filteredData = userData.filter(data => data.role !== 'admin');

        // Use Promise.all to handle async operations inside map
        const filteredUserData = await Promise.all(filteredData.map(async data => {
            // Fetch referral data for linked ambassador
            const referralData = await Referral.find({ userId: data._id, purchagedcourseId: { $ne: null } }).select("referral_code").exec();
            // console.log("referralData for linked referral", referralData);
            
            if (referralData && referralData.length > 0) {
                data.linked_ambassador_referral = referralData[0].referral_code;
            } else {
                data.linked_ambassador_referral = 'none';
            }
            return data;
        }));

        const formatDate = (dateString) => {
            if (!dateString) {
                return 'none';
            }
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'none';
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        // Map the user data to the required format
        const result = filteredUserData.map(data => ({
            firstname: data.firstname || 'none',
            lastname: data.surname || 'none',
            id_number: data.id_number || 'none',
            email: data.email || 'none',
            mobile_number: data.mobile_number || 'none',
            alternate_mobile_number: data.alternate_mobile_number || 'none',
            province: data.province || 'none',
            race: data.race || 'none',
            gender: data.gender || 'none',
            bank: data.bank || 'none',
            account_number: data.account_number || 'none',
            account_holder_name: data.account_holder_name || 'none',
            type_of_account: data.type_of_account || 'none',
            proof_of_banking_uploaded: data.bank_proof ? 'Y' : 'N',
            id_uploaded: data.certificate ? 'Y' : 'N',
            role: data.role === 'ambassador' ? 'Ambassador' : data.role === 'subscriber' ? 'Subscriber' : 'none',
            is_active: data.is_active ? 'Active' : 'Inactive',
            referral_code: data.referral_code || 'none',
            linked_to_ambassador_status: data.linked_ambassador_referral !== 'none' ? 'Y' : 'N',
            linked_ambassador_referral: data.linked_ambassador_referral || 'none',
            date_of_subscription: formatDate(data.subscription_date),
            unsubscribe_status: data.is_active ? 'N' : 'Y',
            unsubscribed_date: formatDate(data.subscription_cancellation_date),
            stopped_payment_status: data.subscription_stopped_payment_date ? 'Y' : 'N',
            stopped_payment_date: formatDate(data.subscription_stopped_payment_date),
            benefactor_name: data.sed_id?.benefactor_name || 'none',
            benefactor_email: data.sed_id?.benefactor_email || 'none',
            benefactor_contact_firstname: data.sed_id?.benefactor_contact_firstname || 'none',
            benefactor_contact_surname: data.sed_id?.benefactor_contact_surname || 'none',
            benefactor_contact_mobile_number: data.sed_id?.benefactor_contact_mobile_number || 'none',
            is_sed_subscriber: data.is_sed_subscriber ? 'Yes' : 'No',
            twelve_months_subscription: data.sed_data?.twelve_months_subscription === true ? 'Yes' : 'No',
            start_date_sponsored_subscription: formatDate(data.sed_id?.start_date_sponsored_subscription),
            end_date_sponsored_subscription: formatDate(data.sed_id?.end_date_sponsored_subscription),
            employement_status: data.sed_data?.employement_status || 'none',
            consultant_ambassador_firstname: data.sed_data?.consultant_ambassador_firstname || 'none',
            consultant_ambassador_surname: data.sed_data?.consultant_ambassador_surname || 'none',
        }));

        return result;
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
};


/**
 * Function get Manually linked Subscriber to the referrral code by Admin
 *   
 * @param {param} 
 * @result null|Object
 * 
 */
async function getSubscriberManullyLinkedReport(param) {
    console.log("SubscriberManullyLinked request", param);
    const query = {
        purchagedcourseId: { $ne: null },
        is_linked_by_admin: true
    };

    if (param.start_date && param.end_date) {
        query.createdAt = {
            $gte: new Date(param.start_date),
            $lte: new Date(param.end_date)
        };
    }

    let referralData = await Referral.aggregate([
        {
            $match: query
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "referral_code",
                foreignField: "referral_code",
                as: "ambassador"
            }
        },
        {
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                subscriber_id_number: { $arrayElemAt: ["$subscriber.id_number", 0] },
                subscriber_email: { $arrayElemAt: ["$subscriber.email", 0] },
                subscriber_HVG_Subscription_status: {
                    $cond: {
                        if: { $eq: [{ $arrayElemAt: ["$subscriber.is_active", 0] }, true] },
                        then: "Active",
                        else: "Inactive"
                    }
                },
                referral_code_used: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_linking_referral_code: "$createdAt",
                ambassador_HVG_Subscription_status: {
                    $cond: {
                        if: { $eq: [{ $arrayElemAt: ["$ambassador.is_active", 0] }, true] },
                        then: "Active",
                        else: "Inactive"
                    }
                },
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    const formattedData = referralData.map(data => ({
        ...data,
        Date_of_linking_referral_code: formatDate(data.Date_of_linking_referral_code)
    }));

    return formattedData;
};


/**
 * Function for SED Progress Report
 *   
 * @param {param} 
 * @result null|Object
 * 
 */
async function getSEDProgressReport(param) {
    try {        
        const query = { is_sed_subscriber: true };

        if (param.start_date && param.end_date) {
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }

        const sedAllData = await User.aggregate([
            {
                $match: query
            },
            {
                $lookup: {
                    from: "seds",
                    localField: "sed_id",
                    foreignField: "_id",
                    as: "sedData"
                }
            },
            {
                $project: {
                    _id: 0,
                    sedData: 1,
                    benefactor_name: { $arrayElemAt: ["$sedData.benefactor_name", 0] },
                    firstname: "$firstname",
                    lastname: "$surname",
                    race: "$race",
                    gender: "$gender",
                    role: "$role",
                    referral_code: {
                        $cond: {
                            if: { $ne: ["$referral_code", ''] },
                            then: "$referral_code",
                            else: "none"
                        }
                    },
                    is_active: "$sed_data.sed_status",
                    // is_active: {
                    //     $cond: {
                    //         if: { $eq: ["$is_active", true] },
                    //         then: "Active",
                    //         else: "Inactive"
                    //     }
                    // },
                    is_sed_subscriber: {
                        $cond: {
                            if: { $eq: ["$is_sed_subscriber", true] },
                            then: "Yes",
                            else: "No"
                        }
                    },
                    twelve_months_subscription: {
                        $cond: {
                            if: { $eq: ["$sed_data.twelve_months_subscription", true] },
                            then: "Yes",
                            else: "No"
                        }
                    },
                    start_date_sponsored_subscription: { $arrayElemAt: ["$sedData.start_date_sponsored_subscription", 0] },
                    end_date_sponsored_subscription: { $arrayElemAt: ["$sedData.end_date_sponsored_subscription", 0] },
                    employement_status: "$sed_data.employement_status",
                    is_linked_to_consultant_ambassador: {
                        $cond: {
                            if: { $and: [{ $ne: ["$sed_data.consultant_ambassador_firstname", ""] }, { $ne: ["$sed_data.consultant_ambassador_surname", ""] }] },
                            then: "Yes",
                            else: "No"
                        }
                    },
                    consultant_ambassador_firstname: "$sed_data.consultant_ambassador_firstname",
                    consultant_ambassador_surname: "$sed_data.consultant_ambassador_surname",
                    consultant_ambassador_referral_code: "$sed_data.consultant_ambassador_referral_code",
                    course_started: "none",
                    course_completed: "none",
                    course_completion_percentage: "0%"
                }
            },
            { $sort: { createdAt: 1 } }
        ]).exec();
        console.log("SED sedAllData: ", sedAllData);

        const formatDate = (dateString) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        const formattedData = sedAllData.map(data => ({
            ...data,
            start_date_sponsored_subscription: formatDate(data.start_date_sponsored_subscription),
            end_date_sponsored_subscription: formatDate(data.end_date_sponsored_subscription)
        }));

        console.log("SED formattedData: ", formattedData);

        return formattedData;
    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}


// Check Task 6 - SED Bulk report for LMS course completion

//   cron.schedule('*/1 * * * *', async () => {
   
//     // Moodle configuration
//     const MOODLE_URL = process.env.MOODLE_COURSES_URL;
//     const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

//     // API Functions
//     const GET_USER_ENROLLED_COURSES_FUNCTION = 'core_enrol_get_users_courses';
//     const GET_COURSE_COMPLETION_FUNCTION = 'core_completion_get_course_completion_status';

//     // Function to get all courses a user is enrolled in
//     async function getEnrolledCourses(userId) {
//     try {
//         const response = await axios.post(MOODLE_URL, null, {
//         params: {
//             wstoken: MOODLE_TOKEN,
//             moodlewsrestformat: 'json',
//             wsfunction: GET_USER_ENROLLED_COURSES_FUNCTION,
//             userid: userId, // Specify the user ID
//         },
//         });

//         return response.data || [];
//     } catch (error) {
//         console.error('Error fetching enrolled courses:', error.response?.data || error.message);
//         return [];
//     }
//     }

//     // Function to check if a user has started a course   
//     async function hasUserStartedCourse(userId, courseId) {
//     try {
//         const response = await axios.post(MOODLE_URL, null, {
//         params: {
//             wstoken: MOODLE_TOKEN,
//             moodlewsrestformat: 'json',
//             wsfunction: GET_COURSE_COMPLETION_FUNCTION,
//             userid: userId,
//             courseid: courseId,
//         },
//         });

//         console.log("response:  ", response.config.params);
//         console.log("response:  ", response.data);

//         const { completionstatus } = response.data;
//         return completionstatus && completionstatus.completed !== 0; // Started if progress exists
//     } catch (error) {
//         console.error(
//         `Error fetching completion status for user ${userId} in course ${courseId}:`,
//         error.response?.data || error.message
//         );
//         return false;
//     }
//     }

//     // Main function to get count of started courses
//     async function getStartedCoursesCount(userId) {
//     try {
//         const enrolledCourses = await getEnrolledCourses(userId);
//         console.log(`User ${userId} is enrolled in ${enrolledCourses.length} courses.`);

//         let startedCoursesCount = 0;

//         for (const course of enrolledCourses) {
//         const isStarted = await hasUserStartedCourse(userId, course.id);
//         if (isStarted) {
//             startedCoursesCount++;
//         }
//         }

//         console.log(`User ${userId} has started ${startedCoursesCount} courses.`);
//         return startedCoursesCount;
//     } catch (error) {
//         console.error('Error calculating started courses count:', error.message);
//     }
//     }

//     // Example usage
//     const userId = 494;
//     getStartedCoursesCount(userId)
//     .then((count) => console.log(`Started courses count for user ${userId}:`, count))
//     .catch((error) => console.error('Error:', error));
//   });



// cron.schedule('*/1 * * * *', async () => {
//     // Moodle configuration
//     const MOODLE_URL = process.env.MOODLE_COURSES_URL;
//     const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

//     // Function to get course completion status
//     async function getCourseCompletionPercentage(userId, courseId) {
//         try {
//           const response = await axios.post(MOODLE_URL, null, {
//             params: {
//               wstoken: MOODLE_TOKEN,
//               moodlewsrestformat: 'json',
//               wsfunction: 'core_completion_get_course_completion_status',
//               userid: userId,
//               courseid: courseId,
//             },
//           });
          
//           const completionData = response.data.completionstatus?.completions || [];
//         //   console.log("completionData:", completionData)

//           if (completionData.length > 0) {
//             let completedActivities = completionData.filter(activity => activity.complete).length;
//             let totalActivities = completionData.length;
      
//             if (totalActivities > 0) {
//               const completionPercentage = (completedActivities / totalActivities) * 100;
//               console.log(`User ${userId} has completed ${completionPercentage.toFixed(2)}% of course ${courseId}`);
//               return completionPercentage.toFixed(2);
//             } else {
//               console.log(`No activities found for course ${courseId}`);
//               return 0;
//             }
//           } else {
//             console.log(`No completion data available for user ${userId} in course ${courseId}`);
//             return 0;
//           }
//         } catch (error) {
//           console.error(`Error fetching course completion status:`, error.response?.data || error.message);
//           return 0;
//         }
//       }     

//     const userId = 494;
//     // const AllcourseId = [82, 68, 63, 60, 78, 62, 65, 64, 66, 79, 67, 80, 61, 69, 81];
//     const AllcourseId = [78];

//     const allCoursesCompletionPercentage = [];
//     for (const courseId of AllcourseId) {
//         getCourseCompletionPercentage(userId, courseId)
//         .then((percentage) => {
//             console.log(`Course completion percentage: ${percentage}%`);
//             allCoursesCompletionPercentage.push({
//                 courseId: courseId,
//                 percentageCompletion: percentage
//             })
//             console.log(`allCoursesCompletionPercentage: ${percentage}`);
//         })
//         .catch((error) => console.error('Error:', error));
//     }
//     console.log("allCoursesCompletionPercentage: ", allCoursesCompletionPercentage);
// });





/**
 * Function for Subscriber login credentials
 *   
 * @param {param} 
 * @result null|Object
 * 
 */
async function getSubscriberLoginCredentials(param) {
    try {        
        const query = { is_sed_subscriber: true };

        if (param.start_date && param.end_date) {
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }

        const subscribersAllData = await User.aggregate([
            {
                $match: query
            },
            {
                $project: {
                    Subscriber_firstname: "$firstname",
                    Subscriber_lastname: "$surname",
                    subscriber_email: "$email",
                    subscriber_password: "$moodle_pass",
                }
            },
            { $sort: { createdAt: 1 } }
        ]).exec();
        console.log("subscribersAllData: ", subscribersAllData);

        return subscribersAllData;
    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: "Internal Server Error" };
    }
}


/**
 * Function for saving SED Subscriber data
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function saveSEDSubscribers(req) {
  try {
    const subscribersData = req.body;
    console.log("Subscribers data: ", subscribersData);

    if (!Array.isArray(subscribersData) || subscribersData.length === 0) {
      throw new Error("Invalid input: Expected an array of subscriber objects.");
    }

    // Create SED Benefactors data
    const savedBenefactor = [];
    for (const benefactor of subscribersData) {
        let benefactor_email = typeof benefactor.benefactorEmail === 'object' ? benefactor.benefactorEmail.text : benefactor.benefactorEmail;

        // Use the extracted email string in the query
        const existingBenefactor = await Sed.findOne({
        benefactor_email: benefactor_email,
        });

      console.log("existingBenefactor", existingBenefactor);

      if (!existingBenefactor) {
        const sed_benefactor = new Sed({
          benefactor_name: benefactor.benefactorName,
          benefactor_email: benefactor_email,
          benefactor_contact_firstname: benefactor.consultantAmbassadorFirstname,
          benefactor_contact_surname: benefactor.benefactorContactSurname,
          benefactor_contact_mobile_number: benefactor.benefactorMobile,
          start_date_sponsored_subscription: new Date(),
          end_date_sponsored_subscription: (() => {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
            return endDate;
          })(),
        });

        const sedBenefactors = await sed_benefactor.save();
        savedBenefactor.push(sedBenefactors);
      }
    }
    console.log("savedSedBenefactors", savedBenefactor);


    // Create SED Subscribers
    const users = [];
    for (const subscriber of subscribersData) {
        let email = typeof subscriber.email === 'object' ? subscriber.email.text : subscriber.email;
        let benefactor_email = typeof subscriber.benefactorEmail === 'object' ? subscriber.benefactorEmail.text : subscriber.benefactorEmail;

      const benefactor = await Sed.findOne({
        benefactor_email: benefactor_email,
      });
      const benefactorId = benefactor._id;

      users.push(
        new User({
          firstname: subscriber.firstname,
          surname: subscriber.surname,
          id_number: subscriber.id_number,
          email: email,
          mobile_number: subscriber.mobile_number,
          alternate_mobile_number: subscriber.alternate_mobile_number,
          street: subscriber.house_or_unit_number,
          street_name: subscriber.street_address,
          complex_n_unit: subscriber.complex_name,
          suburb_district: subscriber.suburb_district,
          town_city: subscriber.town_city,
          province: subscriber.province,
          postal_code: subscriber.postal_code,
          method_of_communication: subscriber.method_of_communication,
          policy_consent: {
            ecommercePolicy: subscriber.ecommercePolicy,
            privacy: subscriber.privacy,
            userConsent: subscriber.userConsent,
          },
          opt_in_promotional: {
            receive_monthly_newsletters: subscriber.monthly_newsletters,
            exclusive_deals_promotions: subscriber.deals_promotion,
            keep_in_loop: subscriber.in_loop,
          },
          race: subscriber.race,
          gender: subscriber.gender,
          qualification: subscriber.qualification,
          promotional_consent: subscriber.promotional_consent,
          how_did_you_hear_about_us: subscriber.how_did_you_hear_about_us,
          authname: subscriber.firstname + " " + subscriber.surname,
          password: bcrypt.hashSync("HighV1sta!Guild2024", 10),
          role: "subscriber",
          isActive: true,
          is_blocked: false,
          subscription_date: new Date(),
          is_sed_subscriber: true,
          sed_id: benefactorId,
          moodle_pass: Buffer.from("HighV1sta!Guild2024").toString('base64'),
          sed_data: {
            sed_status: "Active",
            employement_status: subscriber.employment_status,
            consultant_ambassador_firstname: subscriber.consultantAmbassadorFirstname,
            consultant_ambassador_surname: subscriber.consultantAmbassadorSurname,
            consultant_ambassador_referral_code: subscriber.consultantAmbassadorRerralCode,
            twelve_months_subscription: true,
          },
        })
      );
    }

    const savedUsers = await User.insertMany(users);
    console.log("savedUsers", savedUsers)

    if(savedUsers){
        for (const user of savedUsers) {
            const user_id = user._id;
            const userId = user_id.toString();
            handleMoodleCreateUser(user.firstname, user.surname, user.email, user.moodle_pass, userId);
        }
    }

    return {
      subscribers_data: savedUsers,
      benefactors_data: savedBenefactor,
    };
  } catch (err) {
    console.error("Error", err);
    return {
      error: true,
      message: err.message,
    };
  }
};

// cron.schedule('*/1 * * * *', async () => {
//     //     // handleMoodleCreateUser("Aaashish", "Mishraaaa", "assshish@gmail.com", "VGVzdGluZ0AxMjM0NQ==", "12345")
    
//     const MOODLE_URL = process.env.MOODLE_COURSES_URL;
//     const MOODLE_TOKEN = process.env.MOODLE_TOKEN;
//     const MOODLE_GET_COURSES_FUNCTION = 'core_course_get_courses_by_field';
//     const MOODLE_ENROLL_FUNCTION = 'enrol_manual_enrol_users';
//     const CATEGORY_ID = '26';
//     const ROLE_ID = 5;
//     // Step 3: Get all courses in the category
//     const getCoursesResponse = await axios.post(MOODLE_URL, null, {
//         params: {
//           wstoken: MOODLE_TOKEN,
//           moodlewsrestformat: 'json',
//           wsfunction: MOODLE_GET_COURSES_FUNCTION,
//           field: 'category',
//           value: CATEGORY_ID,
//         },
//       });
  
//       const courses = getCoursesResponse.data.courses || [];
//       console.log('Courses in category:', courses.length);
  
//       if (!courses.length) {
//         console.error('No courses found in this category.');
//         return;
//       }
  
//       // Step 4: Enroll the user in all courses within the category
//     const enrolments = courses.map(course => ({
//         roleid: ROLE_ID,
//         userid: "457",
//         courseid: course.id,
//     }));
//     console.log("enrolments: ", enrolments);

//     //   const params = {
//     //     wstoken: MOODLE_TOKEN,
//     //     moodlewsrestformat: 'json',
//     //     wsfunction: MOODLE_ENROLL_FUNCTION,
//     //   };
      
//     //   // Add each enrolment object to the params
//     //   enrolments.forEach((enrolment, index) => {
//     //     params[`enrolments[${index}][roleid]`] = enrolment.roleid;
//     //     params[`enrolments[${index}][userid]`] = enrolment.userid;
//     //     params[`enrolments[${index}][courseid]`] = enrolment.courseid;
//     //   });
      
//     //   const enrollResponse = await axios.post(MOODLE_URL, null, { params });
//     //   console.log('User enrolled in all courses in category:', enrollResponse.data);
  
//       const enrollResponse = await axios.post(MOODLE_URL, null, {
//         params: {
//           wstoken: MOODLE_TOKEN,
//           moodlewsrestformat: 'json',
//           wsfunction: MOODLE_ENROLL_FUNCTION,
//           enrolments: enrolments,
//         },
//       });
//       console.log('User enrolled in all courses in category:', enrollResponse.data);
// });



async function handleMoodleCreateUser(firstname, surname, email, moodle_pass, user_id){
    const MOODLE_URL = process.env.MOODLE_COURSES_URL;
    const MOODLE_TOKEN = process.env.MOODLE_TOKEN;
    const MOODLE_CREATE_FUNCTION = 'core_user_create_users';
    const MOODLE_GET_COURSES_FUNCTION = 'core_course_get_courses_by_field';
    const MOODLE_ENROLL_FUNCTION = 'enrol_manual_enrol_users';
    const MOODLE_GET_USER_FUNCTION = 'core_user_get_users_by_field';
    const CATEGORY_ID = '26';
    const ROLE_ID = 5;
    let moodleLoginId = '';
    
    // Generate base username
    let baseUsername = `${firstname.split(' ').join('_').toLowerCase()}_${surname.split(' ').join('_').toLowerCase()}`;
    let username = baseUsername;
    let userExists = true;
    let suffix = 1;
  
    try {
      // Step 1: Check if the username already exists in Moodle
      while (userExists) {
        const checkUserResponse = await axios.post(MOODLE_URL, null, {
          params: {
            wstoken: MOODLE_TOKEN,
            moodlewsrestformat: 'json',
            wsfunction: MOODLE_GET_USER_FUNCTION,
            field: 'username',
            values: [username],
          },
        });
  
        if (checkUserResponse.data.length) {
          username = `${baseUsername}${suffix}`;
          suffix++;
        } else {
          userExists = false;
        }
      }
      console.log('Final unique username:', username);
  
      // Step 2: Create user in Moodle
      const createUserResponse = await axios.post(MOODLE_URL, null, {
        params: {
          wstoken: MOODLE_TOKEN,
          moodlewsrestformat: 'json',
          wsfunction: MOODLE_CREATE_FUNCTION,
          users: [
            {
              username: username,
              email: email,
              password: Buffer.from(moodle_pass, 'base64').toString('utf-8'),
              firstname: firstname,
              lastname: surname,
            },
          ],
        },
      });
  
      if (createUserResponse.data && createUserResponse.data[0]) {
        moodleLoginId = createUserResponse.data[0].id;
        console.log('User created with moodleLoginId:', moodleLoginId);
      } else {
        console.error('Failed to create user in Moodle.');
        return;
      }
  
      // Step 3: Get all courses in the category
      const getCoursesResponse = await axios.post(MOODLE_URL, null, {
        params: {
          wstoken: MOODLE_TOKEN,
          moodlewsrestformat: 'json',
          wsfunction: MOODLE_GET_COURSES_FUNCTION,
          field: 'category',
          value: CATEGORY_ID,
        },
      });
  
      const courses = getCoursesResponse.data.courses || [];
      console.log('Courses in category:', courses.length);
  
      if (!courses.length) {
        console.error('No courses found in this category.');
        return;
      }
  
      // Step 4: Enroll the user in all courses within the category
      const enrolments = courses.map(course => ({
        roleid: ROLE_ID,
        userid: moodleLoginId,
        courseid: course.id,
      }));
  
      const enrollResponse = await axios.post(MOODLE_URL, null, {
        params: {
          wstoken: MOODLE_TOKEN,
          moodlewsrestformat: 'json',
          wsfunction: MOODLE_ENROLL_FUNCTION,
          enrolments: enrolments,
        },
      });
      console.log('User enrolled in all courses in category:', enrollResponse.data);

    //   Step 5: Save Moodle Id in the database
      const data = await User.findOneAndUpdate(
        { _id: user_id },
        {
            $set: { moodle_login_id: moodleLoginId, },
        },
        { new: true }
        );
        console.log("data: ", data);
  
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  };



/**
 * Function for sending SED Subscriber and Benefactor
 *   
 * @param {param} 
 * @result null|Object
 * 
 */
async function sendSEDEmails(req) {
    try {
        const emailsData = req.body;
        console.log("sendSEDEmails data: ", emailsData);

          const endDate = () => {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
            return formatDate(endDate);
          }

          const formatDate = (dateString) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };
        
        const currentDate = new Date();
        const benefactorAllEmailsArray = emailsData.map(item => ({
            benefactorName: item.benefactorName,
            benefactorEmail: item.benefactorEmail,
            start_date: formatDate(currentDate),
            end_date: endDate()
        }));
        
        const benefactorArray = Array.from(
            benefactorAllEmailsArray.reduce((map, item) => {
                const email = typeof item.benefactorEmail === 'object' 
                    ? item.benefactorEmail.text 
                    : item.benefactorEmail;
        
                if (!map.has(email)) {
                    map.set(email, item);
                }
                return map;
            }, new Map()).values()
        );
        console.log('Benefactor Array:', benefactorArray);
        
        //Benefactor Confirmation Email
        for (const benefactor of benefactorArray) {
            console.log("benefactor for testing: ", benefactor);
            const benefactor_email = typeof benefactor.benefactorEmail === 'object' ? benefactor.benefactorEmail.text : benefactor.benefactorEmail;
            const benefactorData = {
                email: benefactor_email,
                firstname: benefactor.benefactorName,
                surname: benefactor.start_date,
                referral_code: benefactor.end_date,
                bank: '',
                branch:'',
                type_of_account:'',
                account_number:'',
                branch_code:''
            }
            const create_contact = await commonService.addContactInBrevo(benefactorData);
            let sendBenefactorEmail;
            const benefactorName = benefactor.benefactorName;
            const benefactorEmail = benefactor_email;
            if(create_contact){
                sendBenefactorEmail = await commonService.sendEmailByBrevo(90, benefactorEmail, benefactorName);
            }
            if(sendBenefactorEmail){
                await commonService.deleteContactBrevo(benefactorEmail);
            }
        }

        //Subscriber Welcome Email
        const subscriberArray = emailsData.map(item => ({
            email: item.email,
            subscriberName: item.firstname +' '+ item.surname,
            benefactorName: item.benefactorName,
        }));
        console.log('Subscriber Array:', subscriberArray);
        
        for (const subscriber of subscriberArray) {
            console.log("subscriber for testing: ", subscriber);
            const subscriber_email = typeof subscriber.email === 'object' ? subscriber.email.text : subscriber.email;
            const subscriberData = {
                email: subscriber_email,
                firstname: subscriber.benefactorName,
                surname: '',
                referral_code: '',
                bank: '',
                branch:'',
                type_of_account:'',
                account_number:'',
                branch_code:''
            }
            const createContact = await commonService.addContactInBrevo(subscriberData);
            let sendSubscriberEmail;
            const subscriberName = subscriber.subscriberName;
            const subscriberEmail = subscriber_email;
            if(createContact){
                sendSubscriberEmail = await commonService.sendEmailByBrevo(89, subscriberEmail, subscriberName);
            }
            if(sendSubscriberEmail){
                await commonService.deleteContactBrevo(subscriberEmail);
            }
        }

        return true;

    } catch (error) {
      console.error('Error in sending SED Emails:', error);
    }
  };

/**
 * Function for checking SED uploaded email Ids
 *   
 * @param {param} 
 * @result null|Object
 * 
 */
async function checkSEDBulkUploadEmails(req) {
    try {
        const emailsData = req.body;
        console.log("sendSEDEmails data: ", emailsData);
        
        const existingEmails = [];
        for (const email of emailsData) {
            console.log("email data: ", email);
            const existingEmailCheck = await User.findOne({
                email: email,
            });
            console.log("existingEmailCheck", existingEmailCheck);
            if(existingEmailCheck){
                existingEmails.push(email);
            };
        };
        console.log("existingEmails data: ", existingEmails);
          
        return existingEmails;

    } catch (error) {
      console.error('Error in sending SED Emails:', error);
    }
  };

  /**
   * Function for SED grant Expiration check
   *   
   * @param {param} 
   * @result null|Object
   * 
   */
cron.schedule('0 0 * * *', async () => {
    console.log("Running daily cron job at midnight");

    // Benefactor Expiring Subscription Email
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 60);

    const sed_data = await Sed.find({
        is_notified: false,
        end_date_sponsored_subscription: {
            $gte: today,
            $lte: targetDate
        }
    }).exec();
    console.log("sed_data: ", sed_data);

    for (const data of sed_data) {
        const benefactorName = data.benefactor_name;
        const benefactorEmail = data.benefactor_email;
        console.log("benefactorName: ", benefactorName);
        console.log("userDataArray: ", benefactorEmail);
        await commonService.sendEmailByBrevo(91, benefactorEmail, benefactorName);

        const sedData = await Sed.findOneAndUpdate(
            { _id: data._id },
            {
                $set: { is_notified: true },
            },
            { new: true }
        );
        console.log("data: ", sedData);
    }
        
    // When Subscriber's SED Subscription ends
    const userDataArray = await User.find({
        is_sed_subscriber: true,
        "sed_data.sed_status": "Active"
    })
    .populate({
        path: 'sed_id',
        select: 'benefactor_name benefactor_email start_date_sponsored_subscription end_date_sponsored_subscription',
        options: {
            sort: { createdAt: 1 }
        }
    })
    .exec();
    console.log("userDataArray: ", userDataArray);

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    
    for (const userData of userDataArray) {
        const currentDate = new Date();
        if (currentDate > userData.sed_id.end_date_sponsored_subscription) {
            const subscriberData = {
                email: userData.email,
                firstname: userData.firstname,
                surname: userData.surname,
                referral_code: formatDate(userData.sed_id.end_date_sponsored_subscription),
                bank: '',
                branch:'',
                type_of_account:'',
                account_number:'',
                branch_code:''
            }
            console.log("subscriberData: ", subscriberData);
            const createContact = await commonService.addContactInBrevo(subscriberData);
            let sendSubscriberEmail;
            const subscriberName = userData.firstname +" "+ userData.surname;
            const subscriberEmail = userData.email;
            if(createContact){
                sendSubscriberEmail = await commonService.sendEmailByBrevo(92, subscriberEmail, subscriberName);
            }
            if(sendSubscriberEmail){
                await commonService.deleteContactBrevo(subscriberEmail); 
            }
        
            const data = await User.findOneAndUpdate(
                { email: userData.email },
                {
                    $set: { "sed_data.sed_status": "Pending" },
                },
                { new: true }
            );
            console.log("data: ", data);

            await handleMoodleUserDeletion(userData.moodleLoginId)
        };

        async function handleMoodleUserDeletion(moodleLoginId) {
            const MOODLE_URL = process.env.MOODLE_COURSES_URL;
            const MOODLE_TOKEN = process.env.MOODLE_TOKEN;
            const MOODLE_DELETE_FUNCTION = 'core_user_delete_users';
        
            try {
                const response = await axios.post(MOODLE_URL, null, {
                    params: {
                        wstoken: MOODLE_TOKEN,
                        moodlewsrestformat: 'json',
                        wsfunction: MOODLE_DELETE_FUNCTION,
                        userids: [moodleLoginId],
                    },
                });
        
                if (response.data.error) {
                    console.error('Moodle API Error:', response.data.error);
                } else {
                    console.log('Moodle user deleted successfully:', response.data);
                }
            } catch (error) {
                console.error('Error deleting Moodle user:', error.message);
            }
        }

        //When Subscriber's SED Subscription expiry period extend more than 30 days
        const pendingUserDataArray = await User.find({
            is_sed_subscriber: true,
            "sed_data.sed_status": "Pending"
        })
        .populate({
            path: 'sed_id',
            select: 'benefactor_name benefactor_email start_date_sponsored_subscription end_date_sponsored_subscription',
            options: {
                sort: { createdAt: 1 }
            }
        })
        .exec();
        console.log("pendingUserDataArray: ", pendingUserDataArray);
        
        for (const pendingUser of pendingUserDataArray) {
            const currentDate = new Date();
            const endDate = new Date(pendingUser.sed_id.end_date_sponsored_subscription); // Ensure endDate is a Date object
            const diffInDays = Math.floor((endDate - currentDate) / (1000 * 60 * 60 * 24)); // Calculate days difference
            console.log("endDate: ", endDate);
            console.log("diffInDays: ", diffInDays);
            
            if (diffInDays > 30) {
                const data = await User.findOneAndUpdate(
                    { email: pendingUser.email },
                    {
                        $set: {
                        is_active: false,
                        "sed_data.sed_status": "Inactive"
                        },
                    },
                    { new: true }
                );
                console.log("pendingUser updated data: ", data);
            }
        }
    }
    });


/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Link referral code by Admin
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function saveLinkedReferralCodeByAdmin(req) {
    try {
    //   console.log('linkReferralCodeByAdmin req.body: ', req.body);
  
      const incorrectDataArray = [];
      const emailExistedDataArray = [];
      const selfLinkedDataArray = [];
      const validEntries = [];
      const allCreatedReferralData = [];
        
      // Loop through each user object in req.body array
      for (const user of req.body) {
        const { email, referral_code } = user;
        const incorrectData = {};
        const emailExistedData = {};
        const selfLinkedData = {};
  
        // Find user data in the database
        const userData = await User.findOne({
            email: email,
            role: { $in: ["subscriber", "ambassador"] },
            is_active: true,
          }).select();
        const AmbassadorData = await User.findOne({ referral_code: referral_code, is_active: true }).select('is_active');
        // console.log("userData", userData);
        // console.log("AmbassadorData", AmbassadorData);
  
        // Check for incorrect data and add to incorrectData object
        if (!userData) {
          incorrectData.email = email;
        }
  
        if (AmbassadorData && AmbassadorData.is_active === false || AmbassadorData === null) {
          incorrectData.referral_code = referral_code;
        }
        
        // Proceed with further checks
        let userId = userData?._id;
        let existingReferral = '';
        if(userData){
            //Check if user is not Subscriber or Ambassador
            // if(userData.role == 'ambassador'){
                if(userData.referral_code === referral_code){
                    selfLinkedData.email = email;
                    selfLinkedData.referral_code = referral_code;
                // } else{
                    // selfLinkedData.email = email;
                // }
            } else {
                existingReferral = await Referral.findOne({
                    userId: userId,
                });
                //Check if user is assigned any referral code
                if(existingReferral){
                    emailExistedData.email = email;
                }
            }
        }
        

        if (Object.keys(selfLinkedData).length > 0) {
            selfLinkedDataArray.push(selfLinkedData);
          continue;
        }
        if (Object.keys(emailExistedData).length > 0) {
          emailExistedDataArray.push(emailExistedData);
          continue;
        }
        if (   Object.keys(incorrectData).length > 0) {
          incorrectDataArray.push(incorrectData);
          continue;
        }
  
        // If no incorrect or existing email found, add to valid entries
        validEntries.push({ email, referral_code, userId });
      }
  
      // Only create referral data if no errors exist
      if (incorrectDataArray.length === 0 && emailExistedDataArray.length === 0 && selfLinkedDataArray.length === 0) {
        for (const validEntry of validEntries) {
          const { referral_code, userId } = validEntry;

          const referralData = await Referral.create({
            referral_code: referral_code,
            userId: userId,
            is_active: true,
            is_linked_by_admin: true,
          });
  
          const createdReferralData = await referralData.save();
          allCreatedReferralData.push(createdReferralData);
        }
      }
  
      // Return the results
      if (incorrectDataArray.length > 0 || emailExistedDataArray.length > 0 || selfLinkedDataArray.length > 0) {
        console.log("incorrectDataArray", incorrectDataArray)
        console.log("emailExistedDataArray", emailExistedDataArray)
        console.log("selfLinkedDataArray", selfLinkedDataArray)
        return [
          { incorrectData: incorrectDataArray },
          { emailExistedData: emailExistedDataArray },
          { selfLinkedData: selfLinkedDataArray },
        ];
      } else {
        return allCreatedReferralData;
      }
  
    } catch (error) {
      console.error("Error:", error);
      return { status: 500, error: "Internal Server Error" };
    }
  };


async function editLinkedReferralCodeByAdmin(req) {
    try {  
      const incorrectData = {};
      const emailExistedData = {};
      const selfLinkedData = {};
  
        const { email, referral_code, old_email } = req.body;
        console.log("req.body", req.body);
  
        // Find user data in the database
        const userData = await User.findOne({
            email: email,
            role: { $in: ["subscriber", "ambassador"] },
            is_active: true
          }).select();
        const AmbassadorData = await User.findOne({ referral_code: referral_code, is_active: true }).select('is_active');

        // Check for incorrect email
        if (!userData) {
            incorrectData.email = email;
        }
        
        //Check if referral code is inactive or referral code does not exists
        if (AmbassadorData && AmbassadorData.is_active === false || AmbassadorData === null) {
            incorrectData.referral_code = referral_code;
        }
  
        // Proceed with further checks
        let userId = userData?._id;
        let existingReferral = '';
        const oldUserData = await User.findOne({
            email: old_email,
          }).select();
        // if(userData && userData.role !== oldUserData.role){
        if(userData){
            //Check if user is not Subscriber or Ambassador
            // if(userData.role == 'ambassador' || userData.referral_code === referral_code){
            if(userData.referral_code === referral_code){
                selfLinkedData.email = email;
            } else {
                existingReferral = await Referral.findOne({
                  userId: userId,
                //   purchagedcourseId: { $ne: null },
                });
                console.log("existingReferral", existingReferral)
                //Check if user is assigned any referral code
                if(existingReferral && existingReferral.purchagedcourseId !== null){
                    emailExistedData.email = email;
                }
            }
        }
        
        if (Object.keys(incorrectData).length > 0 || Object.keys(emailExistedData).length > 0 || Object.keys(selfLinkedData).length > 0) {
            return [{incorrectData: incorrectData} , {emailExistedData: emailExistedData}, {selfLinkedData: selfLinkedData}]
        } 
        
        // if(!existingReferral && userData.role !== oldUserData.role){
        if(!existingReferral){
            const referralData = await Referral.create({
                referral_code: referral_code,
                userId: userId,
                is_active: true,
                is_linked_by_admin: true,
              });
              const createdReferralData = await referralData.save();
              console.log("createdReferralData", createdReferralData);
              return [createdReferralData];
        } else {
            // if(existingReferral.purchagedcourseId === null){
                const response = await Referral.findOneAndUpdate(
                { userId: userId },
                { referral_code: referral_code },
                { new: true }
                );
                console.log("Edited records:", response);
                return [{editedData: response}];
            // }
        }
  
    } catch (error) {
      console.error("Error:", error);
      return { status: 500, error: "Internal Server Error" };
    }
  }
  
  
  /*****************************************************************************************/
  /*****************************************************************************************/
  /**
   * Get linked referral code by Admin
   *
   * @param {param}
   *
   * @returns Object|null
   */
  async function getLinkedReferralCodeByAdmin() {
    const query = {
        purchagedcourseId: { $eq: null },
        is_linked_by_admin: true
    };

    let referralData = await Referral.aggregate([
        {
            $match: query
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "referral_code",
                foreignField: "referral_code",
                as: "ambassador"
            }
        },
        {
            $project: {
                _id: 0,
                id_number: { $arrayElemAt: ["$subscriber._id", 0] },
                subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                subscriber_surname: { $arrayElemAt: ["$subscriber.surname", 0] },
                email: { $arrayElemAt: ["$subscriber.email", 0] },
                referral_code_used: "$referral_code",
                ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                ambassador_surname: { $arrayElemAt: ["$ambassador.surname", 0] },
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    return referralData;
};
  
  
  /*****************************************************************************************/
  /*****************************************************************************************/
  /**
   * Edit linked referral code by Admin
   *
   * @param {param}
   *
   * @returns Object|null
   */
//   async function editLinkedReferralCodeByAdmin(req) {
//     try {
//       const email = req.body.email;
//       const referral_code = req.body.referral_code;
//       console.log("Requested email: ", email);
  
//       const user = await User.find({ email: email }).select('_id');
//       const userId = user[0]._id;
//       console.log("user: ", user);
  
//       //Check referral code is Active or not
//       // const incorrectData = {};
//       const AmbassadorData = await User.findOne({ referral_code: referral_code }).select('is_active');
//         console.log("AmbassadorData", AmbassadorData);
  
//         if (AmbassadorData && AmbassadorData.is_active === false || AmbassadorData === null) {
//           // incorrectData.referral_code = referral_code;
//           const incorrectData = { referral_code: referral_code };
//           return { incorrectFields: incorrectData };
//         }
  
//       const response = await Referral.findOneAndUpdate(
//         {userId: userId},
//         {referral_code: referral_code},
//         { new: true }
//       );
  
//       console.log("Edited records:", response);
//       return response;
  
//     } catch (error) {
//       console.error("Error:", error);
//       return { status: 500, error: "Internal Server Error" };
//     }
//   }
  /*****************************************************************************************/
  /*****************************************************************************************/
  /**
   * Delete linked referral code by Admin
   *
   * @param {param}
   *
   * @returns Object|null
   */
  async function deleteLinkedReferralCodeByAdmin(req) {
    try {
      const emails = req.body.emails;
      console.log("Requested emails: ", emails);
  
      const users = await User.find({ email: { $in: emails } }).select('_id');
      const userIds = users.map(user => user._id);
  
      const response = await Referral.deleteMany({
        userId: { $in: userIds },
        is_linked_by_admin: true,
      });
  
      console.log("Deleted records:", response);
      return response;
  
    } catch (error) {
      console.error("Error:", error);
      return { status: 500, error: "Internal Server Error" };
    }
  }
  /*****************************************************************************************/
  /*****************************************************************************************/
  /**
   * Submit linked referral code by Admin
   *
   * @param {param}
   *
   * @returns Object|null
   */
  async function submitLinkedReferralCodesByAdmin(req) {
    try {
      console.log("submitLinkedReferralCodesByAdmin body: ", req.body);
  
      const users = req.body;
      const results = [];
  
      for (const user of users) {
        const { email, referral_code } = user;
  
        const userData = await User.findOne({ email: email }).select();
        const userId = userData._id;
        const purchasedCourseData = await Purchasedcourses.find({ userId: userId }).select();
        console.log("purchasedCourseData", purchasedCourseData)
        const purchasedCourseId = purchasedCourseData[0]._id;
  
        // Update referral data
        const response = await Referral.findOneAndUpdate(
          { userId: userId, referral_code: referral_code },
          { purchagedcourseId: purchasedCourseId },
          { new: true, sort: { createdAt: -1 } }
        );
  
        // console.log("Edited record for email:", email, response);
        results.push({ email, response: response || 'Referral not found or updated' });
      }
  
      return results;
  
    } catch (error) {
      console.error("Error:", error);
      return { status: 500, error: "Internal Server Error" };
    }
  };


/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Function for get daily subscription data update and accordingly change database
 * @param {param}
 * 
 * @result null|Object
 */
//This crone is to run every mid-night at 12:01 AM
cron.schedule('1 0 * * *', () => {
    getRegularSubscriptionDataUpdate();
    console.log('Successfully triggered');
});

// cron.schedule('*/2 * * * *', () => {
//     getRegularSubscriptionDataUpdate();
//     // getTestingOneRegularSubscriptionDataUpdate();
//   console.log('Successfully triggered');
// });

//For Stopping payment of one user
async function getTestingOneRegularSubscriptionDataUpdate() {
    try {
        const userId = "670ce3c027683aed4807ca9c";
        const orderId = "670ce41027683aed4807caaf";
        const token = "46729618-0afe-437e-8bcb-491dc293c497";
        const current_date = new Date();

        cancelPayfastSubscription(token, userId, orderId, current_date);
       
    } catch (error) {
        console.error("Error parsing merchantData for User ID:", payment.userid, error);
    }
};

async function getRegularSubscriptionDataUpdate() {
    try {
        const paymentData = await Subscriptionpayment.find({is_active: true})
          .select("userid merchantData")
          .exec();

        for (const payment of paymentData) {
            try {
                const parsedMerchantData = JSON.parse(payment.merchantData);
                const userId = payment.userid;
                const orderId = payment._id;
                const token = parsedMerchantData.token;
                const subscription_object = await getSubscriptionObject(token);
                const subscription_data = subscription_object;
                // console.log("subscription_object", subscription_object);

                let current_date = new Date();
                // let current_date = new Date('2024-10-04');
                current_date.setHours(0, 0, 0, 0);
                let due_date = new Date(subscription_data.run_date);
                due_date.setHours(0, 0, 0, 0);

                // Add 2 more days to the due date
                let extended_due_date = new Date(due_date);
                extended_due_date.setDate(due_date.getDate() + 2);

                if(current_date > extended_due_date) {
                    console.log(`Due date is ${due_date}`);
                    cancelPayfastSubscription(token, userId, orderId, due_date);
                } else {
                    console.log("Due date reached. Stopping loop.");
                    continue;
                }

            } catch (error) {
                console.error("Error parsing merchantData for User ID:", payment.userid, error);
            }
        }
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
};

async function getSubscriptionObject(subscription_token) {
    console.log("subscription_token", subscription_token);

    function generateTimestamp() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timezoneOffset = now.getTimezoneOffset();
      const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
      const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
      const offsetSign = timezoneOffset < 0 ? '+' : '-';
      const formattedOffset = `${offsetSign}${offsetHours}:${offsetMinutes}`;
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formattedOffset}`;
    }
  
    function generateSignature() {
      const data = {
        'date': new Date(),
        'merchant-id': process.env.PAYFAST_MERCHANT_ID,
        'passphrase': process.env.PAYFAST_PASSPHRASE,
        'timestamp': generateTimestamp(),
        'version': 'v1'
      };
  
      const orderedKeys = ['merchant-id', 'passphrase', 'timestamp', 'version'];
      let pfOutput = orderedKeys.map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`).join('&');
    //   console.log("signature String", pfOutput);
  
      const signature = crypto.createHash("md5").update(pfOutput).digest("hex");
    //   console.log("signature", signature);
      return signature;
    }
  
    try {
        const token = subscription_token;
        const merchantId = process.env.PAYFAST_MERCHANT_ID;
        const signature = generateSignature();
        const timestamp = generateTimestamp();
    
        // console.log("Merchant ID:", merchantId);
        // console.log("Signature:", signature);
        // console.log("Timestamp:", timestamp);
    
        const url = `https://api.payfast.co.za/subscriptions/${token}/fetch?testing=true`;
        // const url = `https://api.payfast.co.za/subscriptions/${token}/fetch`;
    
        const options = {
            headers: {
                'merchant-id': merchantId,
                'version': 'v1',
                'timestamp': timestamp,
                'signature': signature
            }
        };
    
        // console.log("Request URL:", url);
        // console.log("Request Options:", options);
    
        const response = await axios.get(url, options);
        console.log("Request response:", response.data.data.response);
  
        return response.data.data.response;
    } catch (err) {
        if (err.response) {
            console.error("Response data:", err.response.data);
            console.error("Response status:", err.response.status);
            console.error("Response headers:", err.response.headers);
        } else if (err.request) {
            console.error("Request data:", err.request);
        } else {
            console.error("Error message:", err.message);
        }
        console.error("Config:", err.config);
        throw err;
    }
  };

  async function cancelPayfastSubscription(token, userId, orderId, due_date) {
    console.error("cancelPayfastSubscription is working");
    console.error("token", token);
    console.error("userId", userId);
    console.error("orderId", orderId);
    const token_generated = token; 
      
    function generateTimestamp() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timezoneOffset = now.getTimezoneOffset();
      const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
      const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
      const offsetSign = timezoneOffset < 0 ? '+' : '-';
      const formattedOffset = `${offsetSign}${offsetHours}:${offsetMinutes}`;
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formattedOffset}`;
    }
  
    function generateSignature() {
      const data = {
          'merchant-id': process.env.PAYFAST_MERCHANT_ID,
          'passphrase': process.env.PAYFAST_PASSPHRASE,
          'timestamp': generateTimestamp(),
          'version': 'v1'
      };
  
      const orderedKeys = ['merchant-id', 'passphrase', 'timestamp', 'version'];
      let pfOutput = orderedKeys.map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`).join('&');
      console.log("signature String", pfOutput);
  
      const signature = crypto.createHash("md5").update(pfOutput).digest("hex");
      console.log("signature", signature);
      return signature;
    }
  
    try {
        const token = token_generated;
        const merchantId = process.env.PAYFAST_MERCHANT_ID;
        const signature = generateSignature();
        const timestamp = generateTimestamp();
    
        console.log("Merchant ID:", merchantId);
        console.log("Signature:", signature);
        console.log("Timestamp:", timestamp);
    
        const url = `https://api.payfast.co.za/subscriptions/${token}/cancel?testing=true`;
        // const url = `https://api.payfast.co.za/subscriptions/${token}/cancel`;
        const version = 'v1';
    
        const options = {
            headers: {
                'merchant-id': merchantId,
                'version': version,
                'timestamp': timestamp,
                'signature': signature
            }
        };
    
        console.log("Request URL:", url);
        console.log("Request Options:", options);
    
        const response = await axios.put(url, null, options);
        console.log("Request response:", response);
  
        if (response.status === 200) {
            console.log("Cancellation successful.");
            cancelSubscription(userId, orderId, due_date);
        } else {
            console.error("Cancellation failed:", response.data);
        }
    } catch (err) {
        if (err.response) {
            console.error("Response data:", err.response.data);
            console.error("Response status:", err.response.status);
            console.error("Response headers:", err.response.headers);
        } else if (err.request) {
            console.error("Request data:", err.request);
        } else {
            console.error("Error message:", err.message);
        }
        console.error("Config:", err.config);
        throw err;
    }
  };

  async function handleMoodleUserDeletion(moodle_login_id) {
    const MOODLE_URL = process.env.MOODLE_COURSES_URL;
    const MOODLE_TOKEN = process.env.MOODLE_TOKEN;
    const MOODLE_DELETE_FUNCTION = 'core_user_delete_users';
  
    console.log('MOODLE_URL', MOODLE_URL);
    console.log('MOODLE_TOKEN', MOODLE_TOKEN);
    console.log('moodle_login_id', moodle_login_id);
  
    try {
      const response = await axios.post(MOODLE_URL, null, {
        params: {
          wstoken: MOODLE_TOKEN,
          moodlewsrestformat: 'json',
          wsfunction: MOODLE_DELETE_FUNCTION,
          userids: [moodle_login_id],
        },
      });
  
      console.log('User deleted successfully:', response.data);
    } catch (error) {
      console.error('Error deleting user:', error.response ? error.response.data : error.message);
    }
  };
  
  async function cancelSubscription(user_id, order_id, due_date) {
    console.error("cancelCourseByUser is working");
    console.log("userId", user_id);  
    console.log("order_id", order_id);  
    try {
      const orderId = order_id;
      const userId = user_id;

    // Update subcription(Course) status the user on stopped payment by Subscriber
      const updateCourseStatus = await Subscriptionpayment.findOneAndUpdate(
        { _id: orderId },
        {is_active: false},
        { new: true }
      );

      //Update User status on stopped payment by Subscriber
      const userBlocked = await User.findOneAndUpdate(
        { _id: userId },
        {is_active: false, subscription_stopped_payment_date: due_date},
        { new: true }
      );
      console.log("userBlocked successfully:", userBlocked);

      //Update Purchasedcourses status on stopped payment by Subscriber
      const courseData = await Purchasedcourses.findOneAndUpdate(
        { orderid: orderId },
        {is_active: false},
        { new: true }
      );
      console.log("updatePurchagedCourses successfully:", courseData);
  
      //For Changing status of Referral code used on stopped payment by Subscriber
      const isCourseExisted = await Referral.find({ purchagedcourseId: courseData._id }).exec();
      if(isCourseExisted ){
          const referralStatus = await Referral.findOneAndUpdate(
              { purchagedcourseId: courseData._id },
              {is_active: false},
              { new: true }
              );
        console.log("referral status changed successfully:", referralStatus);
      };

      if (userBlocked.moodle_login_id != null) {
        handleMoodleUserDeletion(userBlocked.moodle_login_id);
    };
    
      //For Brevo email to SUBSCIBER, when stopped payment by Subscriber
    const receiverName = `${userBlocked.firstname} ${userBlocked.surname}`;
    const receiverEmail = userBlocked.email;
    let sendEmail;
    sendEmail = await commonService.sendEmailByBrevo(49, receiverEmail, receiverName);
      if(userBlocked.role === "ambassador"){
        if(sendEmail){
            await commonService.deleteContactBrevo(receiverEmail);
        }
      };
  
      //For Brevo email to AMBASSADOR, when stopped payment by Subscriber
      if(userBlocked.role !== "ambassador"){
        const existingReferral = await Referral.findOne({ userId: userId });
        console.log("existingReferral", existingReferral);
        if (existingReferral) {
          const referralCode = existingReferral.referral_code;
          const ambassadorData = await User.find({ referral_code: referralCode }).select("email firstname surname");
          console.log("ambassadorData", ambassadorData);
            
          const subscriber_firstname = userBlocked.firstname;
          const subscriber_lastname = userBlocked.surname;
          const variables = {
            SUBSCRIBER_FIRSTNAME: subscriber_firstname,
            SUBSCRIBER_LASTNAME: subscriber_lastname
          }
          const ambassadorName = ambassadorData[0].firstname + " " + ambassadorData[0].surname;
          const receiverEmail = ambassadorData[0].email;
          await commonService.sendUpdatedContactEmailByBrevo(38, receiverEmail, ambassadorName, variables, subscriber_firstname, subscriber_lastname);
        };  
      }
  
    } catch (err) {
      console.log("Error:", err);
      throw err;
    }
  };

/*****************************************************************************************/
/*****************************************************************************************/
// This code is for testing purpose

// cron.schedule('*/1 * * * *', () => {
//     cancelPayfastPayment();
//     console.log('Successfully triggered');
// });

const getPaymentDetails = async (paymentId) => {
    const data = {
      'merchant_id': '25096247',
      'merchant_key': 'ajvkteanjqdig',
      'payment_id': paymentId
    };
    // const url = 'https://api.payfast.co.za/eng/query/merchant';
    const url = 'https://api.payfast.co.za/subscriptions';
    
    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
  
      if (response.data && response.data.subscription_token) {
        // You can access the subscription token here
        console.log('Subscription Token:', response.data);
        console.log('Subscription Token:', response.data.subscription_token);
      } else {
        console.log('No subscription token found');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };


  async function cancelPayfastPayment() {
    const token_generated = "99d7164c-8c59-457d-8b3f-84dfa157393d"; 
      
    function generateTimestamp() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timezoneOffset = now.getTimezoneOffset();
      const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
      const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
      const offsetSign = timezoneOffset < 0 ? '+' : '-';
      const formattedOffset = `${offsetSign}${offsetHours}:${offsetMinutes}`;
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formattedOffset}`;
    }
  
    function generateSignature() {
      const data = {
          'merchant-id': process.env.PAYFAST_MERCHANT_ID,
          'passphrase': process.env.PAYFAST_PASSPHRASE,
          'timestamp': generateTimestamp(),
          'version': 'v1'
      };
  
      const orderedKeys = ['merchant-id', 'passphrase', 'timestamp', 'version'];
      let pfOutput = orderedKeys.map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`).join('&');
      console.log("signature String", pfOutput);
  
      const signature = crypto.createHash("md5").update(pfOutput).digest("hex");
      console.log("signature", signature);
      return signature;
    }
  
    try {
        const token = token_generated;
        const merchantId = process.env.PAYFAST_MERCHANT_ID;
        const signature = generateSignature();
        const timestamp = generateTimestamp();
    
        console.log("Merchant ID:", merchantId);
        console.log("Signature:", signature);
        console.log("Timestamp:", timestamp);
    
        // const url = `https://api.payfast.co.za/subscriptions/${token}/cancel?testing=true`;
        const url = `https://api.payfast.co.za/subscriptions/${token}/cancel`;
        const version = 'v1';
    
        const options = {
            headers: {
                'merchant-id': merchantId,
                'version': version,
                'timestamp': timestamp,
                'signature': signature
            }
        };
    
        console.log("Request URL:", url);
        console.log("Request Options:", options);
    
        const response = await axios.put(url, null, options);
        console.log("Request response:", response);
  
        if (response.status === 200) {
            console.log("Cancellation successful.");
            return response.data;
        } else {
            console.error("Cancellation failed:", response.data);
            return response.data;
        }
    } catch (err) {
        if (err.response) {
            // The request was made and the server responded with a status code
            console.error("Response data:", err.response.data);
            console.error("Response status:", err.response.status);
            console.error("Response headers:", err.response.headers);
        } else if (err.request) {
            // The request was made but no response was received
            console.error("Request data:", err.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error message:", err.message);
        }
        console.error("Config:", err.config);
        throw err;
    }
  };

  