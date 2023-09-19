/**
 * File Name: Common Service
 * 
 * Description: Manages login,signup and all common operations
 * 
 * Author: Skill Tech
 */

const config = require('../config/index');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || config.connectionString, { useNewUrlParser: true,  useUnifiedTopology: true });
mongoose.Promise = global.Promise;

const jwt = require("jsonwebtoken");
const fs = require('fs-extra');
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const msg = require("../helpers/messages.json");
const { User } = require('../helpers/db');

module.exports = {
    create,
    authenticate,
    subscription
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
 * Create user in the database
 * 
 * @param {*} param 
 * @returns JSON|FALSE
 */
async function create(param) {
    
    try {
        
        if (await User.findOne({ email: param.email })) {
            throw 'email "' + param.email + '" is already taken';
        }
    
        const user = new User({
            name: param.name,
            email: param.email,
            password: bcrypt.hashSync(param.password, 10),
            role: param.role,
            isActive: true
        });
        //Email send functionality.
        const mailOptions = {
            from: config.mail_from_email, // sender address
            to: user.email,
            subject: 'Welcome Email - Skill Tech',
            text: 'Welcome Email',
            html: 'Dear <b>' + user.name + '</b>,<br/> You are successfully registered.<br/> ',
        };

        
        const data = await user.save();
    
        if (data) {
    
            let res = await User.findById(data.id).select("-password -social_accounts -reset_password -image_url");
    
            if (res) {
                //sendMail(mailOptions);
                return res;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (err) {
        console.log('Error', err);
        return false;
    }
   
}

/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Manages user login operations
 *  
 * @param {email,passwrd}
 * 
 * @returns Object|null
 */
async function authenticate({ email, password, role }) {
    
    const user = await User.findOne({ email, role });
    
    if (user && bcrypt.compareSync(password, user.password)) {
        const { password, reset_password, __v, createdAt, updatedAt, social_accounts, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ id: user.id }, config.secret, {
            expiresIn: "2h"
        });
        var expTime = new Date();
        expTime.setHours(expTime.getHours() + 2); //2 hours token expiration time
        //expTime.setMinutes(expTime.getMinutes() + 2);
        expTime = expTime.getTime();
        console.log(user);
        return {
            ...userWithoutHash,
            token,
            expTime
        };
    }
}

/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Manages user for subscription
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function subscription(param) {
    /*const reader = new window.FileReader();
    console.log('param.certificate=',param.certificate)
    var files = reader.readAsDataURL(param.certificate);
    let extArray = files.split(".");
    let extension = extArray[extArray.length - 1];
    
    var path_temp = param.certificate;
    var filename = 'certificate' + "-" + Math.floor(Math.random() * 10000) + "-" + Date.now() + "." + extension;
    fs.move(path_temp, config.uploadDir + '/' + filename, function(err) {
        if (err) return console.error(err)
        console.log("file uploaded!")
    });*/
    //console.log("param",param);
    var whereCondition = { _id: param.uid};
    const test = User.findOne(whereCondition);
    console.log('test',test);
    if (await User.findOne(whereCondition)) {
        const user = new User({
            firstname: param.firstname,
            surname: param.surname,
            id_number: param.id_number,
            subscriber_email: param.email,
            mobile_number: param.mobile_number,
            alternate_mobile_number: param.alternate_mobile_number,
            street: param.street,
            street_name: param.street_name,
            complex_n_unit: param.complex_n_unit,
            suburb_district: param.suburb_district,
            town_city: param.town_city,
            province: param.province,
            postal_code: param.postal_code,
            payment_option: param.payment_option,
            account_holder_title: param.account_holder_title,
            account_holder_name: param.account_holder_name,
            account_holder_surname: param.account_holder_surname,
            bank: param.bank,
            branch: param.bank,
            branch_code: param.branch_code,
            type_of_account: param.type_of_account,
            account_number: param.account_number,
            method_of_communication:param.method_of_communication, 
            opt_in_promotional: param.opt_in_promotional,
            race: param.race,
            gender: param.gender,
            qualification: param.qualification,
            employed: param.empoyed,
            occupation: param.occupation,
            how_did_you_hear_about_us: param.how_did_you_hear_about_us,
            reasons_for_subscribing: param.reasons_for_subscribing,
            how_did_you_hear_about_us_other: param.how_did_you_hear_about_us_other,
            topic_interest: param.topic_interest,
            referredby: param.referredby,
            referredby_firstname: param.referredby_firstname,
            referredby_surname: param.referredby_surname,
            referral_code: param.referral_code,
            referredby_email: param.referredby_email,
            referredby_mobile_number: param.referredby_mobile_number,
            refer_friend: param.refer_friend,
            center_to_assist: param.center_to_assist,
            earn_cash_as_ambassador: param.earn_cash_as_ambassador,
            certificate: param.certificate,
            highest_qualication_certificate: param.highest_qualication_certificate,
            bank_proof: param.bank_proof,
            pop: param.pop,
            authname: param.firstname +' '+param.surname,
            signature: param.signature,
            signed_place: param.signed_place,
            signed_on: param.signed_on,
            role: "subscriber",
        });
        result = await User.updateMany({_id: param.uid}, [{ $set: {
            firstname: param.firstname,
            surname: param.surname,
            id_number: param.id_number,
            subscriber_email: param.email,
            mobile_number: param.mobile_number,
            alternate_mobile_number: param.alternate_mobile_number,
            street: param.street,
            street_name: param.street_name,
            complex_n_unit: param.complex_n_unit,
            suburb_district: param.suburb_district,
            town_city: param.town_city,
            province: param.province,
            postal_code: param.postal_code,
            payment_option: param.payment_option,
            account_holder_title: param.account_holder_title,
            account_holder_name: param.account_holder_name,
            account_holder_surname: param.account_holder_surname,
            bank: param.bank,
            branch: param.branch,
            branch_code: param.branch_code,
            type_of_account: param.type_of_account,
            account_number: param.account_number,
            method_of_communication:param.method_of_communication, 
            opt_in_promotional: param.opt_in_promotional,
            race: param.race,
            gender: param.gender,
            qualification: param.qualification,
            employed: param.empoyed,
            occupation: param.occupation,
            how_did_you_hear_about_us: param.how_did_you_hear_about_us,
            reasons_for_subscribing: param.reasons_for_subscribing,
            how_did_you_hear_about_us_other: param.how_did_you_hear_about_us_other,
            topic_interest: param.topic_interest,
            referredby: param.referredby,
            referredby_firstname: param.referredby_firstname,
            referredby_surname: param.referredby_surname,
            referral_code: param.referral_code,
            referredby_email: param.referredby_email,
            referredby_mobile_number: param.referredby_mobile_number,
            refer_friend: param.refer_friend,
            center_to_assist: param.center_to_assist,
            earn_cash_as_ambassador: param.earn_cash_as_ambassador,
            certificate: param.certificate,
            highest_qualication_certificate: param.highest_qualication_certificate,
            bank_proof: param.bank_proof,
            pop: param.pop,
            authname: param.firstname +' '+param.surname,
            signature: param.signature,
            signed_place: param.signed_place,
            signed_on: param.signed_on,
            role: "subscriber",
        } }])
        //console.log('user',result);
        
        if (result) {

            let res = await User.findById(param.uid).select("-password -community -social_accounts -reset_password -image_url -phone");
    
            if (res) {
                return res;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
    
    //const data = await user.save();
    
    
}

/*****************************************************************************************/
/*****************************************************************************************/