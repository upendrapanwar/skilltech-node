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
const fs = require('fs');
const path = require('path');
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const msg = require("../helpers/messages.json");
const { User, Subscriptionpayment, Purchasedcourses } = require('../helpers/db');
const crypto = require("crypto");

module.exports = {
    create,
    authenticate,
    subscription,
    ambassador_subscription,
    completeRegisteration,
    generateSignature,
    saveMembershipSubscription,
    getReferralCode,
    fetchAmbassadorCode,
    checkReferralCode,
    getMyCourses,
    getUserCourses
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
            firstname: param.firstname,
            surname: param.surname,
            email: param.email,
            password: bcrypt.hashSync(param.password, 10),
            role: 'subscriber',
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
async function authenticate({ email, password }) {
    console.log()
    const user = await User.findOne({ email });
    
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
    console.log("param",param);
    var whereCondition = { _id: param.uid};
    const test = User.findOne(whereCondition);
    //console.log('test',test);
    
    if (await User.findOne(whereCondition)) {
       // console.log('testttt');
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
            method_of_communication:param.method_of_communication, 
            opt_in_promotional: param.opt_in_promotional,
            race: param.race,
            gender: param.gender,
            qualification: param.qualification,
            how_did_you_hear_about_us: param.how_did_you_hear_about_us,
            opt_in_promotional: param.opt_in_promotional,
            authname: param.firstname +' '+param.surname,
            privacy: param.privacy,
            ecommercePolicy: param.ecommercePolicy,
            deals_promotion: param.deals_promotion,
            in_loop:param.in_loop,
            role: "subscriber",
        } }])
        //console.log('user',result);
        
        if (result) {

            let res = await User.findById(param.uid).select("-password -community -social_accounts -reset_password -image_url -phone");
           // console.log('res=',res);
            if (res) {
               // console.log('if');
                return res;
            } else {
             //   console.log('else');
                return false;
            }
        } else {
           // console.log('ifelse');
            return false;
        }
    } else {
        //console.log('elseee');
        return false;
    }
    
    //const data = await user.save();
    
    
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
async function saveMembershipSubscription(param) {
    try {
        //console.log('params=',param.merchantData);
        const subscriptionPayment = new Subscriptionpayment({
            plan_name: param.merchantData.item_name,
            subscription_type: param.merchantData.subscription_type,
            frequency: param.merchantData.frequency,
            billing_date: param.merchantData.billing_date,
            payment_mode: 'Credit Card',
            payment_status: param.payment_status,
            amount: param.merchantData.amount,
            payment_cycle: param.merchantData.cycles,
            item_name: param.merchantData.item_name,
            item_description: param.merchantData.item_description,
            m_payment_id: param.merchantData.m_payment_id,
            is_recurring: param.is_recurring,
            userid: param.userid,
            merchantData: JSON.stringify(param.merchantData),
            is_active: param.is_active
        });
        const data = await subscriptionPayment.save();
        //console.log('subscriberdata=',data);
        if (data) {
    
            let res = await Subscriptionpayment.findById(data.id).select("-plan_name -payment_mode -payment_status -amount -payment_cycle -is_recurring -userid -is_active");
            
            if (res) {
                let courseDatas = param.coursesData;
                
                if(courseDatas) {
                    for(var i=0;i<Object.keys(courseDatas).length;i++) {
                        
                        const purchasedcourses = new Purchasedcourses({
                            courseid:courseDatas[i].id,
                            orderid: data.id,
                            quantity: courseDatas[i].quantity,
                            userId: param.userid,
                            course_title: courseDatas[i].title,
                            course_price: courseDatas[i].price,
                            paymentType: courseDatas[i].paymentType,
                            image: courseDatas[i].image,
                            course_category: ''
                        });
                        await purchasedcourses.save();
                    }
                    
                }
                
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
 * Manages user for ambassador subscription
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function ambassador_subscription(param) {
    const res = param.certificate;
    const base64Data = res.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    let certificateName = "CER-" + Math.floor(Math.random() * 1000000) + "-" + Date.now() + ".pdf";
    let certificatePath = path.join(__dirname, '../../uploads/certificate/'+ certificateName);
    fs.writeFileSync(certificatePath,base64Data,{encoding: 'base64'}); 
    param.certificate = 'uploads/certificate/'+ certificateName;

    const res_bankproof = param.bank_proof;
    const base64DataBankProof = res_bankproof.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    let bankProofName = "CER-" + Math.floor(Math.random() * 1000000) + "-" + Date.now() + ".pdf";
    let bankProofPath = path.join(__dirname, '../../uploads/bank_proof/'+ bankProofName);
    fs.writeFileSync(bankProofPath,base64DataBankProof,{encoding: 'base64'});
    param.bank_proof = 'uploads/bank_proof/'+ bankProofName;

    var whereCondition = { _id: param.uid};
    const test = User.findOne(whereCondition);
    
    //console.log('test',test);
    //console.log('param',param);
    if (await User.findOne(whereCondition)) {
        //console.log('inside');
        result = await User.updateMany({_id: param.uid}, [{ $set: {
            //firstname: param.firstname,
            //surname: param.surname,
            //id_number: param.id_number,
            //subscriber_email: param.email,
            //mobile_number: param.mobile_number,
            //alternate_mobile_number: param.alternate_mobile_number,
            //account_holder_title: param.account_holder_title,
            account_holder_name: param.account_holder_name,
            //account_holder_surname: param.account_holder_surname,
            bank: param.bank,
            branch: param.branch,
            branch_code: param.branch_code,
            bank_proof:param.bank_proof,
            type_of_account: param.type_of_account,
            account_number: param.account_number,
            //referredby: param.referredby,
            //referredby_firstname: param.referredby_firstname,
            //referredby_surname: param.referredby_surname,
            referral_code: param.referralCode,
            //referredby_email: param.referredby_email,
            //referredby_mobile_number: param.referredby_mobile_number,
            refer_friend: param.refer_friend,
            certificate:param.certificate,
            confirm_details:param.confirm_details,
            //terms_n_condition:param.terms_n_condition,
            update_information:param.update_information,
            //center_to_assist: param.center_to_assist,
            //pop: param.pop,
            //authname: param.firstname +' '+param.surname,
            //signature: param.signature,
           // signed_place: param.signed_place,
           // signed_on: param.signed_on,
            role: "ambassador",
        } }])
        //console.log('ambassador=',result);
        
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

/**
 * Complete registration
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function completeRegisteration(param) {
    let res = await User.findById(param.userid).select("firstname surname id_number email mobile_number street street_name suburb_district town_city province postal_code race gender qualification method_of_communication privacy opt_in_promotional deals_promotion");
    let bool = 0;
    if (res.id_number === null || res.email === null || res.mobile_number === null || res.street === null || res.street_name === null || res.suburb_district === null || res.town_city === null || res.province === null || res.postal_code === null || res.race === null || res.gender === null || res.qualification === null || res.method_of_communication === null || res.privacy === null || res.opt_in_promotional === null || res.deals_promotion === null) {
        bool=1;
    }
    console.log('bool=',bool);
    if(bool) {
        return false;
    } else {
        return true;
    }
    
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * generate signature
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function generateSignature(param) {
    //console.log('param=',param);
    // Create parameter string
    let pfOutput = "";
    var data = param.merchantData;
    var passPhrase = param.passPhrase;
    for (let key in data) {
    if(data.hasOwnProperty(key)){
        if (data[key] !== "") {
            
            pfOutput +=`${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}&`
        }
    }
    }

    // Remove last ampersand
    let getString = pfOutput.slice(0, -1);
    if (passPhrase !== null) {
        getString +=`&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, "+")}`;
    }
    //console.log('getstring=',getString);

    return crypto.createHash("md5").update(getString).digest("hex");
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * generate referral code
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function getReferralCode(param) {
    let countReferral = await User.find({role:'ambassador'}).count();
    
    if(countReferral) {
        return countReferral;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * check if referral code exists
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function checkReferralCode(param) {
    console.log('code',param.code);
    let countReferral = await User.find({referral_code:param.code}).count();
    
    if(countReferral) {
        return countReferral;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/

/*****************************************************************************************/
/**
 * get user courses
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function getMyCourses(param) {
    console.log('code',param.id);
    let courseData = await Subscriptionpayment.find({userid:param.id})
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
 * get user courses
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function getUserCourses(param) {
    console.log('code',param.id);
    let courseData = await Purchasedcourses.find({userId:param.id})
        .select("courseid quantity orderid userId course_title course_price image paymentType createdAt updatedAt").sort({ createdAt: 'desc' });
    if(courseData) {
        return courseData;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * get user order history
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function getOrderHistory(param) {
    console.log('code',param.id);
    let courseData = await Purchasedcourses.find({userId:param.id})
        .select("courseid quantity orderid userId course_title course_price image paymentType course_category")
        .populate([{
            path: "orderid",
            model: Subscriptionpayment,
            select: "plan_name subscription_type frequency billing_date payment_mode payment_status amount payment_cycle item_name item_description m_payment_id is_recurring userid merchantData is_active createdAt",
            match: { is_active: true}
        },
        {
            path: "userId",
            model: User,
            select: "firstname surname email",
            match: { is_active: true }
        }
        ]).sort({ createdAt: 'desc' });
    if(courseData) {
        return courseData;
    } else {
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * generate referral code
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function fetchAmbassadorCode(param) {
    let referralCode = await User.findById(param.userid).select("referral_code");
    
    if(referralCode) {
        return referralCode;
    } else {
        return null;
    }
}