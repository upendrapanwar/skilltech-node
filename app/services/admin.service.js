/**
 * File Name: Admin Service
 * 
 * Description: Manages login,signup and all admin operations
 * 
 * Author: Skill Tech
 */

const config = require('../config/index'); 
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
                select: 'firstname surname referral_code ambassador_date',
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
                select: 'firstname surname',
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
            payment_status: 'cancel' 
        };

        if (param && param.start_date && param.end_date) {
            query.createdAt = { $gte: new Date(param.start_date), $lte: new Date(param.end_date) };
        }

        let defaultAmbassador = await Subscriptionpayment.find(
            query,
            {
                is_active: 1,   
                payment_status: 1,
                userid: 1
            }
        ).sort({ createdAt: -1 })
        .populate({
                path: 'userid',
                model: User,
                match: { role: 'ambassador' },
                select: 'role firstname surname referral_code'
            });

        console.log("Defaulted Subscriptions Payments of Ambassador", defaultAmbassador);
        const result = defaultAmbassador.filter(entry => entry.userid !== null).map(data => ({
            Ambassador_firstname: data.userid.firstname,
            Ambassador_lastname: data.userid.surname,
            referral_code: data.userid.referral_code,
            payment_status: data.payment_status
        }));
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


async function getDefaultedSubscriptionPaymentOfSubscribers(param) {
    try {
        console.log("param", param)
        console.log("getDefaultedSubscriptionPaymentOfSubscribers")
        let query = {
            payment_status: 'cancel'
        };

        if (param && param.start_date && param.end_date) {
            query.createdAt = { $gte: new Date(param.start_date), $lte: new Date(param.end_date) };
        }

        let defaultSubscribers = await Subscriptionpayment.find(
            query,
            {
                is_active: 1,
                payment_status: 1,
                userid: 1
            }
        ).sort({ createdAt: -1 })
        .populate({
                path: 'userid',
                model: User,
                match: { role: 'subscriber' },
                select: 'role firstname surname'
            });

        console.log("Defaulted Subscriptions Payments of Subscriber", defaultSubscribers)
        
        const result = defaultSubscribers.filter(entry => entry.userid !== null).map(data => ({
            Subscriber_firstname: data.userid.firstname,
            Subscriber_lastname: data.userid.surname,
            payment_status: data.payment_status
        }));

        if (result) {
            return result;
        } else {
            return null;
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
                        // $gte: new Date(param.start_date),
                        // $lte: new Date(param.end_date)
                    }
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
          .select('firstname surname referral_code')
          .exec();

        const result = ambassadorData.reduce((acc, data) => {
            const referralCount = ambassadors.filter(referral => referral.referral_code === data.referral_code).length;
            const amountDue = referralCount * 5;
            acc.push({
                Ambassador_firstname: data.firstname,
                Ambassador_lastname: data.surname,
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
                .select('firstname surname email referral_code account_holder_name account_number type_of_account branch_code')
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
                recipient_acount_type: data.type_of_account || 'N/A',
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
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }

        const userData = await User.find(query)
          .select("firstname surname id_number email mobile_number alternate_mobile_number province race gender bank account_number account_holder_name type_of_account bank_proof certificate role is_active referral_code")
          .exec();
        
        // Filter out the user with email 'admin@gmail.com'
        const filteredUserData = userData.filter(data => data.email !== 'admin@gmail.com');

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
            unsubscribe_status: data.is_active ? 'Y' : 'N',
            stopped_payment_status: 'N',
        }));

        console.log(result);
        return result;
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
}
