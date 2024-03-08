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
    
    reportActiveSubcribedAmbassadors,
    reportActiveSubcribedSubscribers,
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
 * get all Active subscriptions of Ambassadors 
 * @param {param}
 * 
 * @return null|Object
 */

// TEST 1st Active Subcripton of Ambassador
async function getAllActiveSubcribedAmbassadors(param) {
    if (!param) {
        return null;
    }

    const activeSubscribedAmbassadors = await User.find({
        role: "ambassador",
        subscription_date: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
    }, {
        firstname: 1,
        surname: 1,
        subscription_date: 1,
        referral_code: 1,
        ambassador_date: 1,
    })

        // console.log("activeSubscribedAmbassadors", activeSubscribedAmbassadors)
        .sort({ subscription_date: -1 }).exec();

    console.log("activeSubscribedAmbassadors TEST 1st", activeSubscribedAmbassadors);
    if (activeSubscribedAmbassadors) {
        return activeSubscribedAmbassadors;
    } else {
        return null;
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
// TEST 2nd Active Subscription of Subscriber
async function getAllActiveSubscriptionSubscriber(param) {

    if (!param) {
        return null;
    }

    let subscriber = await User.find({
        role: 'subscriber',
        subscription_date: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
    },
        {
            firstname: 1,
            surname: 1,
            subscription_date: 1
        }
    ).sort({ subscription_date: -1 }).exec();

    console.log("getAllActiveSubscriptionSubscriber TEST 2nd ", subscriber)

    if (subscriber) {
        return subscriber;
    } else {
        return null;
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
    if (!param) {
        return null;
    }

    let defaultAmbassador = await Subscriptionpayment.aggregate([
        {
            $match: {
                payment_status: 'cancel payment',
                createdAt: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userid",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $match: { "user.role": "ambassador" }
        },
        {
            $project: {
                _id: 0,
                ambassador_firstname: "$user.firstname",
                ambassador_lastname: "$user.surname",
                ambassador_referral_code: "$user.referral_code",
                payment_failure_reason: "$payment_status"
            }
        },
        { $sort: { createdAt: -1 } },
    ]);

    console.log("Defaulted Subscriptions Payments of Ambassador TEST 3rd", defaultAmbassador)

    if (defaultAmbassador.length > 0) {
        return defaultAmbassador;
    } else {
        return null;
    }
}


// async function getDefaultedSubscriptionPaymentOfAmbassador(param) {
//     console.log("param", param)
//     console.log("getAllDefaultedSubscriptionPaymentOfAmbassador")
//     if (!param) {
//         return null;
//     }

//     let defaultAmbassador = await Subscriptionpayment.find({
//         payment_status: 'cancel payment',
//         createdAt: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
//     }, {
//         is_active: 1,
//         payment_status: 1,
//         userid: 1
//     }
//     ).sort({ createdAt: -1 })
//         .populate({
//             path: 'userid',
//             model: User,
//             match: { role: 'ambassador' },
//             select: 'role firstname surname'
//         });

//     console.log("Defaulted Subscriptions Payments of Ambassador TEST 3rd", defaultAmbassador)

//     if (defaultAmbassador) {
//         return defaultAmbassador;
//     } else {
//         return null;
//     }
// }

// TEST 4th Defaulted Subscriptions Payments of Subscribers
async function getDefaultedSubscriptionPaymentOfSubscribers(param) {

    console.log("param", param)
    console.log("getDefaultedSubscriptionPaymentOfSubscribers")
    if (!param) {
        return null;
    }

    // let defaultSubscribers = await User.find({
    //     role: "ambassador",
    //     subscription_date: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
    // },
    //     {
    //         firstname: 1,
    //         surname: 1,
    //         subscription_date: 1,
    //         referral_code: 1,
    //         payment_failure_reason: 1
    //     }
    // ).sort({ subscription_date: -1 })
    // // .exec()

    // // .populate({
    // //     path: '_id',
    // //     model: Subscriptionpayment,
    // //     select: ('payment_status is_active')
    // // })

    let defaultSubscribers = await Subscriptionpayment.find({
        payment_status: 'cancel payment',
        createdAt: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
    }, {
        is_active: 1,
        payment_status: 1,
        userid: 1
    }
    ).sort({ createdAt: -1 })
        // .exec()
        .populate({
            path: 'userid',
            model: User,
            match: { role: 'subscriber' },
            select: 'role firstname surname'
        });

    console.log("Defaulted Subscriptions Payments of Ambassador TEST 4th", defaultSubscribers)

    if (defaultSubscribers) {
        return defaultSubscribers;
    } else {
        return null;
    }
}

// TEST 5th 
/**
 * get all data Cancellation of Subscriptions – Cancelled by Ambassador
 * @param {param}
 * @return null|Object 
 */
async function getSubscriptionCancelledByAmbassador(param) {
    if (!param) {
        return null;
    }

    // let cancelledUser = await User.find({
    //     role: 'ambassador',
    //     // subscription_cancellation_date: { $gte: new Date(param.start_date), $lte:new Date(param.end_date)}
    // },
    //     {
    //         firstname: 1,
    //         surname: 1,
    //         referral_code: 1,
    //         // subscription_cancellation_date:1
    //     }).sort({ createdAt: -1 })
    //     .exec();

    let cancleByAmbassador = await Purchasedcourses.find({
        is_active: false,
        createdAt: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
    }, {

        cancellation_date: 1,
        is_active: 1,
        userId: 1,
    }
    ).sort({ createdAt: -1 })
        .populate({
            path: 'userId',
            model: User,
            match: { role: 'ambassador'},
            select: 'role firstname surname'
        })

    console.log("getSubscriptionCancelledByAmbassador.......", cancleByAmbassador);

    if (cancleByAmbassador) {
        return cancleByAmbassador;
    } else {
        return null;
    }
}


// TEST 6th 
/**
 * get all data Cancellation of Subscriptions – Cancelled by subscribers
 * 
 * @param {param}
 * @return null|Object 
 * 
 */
async function getSubscriptionCancelledBySubscriber(param) {
    if (!param) {
        return null;
    }

    // let cancelledUser = await User.find({
    //     role: 'subscriber',
    //     // subcription:true,
    //     // subscription_cancellation_date: { $gte: new Date(param.start_start), $lte:new Date(param.end_date)}
    // },
    //     {
    //         firstname: 1,
    //         surname: 1,
    //         // subscription_cancellation_date:1
    //     }).sort({ createdAt: -1 })
    //     .exec();

    // console.log(cancelledUser);

    let cancleBySubscriber = await Purchasedcourses.find({
        is_active: false,
        createdAt: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
    }, {
        cancellation_date: 1,
        is_active: 1,
        userId: 1,
    }
    ).sort({ createdAt: -1 })
        .populate({
            path: 'userId',
            model: User,
            match: { role: 'subscriber' },
            select: 'role firstname surname'
        })

    console.log("Cancellation of Subscriptions", cancleBySubscriber)

    if (cancleBySubscriber) {
        return cancleBySubscriber;
    } else {
        return null;
    }
}




/**
 * get Active subscriptions of Ambassadors for report 
 * @param {param}
 * 
 * @return null|Object
 */
async function reportActiveSubcribedAmbassadors(param) {
    if (!param) {
        return null;
    }

    const activeSubscribedAmbassadors = await User.find({
        role: "ambassador",
        //subscription_date: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
    }, {
        firstname: 1,
        surname: 1,
        subscription_date: 1,
        referral_code: 1,
        ambassador_date: 1,
    })
        .sort({ subscription_date: -1 }).exec();
    // .sort({ subscription_date: -1 }).limit(10).exec();

    console.log(activeSubscribedAmbassadors);
    if (activeSubscribedAmbassadors) {
        return activeSubscribedAmbassadors;
    } else {
        return null;
    }

}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * get all Active subscriptions of Ambassadors for report 
 * @param {param}
 * 
 * @return null|Object
 */
// async function reportAllActiveSubcribedAmbassadors(param) {

//     if (!param) {
//         return null;
//     }

//     const activeSubscribedAmbassadors = await User.find({
//         role: "ambassador",
//         //subscription_date: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
//     }, {
//         firstname: 1,
//         surname: 1,
//         subscription_date: 1,
//         referral_code: 1,
//         ambassador_date: 1,
//     })
//         .sort({ subscription_date: -1 }).exec();

//     console.log(activeSubscribedAmbassadors);
//     if (activeSubscribedAmbassadors) {
//         return activeSubscribedAmbassadors;
//     } else {
//         return null;
//     }

// }


/**
 * get all Active subscriptions of Subscribers reports
 *  `
 * @param {param}
 *
 * @return null|Object
 * 
 */
async function reportActiveSubcribedSubscribers(param) {
    if (!param) {
        return null;
    }

    let subscriber = await User.find({
        role: 'subscriber',
        //subscription_date: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) } 
    },
        {
            firstname: 1,
            surname: 1,
            subscription_date: 1
        }
    ).sort({ subscription_date: -1 }).exec();

    console.log("reportActiveSubcribedSubscribers", subscriber)

    if (subscriber) {
        return subscriber;
    } else {
        return null;
    }

}



/**
 * get all data of  defaulled payment of  subscriptions Subscribers 
 *  
 * @param {param}
 * @return null|Object 
 * 
 */
// async function defaultedSubscriptionPaymentOfSubscriber(param) {
//     if (!param) {
//         return null;
//     }

//     const subscribers = await User.find({
//         role: 'subscriptioin',
//         subscription: true,
//         cardPayment: "failed",
//         subscription_cencellation_date: { $gte: new Date(param.start_date), $lte: new Date(param.end_date) }
//     })
//         .sort({ createdAt: 1 })
//         .select('fristname, surname,payment_failure_reason')
//         .exec();

//     if (subscribers) {
//         return scrollToubscribers;
//     } else {
//         return null;
//     }
// }







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

// /**
//  * Function for get all data about Payment due to Ambassador – Current Month
//  * @param {param}
//  * @result null|Object
//  */
// async function ambassadorPaymentsCurrentMonth(param) {
//     if (!param) {
//         return null;
//     }

//     let startDate = param.startDate;
//     let endDate = param.endDate;

//     let ambassador = await User.find({
//         where: {
//             role: 'ambassador',
//             subscription: true,
//             updateAt: { $gte: startDate, $lte: endDate }
//         }
//     }).select('firstname, lastname, referral_code, ')
// }


// /**
//  * Function for  getting Defaulted Subscriptions Payments of Subscribers who used referral_code
//  * @param {param}
//  * 
//  * @result null | Object
//  */
// async function getAllDefaultedPaymentOfSubscribersWhoUsedReferralCode(param) {
//     if (!param) {
//         return null;
//     }

//     let subscriber = await User.find({
//         where: {
//             subscription: true,
//             role: subscription,
//         }
//     }).select('firstname, lastname, payment_failure_reason').sort({ updateAt: 'asc' }).exec;

//     if (subscriber) {
//         return subscriber;
//     } else {
//         return null;
//     }
// }
