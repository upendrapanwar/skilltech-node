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
const { User, Subscriptionpayment, Purchasedcourses, Referral } = require('../helpers/db');
const crypto = require("crypto");
const { unsubscribe } = require('diagnostics_channel');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const cron = require('node-cron');
const axios = require('axios');

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
            const amountDue = referralCount * 5;
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
            const amountDue = referralCount * 5;
            acc.push({
                recipient_name: `${data.firstname} ${data.surname}`,
                recipient_account: data.account_number || 'N/A',
                // recipient_acount_type: data.type_of_account || 'N/A',
                recipient_acount_type: '1',
                branch_code: data.branch_code || 'N/A',
                amount: amountDue ? amountDue : '0',
                own_reference: data.referral_code || 'N/A',
                recipient_reference: 'High Vista Guild',
                email_1_notify: `${data.firstname} ${data.surname}`,
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
        let query = {};
        if (param && param.start_date && param.end_date) {
            query.subscription_date = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }

        const userData = await User.find(query)
            .select("firstname surname id_number email mobile_number alternate_mobile_number province race gender bank account_number account_holder_name type_of_account bank_proof certificate role is_active referral_code subscription_date subscription_cancellation_date subscription_stopped_payment_date")
            .exec();

        console.log("userData", userData);

        // Filter out admin users
        const filteredData = userData.filter(data => data.role !== 'admin');

        // Use Promise.all to handle async operations inside map
        const filteredUserData = await Promise.all(filteredData.map(async data => {
            // Fetch referral data for linked ambassador
            const referralData = await Referral.find({ userId: data._id }).select("referral_code").exec();
            console.log("referralData for linked referral", referralData);
            
            // Add linked ambassador referral if found
            if (referralData && referralData.length > 0) {
                data.linked_ambassador_referral = referralData[0].referral_code;
            } else {
                data.linked_ambassador_referral = 'none';
            }
            return data;
        }));

        // Helper function to format dates
        const formatDate = (dateString) => {
            if (dateString !== null) {
                const date = new Date(dateString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
            }
            return 'none';
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
            role: data.role === 'ambassador' ? 'Ambassador' : 'Subscriber',
            is_active: data.is_active ? 'Active' : 'Inactive',
            referral_code: data.referral_code || 'none',
            linked_to_ambassador_status: data.linked_ambassador_referral !== 'none' ? 'Y' : 'N',
            linked_ambassador_referral: data.linked_ambassador_referral || 'none',
            date_of_subscription: formatDate(data.subscription_date),
            unsubscribe_status: data.is_active ? 'N' : 'Y',
            unsubscribed_date: formatDate(data.subscription_cancellation_date),
            stopped_payment_status: data.subscription_stopped_payment_date ? 'Y' : 'N',
            stopped_payment_date: formatDate(data.subscription_stopped_payment_date),
        }));

        return result;
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
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
//     // getRegularSubscriptionDataUpdate();
//     getTestingOneRegularSubscriptionDataUpdate();
//   console.log('Successfully triggered');
// });

//For Stopping payment of one user
async function getTestingOneRegularSubscriptionDataUpdate() {
    try {
        const userId = "66fd13afb343a6ddff255930";
        const orderId = "66fd27e72132357f29361229";
        const token = "00cb7c64-cb22-46dc-9327-89e8b8be3f09";
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

                if(current_date > due_date) {
                    console.log(`Due date is ${due_date}`);
                    cancelPayfastSubscription(token, userId, orderId, due_date);
                } else {
                    console.log("Due date reached. Stopping loop.");
                    break;
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
    
        // const url = `https://api.payfast.co.za/subscriptions/${token}/fetch?testing=true`;
        const url = `https://api.payfast.co.za/subscriptions/${token}/fetch`;
    
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

//   cron.schedule('*/1 * * * *', () => {
//     (async () => {
//         try {
//             let sendEmail;
//             sendEmail = await commonService.sendEmailByBrevo(49, 'eynoashish@gmail.com', 'ashish');
//             if(sendEmail){
//                 await commonService.deleteContactBrevo('eynoashish@gmail.com');
//             }
//             console.log("sendEmail", sendEmail);
//         } catch (error) {
//           console.error("Error:", error);
//         }
//       })();
//   console.log('Successfully triggered');
// });


/*****************************************************************************************/
/*****************************************************************************************/