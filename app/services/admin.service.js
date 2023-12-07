/**
 * File Name: Admin Service
 * 
 * Description: Manages login,signup and all admin operations
 * 
 * Author: Skill Tech
 */

const config = require('../config/index');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || config.connectionString, { useNewUrlParser: true,  useUnifiedTopology: true });
mongoose.Promise = global.Promise;

const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const msg = require("../helpers/messages.json");
const { User, Subscriptionpayment, Purchasedcourses } = require('../helpers/db');
const crypto = require("crypto");

module.exports = {
    agentSubscription,
    getActiveAgents,
    getAgentById
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
    console.log('code',param.id);
    let courseData = await Subscriptionpayment.find()
        .select("plan_name subscription_type frequency billing_date payment_mode payment_status amount payment_cycle item_name item_description m_payment_id is_recurring userid createdAt updatedAt").sort({ createdAt: 'desc' });
    if(courseData) {
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
    
    let agentsData = await User.find({is_active:true,role:'subscriber'}).sort({ createdAt: 'desc' });
    if(agentsData) {
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
    
    let agentData = await User.find({_id:param.id}).sort({ createdAt: 'desc' });
    if(agentData) {
        return agentData;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/
