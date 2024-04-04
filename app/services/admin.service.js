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
        let query = {};

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
                    sort: { createdAt: 1 } // Adjust the sorting options as needed
                }
            })
            .exec();

        console.log("activeSubscribedAmbassadors TEST 1st", activeSubscribedAmbassadors);
        
        if (activeSubscribedAmbassadors.length > 0) {
            // Extract required fields and map them to a new array of objects
            const result = activeSubscribedAmbassadors.map(data => {
                const user = data.userId;
                if (!user) {
                    return null; // Skip this entry if userId is null
                }
                return {
                    firstname: user.firstname,
                    surname: user.surname,
                    referral_code: user.referral_code,
                    ambassador_date: user.ambassador_date,
                    subscription_status: data.is_active ? 'Active' : 'Inactive',
                    subscription_date: data.createdAt
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
        let query = {};

        if (param && param.start_date && param.end_date) {
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }

        const activeSubscribedAmbassadors = await Purchasedcourses.find(query)
            .populate({
                path: 'userId',
                match: { role: 'subscriber' },
                select: 'firstname surname',
                options: {
                    sort: { createdAt: 1 } // Adjust the sorting options as needed
                }
            })
            .exec();

        console.log("activeSubscribedAmbassadors TEST 1st", activeSubscribedAmbassadors);
        
        if (activeSubscribedAmbassadors.length > 0) {
            const result = activeSubscribedAmbassadors.map(data => {
                const user = data.userId;
                if (!user) {
                    return null;
                }
                return {
                    firstname: user.firstname,
                    surname: user.surname,
                    subscription_status: data.is_active ? 'Active' : 'Inactive',
                    subscription_date: data.createdAt
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
    console.log("param", param)
    console.log("getAllDefaultedSubscriptionPaymentOfAmbassador")
    
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

    console.log("Defaulted Subscriptions Payments of Ambassador TEST 3rd", defaultAmbassador)

    if (defaultAmbassador && defaultAmbassador.length > 0) {
        return defaultAmbassador;
    } else {
        return null;
    }
}


async function getDefaultedSubscriptionPaymentOfSubscribers(param) {

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

    console.log("Defaulted Subscriptions Payments of Subscriber TEST 4th", defaultSubscribers)

    if (defaultSubscribers) {
        return defaultSubscribers;
    } else {
        return null;
    }
}

/**
 * get all data Cancellation of Subscriptions – Cancelled by Ambassador
 * @param {param}
 * @return null|Object 
 */
async function getSubscriptionCancelledByAmbassador(param) {
    let query = {
        is_active: false,
    };

    if (param && param.start_date && param.end_date) {
        query.cancellation_date = { $gte: new Date(param.start_date), $lte: new Date(param.end_date) };
    }
    let cancleByAmbassador = await Purchasedcourses.find(
    query, 
    {
        cancellation_date: 1,
        is_active: 1,
        userId: 1,
    }
    ).sort({ cancellation_date: -1 })
        .populate({
            path: 'userId',
            model: User,
            match: { role: 'ambassador'},
            select: 'role firstname surname referral_code'
        })

    console.log("getSubscriptionCancelledByAmbassador.......", cancleByAmbassador);

    if (cancleByAmbassador) {
        return cancleByAmbassador;
    } else {
        return null;
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
    let query = {
        is_active: false,
    };

    if (param && param.start_date && param.end_date) {
        query.cancellation_date = { $gte: new Date(param.start_date), $lte: new Date(param.end_date) };
    }
    let cancelledBySubscriber = await Purchasedcourses.find(
    query, 
    {
        cancellation_date: 1,
        is_active: 1,
        userId: 1,
    }
    ).sort({ cancellation_date: -1 })
        .populate({
            path: 'userId',
            model: User,
            match: { role: 'subscriber'},
            select: 'role firstname surname'
        })

    console.log("getSubscriptionCancelled.......", cancelledBySubscriber);

    if (cancelledBySubscriber) {
        return cancelledBySubscriber;
    } else {
        return null;
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
                Ambassador_referralcode: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
                HVG_Subscription_status: {
                    $cond: {
                        if: { $ne: ["$purchagedcourseId", null] },
                        then: "Active",
                        else: "Inactive"
                    }
                }
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    return referralData;
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
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                Ambassador_referralcode: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
                HVG_Subscription_status: {
                    $cond: {
                        if: { $ne: ["$purchagedcourseId", null] },
                        then: "Active",
                        else: "Inactive"
                    }
                }
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    return referralData;
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
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                Ambassador_referralcode: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    return referralData;
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
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                Ambassador_referralcode: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    return referralData;
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
                purchagedcourseId: null, 
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
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                Ambassador_referralcode: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    return referralData;

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
                purchagedcourseId: null, 
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
            $project: {
                _id: 0,
                Subscriber_firstname: { $arrayElemAt: ["$subscriber.firstname", 0] },
                Subscriber_lastname: { $arrayElemAt: ["$subscriber.surname", 0] },
                Ambassador_referralcode: "$referral_code",
                Ambassador_firstname: { $arrayElemAt: ["$ambassador.firstname", 0] },
                Ambassador_lastname: { $arrayElemAt: ["$ambassador.surname", 0] },
                Date_of_use_of_referral_code: "$createdAt",
            }
        },
        { $sort: { "createdAt": 1 } }
    ]).exec();

    return referralData;

}
/**
 * Function get Inactive Referrals per Ambassador by date selection
 * @param {param}
 * 
 * @result null|Object
 */
// async function getPaymentDueToAmbassador(param) {
//     try {
//         let query = {};
    
//         if (param && param.start_date && param.end_date) {
//             query.createdAt = {
//                 $gte: new Date(param.start_date),
//                 $lte: new Date(param.end_date)
//             };
//         }
//         const ambassadors = await Referral.find(query);
//         console.log("ambassadors", ambassadors);
//         const referrals = ambassadors.map(referral => referral.referral_code);
//         console.log("referrals", referrals);
//         const ambassadorData = await User.find({
//             referral_code: { $in: referrals },
//           })
//           .select('firstname surname referral_code')
//           .exec();

//         const activeReferralCount = ambassadorData.length;
//         const amountDue = activeReferralCount * 5000;
//         console.log("activeReferral", ambassadorData);
        
//         if (ambassadorData.length > 0) {
//             const result = ambassadorData.map(data => {
//                 return {
//                     Ambassador_firstname: data.firstname,
//                     Ambassador_lastname: data.surname,
//                     Ambassador_referralcode: data.referral_code,
//                     referral_count: activeReferralCount,
//                     due_amount: amountDue,
//                 };
//             }).filter(entry => entry !== null);
//             console.log(result);
//             return result;
//         } else {
//             return [];
//         }
//     } catch (error) {
//         console.error('An error occurred:', error);
//         throw error;
//     }

// }
async function getPaymentDueToAmbassador(param) {
    try {
        let query = {};
    
        if (param && param.start_date && param.end_date) {
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }
        const ambassadors = await Referral.find(query);
        console.log("ambassadors", ambassadors);
        const referralsSet = new Set(ambassadors.map(referral => referral.referral_code));
        const referrals = Array.from(referralsSet);
        console.log("referrals", referrals);
        const ambassadorData = await User.find({
            referral_code: { $in: referrals },
          })
          .select('firstname surname referral_code')
          .exec();

        const result = ambassadorData.reduce((acc, data) => {
            const referralCount = ambassadors.filter(referral => referral.referral_code === data.referral_code).length;
            const amountDue = referralCount * 5000;
            acc.push({
                Ambassador_firstname: data.firstname,
                Ambassador_lastname: data.surname,
                Ambassador_referralcode: data.referral_code,
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
        const ambassadors = await Referral.find();
        console.log("ambassadors", ambassadors);
        const referralsSet = new Set(ambassadors.map(referral => referral.referral_code));
        const referrals = Array.from(referralsSet);
        console.log("referrals", referrals);
        const ambassadorData = await User.find()
          .select('firstname surname email referral_code account_holder_name account_number type_of_account branch_code')
          .exec();
          console.log("ambassadorData", ambassadorData);
        const result = ambassadorData.reduce((acc, data) => {
            const referralCount = ambassadors.filter(referral => referral.referral_code === data.referral_code).length;
            const amountDue = referralCount * 5000;
            acc.push({
                // recipient_name: account_holder_name || 'N/A',
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