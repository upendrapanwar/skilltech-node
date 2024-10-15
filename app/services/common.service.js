/**
 * File Name: Common Service
 *
 * Description: Manages login,signup and all common operations
 *
 * Author: Skill Tech
 */

const config = require("../config/index");
const axios = require('axios');
const https = require('https');
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI || config.connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.Promise = global.Promise;

const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const QRCode = require('qrcode'); 
const msg = require("../helpers/messages.json");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid"); 
const SibApiV3Sdk = require('sib-api-v3-sdk');
const cron = require('node-cron');
const mime = require("mime-types");

const {
  User,
  Subscriptionpayment,
  Purchasedcourses,
  Userquery,
  Referral,
} = require("../helpers/db");

let transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_AUTH_USER, // generated ethereal user
    pass: process.env.BREVO_PASSWORD, // generated ethereal password
  },
});  

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
  getUserCourses,
  saveQuery,
  cancelCourseByUser,
  cancelPayfastPayment,
  sendSubscriptionEmail,
  payFastNotify,
  getSubscriptionId,
  getDefaultedSubscriptionPaymentOfSubscribers,
  getActiveReferral,
  getInactiveReferral,
  getSubscriptionCancelledbySubscriber,
  getPaymentDue,
  getReferralsThisMonth,
  getAmbassadorMonthlyPay,
  varifyEmailForgotPassword,

  //Brevo email functions
  sendEmailByBrevo,
  sendUpdatedContactEmailByBrevo,
  addContactInBrevo,
  updateContactAttributeBrevo,
  deleteContactBrevo,
  createAndSendEmailCampaign,
  sendUpdatedSuspendedContactEmail,
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
      rejectUnauthorized: false,
    },
    secure: config.mail_is_secure,
  });

  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log("*** Error", err);
    } else {
      console.log("*** Success", info);
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
// async function create(param) {
//   try {
//     if (await User.findOne({ email: param.email })) {
//       throw 'email "' + param.email + '" is already taken';
//     }

//     const user = new User({
//       firstname: param.firstname,
//       surname: param.surname,
//       email: param.email,
//       password: bcrypt.hashSync(param.password, 10),
//       role: "learner",
//       isActive: true,
//     });
//     //Email send functionality.
//     const mailOptions = {
//       from: config.mail_from_email, // sender address
//       to: user.email,
//       subject: "Welcome Email - Skill Tech",
//       text: "Welcome Email",
//       html:
//         "Dear <b>" +
//         user.name +
//         "</b>,<br/> You are successfully registered.<br/> ",
//     };

//     const data = await user.save();

//     if (data) {
//       let res = await User.findById(data.id).select(
//         "-password -social_accounts -reset_password -image_url"
//       );

//       if (res) {
//         //sendMail(mailOptions);
//         return res;
//       } else {
//         return false;
//       }
//     } else {
//       return false;
//     }
//   } catch (err) {
//     console.log("Error", err);
//     return false;
//   }
// }
async function create(param) {
  try {
    if (await User.findOne({ email: param.email })) {
      throw 'email "' + param.email + '" is already taken';
    }

    const user = new User({
      firstname: param.firstname,
      surname: param.surname,
      email: param.email,
      moodle_pass: btoa( param.password ),
      password: bcrypt.hashSync(param.password, 10),
      role: "learner",
      isActive: true,
      is_blocked: false,
    });
    //Email send functionality.
    const mailOptions = {
      from: config.mail_from_email, // sender address
      to: user.email,
      subject: "Welcome Email - Skill Tech",
      text: "Welcome Email",
      html:
        "Dear <b>" +
        user.name +
        "</b>,<br/> You are successfully registered.<br/> ",
    };

    const data = await user.save();
    const authData  = await authenticate({ email:param.email, password:param.password })
    if (data) {
      let res = await User.findById(data.id).select(
        "-password -social_accounts -reset_password -image_url"
      );

      if (res && authData) {
        let response = {
          data:data,
          authData:{
            token:authData.token,
            expTime:authData.expTime
          }
        };
        //sendMail(mailOptions);
        return response;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (err) {
    console.log("Error", err);
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
  const user = await User.findOne({ email });

  if (user && bcrypt.compareSync(password, user.password)) {
    const {
      password,
      reset_password,
      __v,
      createdAt,
      updatedAt,
      social_accounts,
      ...userWithoutHash
    } = user.toObject(); 
    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: "2h",
    });
    var expTime = new Date();
    expTime.setHours(expTime.getHours() + 2); //2 hours token expiration time
    //expTime.setMinutes(expTime.getMinutes() + 2);
    expTime = expTime.getTime();
    console.log('user', user);
    return {
      ...userWithoutHash,
      token,
      expTime,
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
  console.log("param", param);
  var whereCondition = { _id: param.uid };
  const test = User.findOne(whereCondition); 
  //console.log('test',test);

  if (await User.findOne(whereCondition)) {
    // console.log('testttt');
    result = await User.updateMany({ _id: param.uid }, [
      {
        $set: { 
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
          method_of_communication: param.method_of_communication,
          policy_consent:{
            ecommercePolicy: param.ecommercePolicy,
            privacy: param.privacy,
            userConsent: param.userConsent,
          }, 
          opt_in_promotional: {
            receive_monthly_newsletters: param.monthly_newsletters,
            exclusive_deals_promotions: param.deals_promotion,
            keep_in_loop: param.in_loop
          },
          race: param.race,
          gender: param.gender,
          qualification: param.qualification,
          promotional_consent: param.promotional_consent,
          how_did_you_hear_about_us: param.how_did_you_hear_about_us,
          // opt_in_promotional: param.opt_in_promotional,
          authname: param.firstname + " " + param.surname,
          // privacy: param.privacy,
          // ecommercePolicy: param.ecommercePolicy,
          // deals_promotion: param.deals_promotion,
          // in_loop: param.in_loop,
          role: "registered_learner",
          
        }, 
      },
    ]);
    // console.log('user result',result);

    if (result) {
      let res = await User.findById(param.uid).select(
        "-password -community -social_accounts -reset_password -image_url -phone"
      );
      // console.log('res=',res);
      if (res) {
        // console.log(res);
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
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Brevo mail function
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function sendEmailByBrevo(template_id, receiverEmailId, receiverName, variables) {
  try {
    console.log('template_id', template_id);
    console.log('receiverEmailId', receiverEmailId);
    console.log('receiverName', receiverName);
    console.log('variables', variables);

    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 

    if(variables){
      sendSmtpEmail = {
        to: [{
          email: receiverEmailId,
          name: receiverName
        }],
        templateId: template_id,
        params: variables,
        sender: {
          email: 'guild@skilltechsa.co.za',
          name: 'High Vista Guild'
        }
      };
    } else {
      sendSmtpEmail = {
        to: [{
          email: receiverEmailId,
          name: receiverName
        }],
        templateId: template_id,
        sender: {
          email: 'guild@skilltechsa.co.za',
          name: 'High Vista Guild'
        }
      };
    }

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    return data;

  } catch (error) {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
};


async function sendUpdatedSuspendedContactEmail(template_id, receiverEmailId, receiverName, variables, bank, branch, type_of_account, account_number, branch_code) {
  try {
    console.log('template_id', template_id);
    console.log('receiverEmailId', receiverEmailId);
    console.log('receiverName', receiverName);
    console.log('variables', variables);

    updateSuspendedContactAttribute(receiverEmailId, bank, branch, type_of_account, account_number, branch_code);
    
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 

      sendSmtpEmail = {
        to: [{
          email: receiverEmailId,
          name: receiverName
        }],
        templateId: template_id,
        params: variables,
        sender: {
          email: 'guild@skilltechsa.co.za',
          name: 'High Vista Guild'
        }
    };

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    return data;

  } catch (error) {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
};
async function updateSuspendedContactAttribute(email, bank, branch, type_of_account, account_number, branch_code) {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;

    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let identifier = email; 
    let updateContact = new SibApiV3Sdk.UpdateContact(); 

      updateContact.attributes = {
        'BANK': bank,
        'BRANCH' : branch,
        'TYPE_OF_ACCOUNT' : type_of_account,
        'ACCOUNT_NUMBER' : account_number,
        'BRANCH_CODE' : branch_code,
      };

    apiInstance.updateContact(identifier, updateContact).then(function() {
    console.log('updateContactAttribute API called successfully.');
    }, function(error) {
      console.error(error);
    });
  } catch {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
};


async function sendUpdatedContactEmailByBrevo(template_id, receiverEmailId, receiverName, variables, subscriber_firstname, subscriber_lastname) {
  try {
    console.log('template_id', template_id);
    console.log('receiverEmailId', receiverEmailId);
    console.log('receiverName', receiverName);
    console.log('variables', variables);

    await updateContactAttributeBrevo(receiverEmailId, subscriber_firstname, subscriber_lastname);
    
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 

    if(variables){
      sendSmtpEmail = {
        to: [{
          email: receiverEmailId,
          name: receiverName
        }],
        templateId: template_id,
        params: variables,
        sender: {
          email: 'guild@skilltechsa.co.za',
          name: 'High Vista Guild'
        }
      };
    } else {
      sendSmtpEmail = {
        to: [{
          email: receiverEmailId,
          name: receiverName
        }],
        templateId: template_id,
        sender: {
          email: 'guild@skilltechsa.co.za',
          name: 'High Vista Guild'
        }
      };
    }

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    return data;

  } catch (error) {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
}

// Schedule the function to run on the 1st of every month at 1 am
cron.schedule('0 1 1 * *', () => {
  const templateId = 16;
  const receiverEmailId = 'lize@skilltechsa.co.za';
  const receiverName  = 'Lize';
  sendEmailByBrevo(templateId, receiverEmailId, receiverName);
  createAndSendEmailCampaign();
});


// cron.schedule('*/1 * * * *', () => {
//   const firstname = 'John';
//   const surname = 'Doe';
//   const forgot_password_link = `https://affiliate.skilltechsa.online/admin/forgot-password?reset-token=abcd`;
 
//   const email = 'eynoashish@gmail.com';
// //   commonService.sendEmailByBrevo(79, email, firstname);
//   addSubscriberContactInBrevo(email, firstname, surname, forgot_password_link)
//   console.log('Successfully triggered');
//   });
  

//For adding contacts in the list in Brevo
async function addContactInBrevo(ambassadorData) {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = ambassadorData.email;
    createContact.listIds = [7];
    createContact.attributes = {
      FIRSTNAME: ambassadorData.firstname,
      LASTNAME: ambassadorData.surname,
      REFERRAL_CODE: ambassadorData.referral_code,
      BANK: ambassadorData.bank,
      BRANCH: ambassadorData.branch,
      TYPE_OF_ACCOUNT: ambassadorData.type_of_account,
      ACCOUNT_NUMBER: ambassadorData.account_number,
      BRANCH_CODE: ambassadorData.branch_code
    };
    apiInstance.createContact(createContact).then(function(data) {
      console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }, function(error) {
      console.error(error);
    });
  } catch {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
};

async function addSubscriberContactInBrevo(email, subscriber_firstname, subscriber_lastname, token) {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email;
    createContact.listIds = [10];
    createContact.attributes = {
      FIRSTNAME: subscriber_firstname,
      LASTNAME: subscriber_lastname,
      SUBSCRIBER_FIRSTNAME: subscriber_firstname,
      SUBSCRIBER_LASTNAME: subscriber_lastname,
      TOKEN_FORGOT_PASSWORD: token
    };
    const data = await apiInstance.createContact(createContact);
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    return data;
    
  } catch {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
};

async function updateContactAttributeBrevo(email, subscriber_firstname, subscriber_lastname, token) {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;

    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let identifier = email; 
    let updateContact = new SibApiV3Sdk.UpdateContact(); 

    if(token){
      updateContact.attributes = {'TOKEN_FORGOT_PASSWORD':token};
    } else {
      updateContact.attributes = {'SUBSCRIBER_FIRSTNAME':subscriber_firstname,'SUBSCRIBER_LASTNAME':subscriber_lastname};
    }

    const data = await apiInstance.updateContact(identifier, updateContact);
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    return 'Updated';
   
  } catch {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
};


async function deleteContactBrevo(email) {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;

    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let identifier = email;
    apiInstance.deleteContact(identifier).then(function() {
      console.log('API called successfully.');
    }, function(error) {
      console.error(error);
    });
  } catch {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
};


async function createAndSendEmailCampaign() {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
    let emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign();

    let scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + 5);
    emailCampaigns = {
      tag: 'Monthly Report',
      sender: { name: 'High Vista Guild', email: 'guild@skilltechsa.co.za' },
      name: 'Ambassador Monthly Report',
      templateId: 21,
      scheduledAt: scheduledTime.toISOString(),
      subject: 'Ambassador Monthly Report',
      replyTo: 'guild@skilltechsa.co.za',
      toField: '{{contact.FIRSTNAME}} {{contact.LASTNAME}}',
      recipients: { listIds: [7]},
      inlineImageActivation: false,
      mirrorActive: false,
      recurring: false,
      type: 'classic',
    };
    apiInstance.createEmailCampaign(emailCampaigns).then(function(data) {
      console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }, function(error) {
      console.error(error);
    });
  } catch (error) {
    console.error(error);
  }
};

async function updateDataforResetPassword(userId) {

  const whereCondition = { _id: userId };
  try {
      const updatedData = await User.findOneAndUpdate(
          whereCondition,
          {
              $set: {
                  is_pass_reset: true,
              }
          },
          { new: true }
      );

      if (updatedData) {
          return updatedData;
      } else {
          return false;
      }
  } catch (err) {
      console.error("Error udating is_reset_pass in database:", err);
      return false;
  }  
};


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
    console.log("Param data: ", param)
    const referralCode = param.referralCode; 

    const data = await Subscriptionpayment.findOneAndUpdate(
      { _id: param.id },
      {
        $set: {
          // role: "subscriber",
          plan_name: param.merchantData.item_name,
          subscription_type: param.merchantData.subscription_type,
          frequency: param.merchantData.frequency,
          billing_date: param.merchantData.billing_date,
          payment_mode: "Credit Card",
          payment_status: param.payment_status,
          amount: param.merchantData.amount,
          payment_cycle: param.merchantData.cycles,
          item_name: param.merchantData.item_name,
          item_description: param.merchantData.item_description,
          m_payment_id: param.merchantData.m_payment_id,
          is_recurring: param.is_recurring,
          userid: param.userid,
          is_active: param.is_active,
          // merchantData : JSON.stringify(param.merchantData),
          uuid: param.uuid,
        },
      },
      {
        new: true
      }
    );

    let userData = '';
    if(param.payment_status !== 'cancel'){
      userData = await User.findOneAndUpdate(
        { _id: param.userid },
        {
          $set: {
            role: "subscriber",
            subscription_date: new Date(),
          },
        },
        {
          new: true
        }
      );
      console.log('userData=', userData);
    };

    console.log('subscriberdata=',data);
    if (param.id) {
      let res = await Subscriptionpayment.findById(param.id).select(
        "-plan_name -payment_mode -payment_status -amount -payment_cycle -is_recurring -userid -is_active"
      );
      if (res) {
        let courseDatas = param.coursesData;

        if (courseDatas && param.payment_status === 'success') {
          for (var i = 0; i < Object.keys(courseDatas).length; i++) {
            const purchasedcourses = new Purchasedcourses({
              courseid: courseDatas[i].id, 
              orderid: data._id,
              quantity: courseDatas[i].quantity,
              userId: param.userid,
              course_title: courseDatas[i].title,
              course_price: courseDatas[i].price,
              paymentType: courseDatas[i].paymentType,
              image: courseDatas[i].image,
              course_category: "",
              is_active : param.is_active,
            });
            await purchasedcourses.save();
            console.log("purchasedcourses", purchasedcourses);

            const purchagedcourseId = purchasedcourses._id;

            //Set purchagedcourseId in Referral document in database
            if(referralCode){
              await emailToAmbassadorForReferralCode(param.userid, referralCode, purchagedcourseId);
            };
          }
        }else{
          console.log(" Payment is Cancelled")
        }

        const result = {
          data: res,
          userData: userData
        }
        return result;
      } else {
        return false;
      }
    } else {
      console.log("Error in res ")
      return false;
    }
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Send email to subscriber
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function sendSubscriptionEmail(req) {
  try {
    const { name, email } = req.body;
    console.log("sendSubscriptionEmail email", email);
    console.log("sendSubscriptionEmail name", name);
    const data = sendEmailByBrevo(12, email, name);

    console.log("sendEmailByBrevo Ambassador", JSON.stringify(data));
    return JSON.stringify(data);
  } catch (err) {
    console.log("Error:", err);
    throw err;
  }
};
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Manages user for ambassador subscription
 *
 * @param {param}
 *
 * @returns Object|null
 */
const saveBase64File = (base64String, uploadDir) => {
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const extension = mime.extension(mimeType);
  if (!extension) {
    throw new Error("Unsupported file type");
  }

  const fileName = `CER-${Math.floor(Math.random() * 1000000)}-${Date.now()}.${extension}`;
  const filePath = path.join(__dirname, `../../uploads/${uploadDir}/`, fileName);
  fs.writeFileSync(filePath, base64Data, { encoding: "base64" });

  return `uploads/${uploadDir}/${fileName}`;
};

async function ambassador_subscription(param) {
  try {
    // if (param.certificate) {
    //   param.certificate = saveBase64File(param.certificate, "certificate");
    // }
    // if (param.bank_proof) {
    //   param.bank_proof = saveBase64File(param.bank_proof, "bank_proof");
    // }

    const whereCondition = { _id: param.uid };

    if (await User.findOne(whereCondition)) {
      const result = await User.updateMany({ _id: param.uid }, [
        {
          $set: {
            account_holder_name: param.account_holder_name,
            bank: param.bank,
            branch: param.branch,
            branch_code: param.branch_code,
            bank_proof: param.bank_proof,
            type_of_account: param.type_of_account,
            account_number: param.account_number,
            // bank_contact_details: param.contact_details,
            ambassador_date: new Date(),
            referral_code: param.referral_code,
            refer_friend: param.refer_friend,
            certificate: param.certificate,
            confirm_details: param.confirm_details,
            update_information: param.update_information,
            role: "ambassador",
          },
        },
      ]);
      console.log('ambassador=', result);

      if (result) {
        let res = await User.findById(param.uid).select(
          "-password -community -social_accounts -reset_password -image_url -phone"
        );
        addContactInBrevo(res);
        const receiverName = res.firstname + " " + res.surname;
        const variables = {
          REFERRAL_CODE: res.referral_code,
        };
        sendEmailByBrevo(24, res.email, receiverName, variables);
        console.log('receiverName', receiverName);
        console.log('res.referral_code', res.referral_code);
        console.log('ambassador details:::::', res);

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
  } catch (error) {
    console.error("Error processing ambassador subscription:", error);
    return false;
  }
};

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
  let res = await User.findById(param.userid).select(
    "firstname surname id_number email mobile_number street street_name suburb_district town_city province postal_code race gender qualification method_of_communication privacy opt_in_promotional deals_promotion"
  );
  let bool = 0;
  if (
    res.id_number === null ||
    res.email === null ||
    res.mobile_number === null ||
    res.street === null ||
    res.street_name === null ||
    res.suburb_district === null ||
    res.town_city === null ||
    res.province === null ||
    res.postal_code === null ||
    res.race === null ||
    res.gender === null ||
    res.qualification === null ||
    res.method_of_communication === null ||
    res.privacy === null ||
    res.opt_in_promotional === null ||
    res.deals_promotion === null
  ) {
    bool = 1;
  }
  console.log("bool=", bool);
  if (bool) {
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
    if (data.hasOwnProperty(key)) {
      if (data[key] !== "") {
        pfOutput += `${key}=${encodeURIComponent(data[key]).replace(
          /%20/g,
          "+"
        )}&`;
      }
    }
  }

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  if (passPhrase !== null) {
    getString += `&passphrase=${encodeURIComponent(passPhrase).replace(
      /%20/g,
      "+"
    )}`;
  }
  //console.log('getstring=',getString);
  const signature = crypto.createHash("md5").update(getString).digest("hex");
  
  return signature;
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
  async function getReferralCode() {
    const currentYear = new Date().getFullYear();
  
    // Step 1: Fetch the latest referral code for the current year
    const pipeline = [
      {
        $match: {
          role: "ambassador",
          referral_code: { $regex: `^HG${currentYear.toString().substr(-2)}` } // Match codes starting with HG + YY
        }
      },
      {
        $addFields: {
          sequenceNumber: {
            $toInt: { $substr: ["$referral_code", 4, -1] } // Extract sequence number part from the code
          }
        }
      },
      {
        $sort: { sequenceNumber: -1 } // Sort by the extracted sequence number in descending order
      },
      {
        $limit: 1 // Get the latest referral code
      }
    ];
  
    try {
      const result = await User.aggregate(pipeline);
      console.log("Referral code result:", result);
      let sequenceNumber = 1; // Start from 1 if no referral codes exist for the year
      const currentDate = new Date();
      const year = currentDate.getFullYear().toString().substr(-2);
      let referralCodePrefix = `HG${year}`;
  
      // Step 2: If a referral code exists, extract the sequence number and increment it
      if (result.length > 0) {
        sequenceNumber = result[0].sequenceNumber + 1; // Increment the sequence number
      }
  
      // Step 3: Generate the new referral code
      let referralCode = referralCodePrefix + sequenceNumber;
      console.log("Referral code generated:", referralCode);
  
      return referralCode;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  
// async function getReferralCode() {
//   const currentYear = new Date().getFullYear();
  
//   const pipeline = [
//     {
//       $match: {
//         role: "ambassador",
//         $expr: {
//           $eq: [{ $year: "$ambassador_date" }, currentYear]
//         }
//       }
//     },
//     {
//       $count: "countReferral"
//     }
//   ];

//   try {
//     const result = await User.aggregate(pipeline);
//     if (result.length > 0) {
//       return result[0].countReferral;
//     } else {
//       return "0";
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     throw error;
//   }
// }

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * notify from payfast
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function payFastNotify(param, spayId) {
  console.log("Notify URL is running in service.");
  console.log("spayId", spayId.id);
  const requestData = param;

  // Check if requestData exists and is not empty
  if (requestData && Object.keys(requestData).length > 0) {
    const itnData = {};
    for (const key of Object.keys(requestData)) {
      itnData[key] = requestData[key];
    }
    console.log("ITN Data:", itnData);

    const updatedPaymentData = await Subscriptionpayment.updateMany(
          { _id: spayId.id },
          {
            $set: {
              merchantData: JSON.stringify(itnData),
            },
          }
        );
    
        console.log("updatedSubscriptionData", updatedPaymentData);
    return itnData;
  } else {
    return null;
  }
}
// async function payFastNotify(param,spay) {
//   const requestData = param;

//   // Perform signature verification
//   const signature = requestData.signature;
//   delete requestData.signature; // Remove signature from data to verify

//   const dataString = Object.keys(requestData)
//     .sort()
//     .map((key) => `${key}=${requestData[key]}`)
//     .join('&');

//   const calculatedSignature = crypto
//     .createHash('md5')
//     .update(`${dataString}&${payfastSettings.passphrase}`)
//     .digest('hex');

//   /*const subscriptionPayment = new Subscriptionpayment({
//     merchantData: JSON.stringify(dataString),
//     uuid : JSON.stringify(dataString)
//   });*/
//   //const data = await subscriptionPayment.save();
//   console.log('payfast',dataString);
//   await Subscriptionpayment.updateMany(
//     { _id: spay.id },
//     {
//       $set: {
//         uuid: JSON.stringify(dataString),
//       },
//     }
//   );
//   /*let countReferral = await User.find({ role: "ambassador" }).count();

//   if (countReferral) {
//     return countReferral;
//   } else {
//     return null;
//   }*/
// }
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * get subscription id for payment
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function getSubscriptionId(req) { 
  const reqData = req.body; 
  console.log("reqData", reqData);
  const subscriptionPayment = new Subscriptionpayment({
    userid: reqData.userid,
    // payment_status: reqData.payment_status,
    uuid: "1",
    is_active: false,
  });

  console.log("subscriptionPayment", subscriptionPayment)
  const data = await subscriptionPayment.save();

  if (data) {
    return data.id;
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
async function checkReferralCode(req) {
  try {
    const userId = req.params.id; 
    const referralCode = req.body.referralCode;

    // Check if referral code is already used
    const existingReferral = await Referral.findOne({
      referral_code: referralCode,
      userId: userId,
      purchagedcourseId: { $ne: null }
    });
    
    if (existingReferral) {
      return;
    };

    const referralData = await Referral.create({
      referral_code: referralCode,
      userId: userId,
      is_active: true,
    });

    const createdReferralData = await referralData.save();
    console.log("newReferralData", createdReferralData);

    return createdReferralData;

  } catch (error) {
    console.error("Error:", error);
    return { status: 500, error: "Internal Server Error" };
  }
};


async function emailToAmbassadorForReferralCode(userId, referralCode, purchagedcourseId) {
  try {
    console.log("UserID", userId);
    console.log("referralCode", referralCode);

    const subscriberData = await User.find({_id:userId}).select("firstname surname");
    console.log("subscriberData", subscriberData);
    const subscriber_firstname = subscriberData[0].firstname;
    const subscriber_surname = subscriberData[0].surname;

    let query = { 
      referral_code: referralCode,
      is_active: true,
    };
    const ambassadorData = await User.find(query).select("email firstname surname");
    console.log("ambassadorData", ambassadorData);

     // Check if ambassadorData is an empty array
    if (!ambassadorData.length) {
      return ;
    };

    const updateReferral = await Referral.findOneAndUpdate(
      { referral_code: referralCode, userId: userId},
      { $set: { purchagedcourseId:  purchagedcourseId} },
      { 
        new: true, // return the updated document
        sort: { _id: -1 } // sort by _id in descending order to get the latest document
      }
    );
    console.log("updateReferral", updateReferral);

    //For Brevo Email to AMBASSADOR       
      const variables = {
        SUBSCRIBER_FIRSTNAME: subscriber_firstname,
        SUBSCRIBER_LASTNAME: subscriber_surname
      };
      const receiverName = ambassadorData[0].firstname + " " + ambassadorData[0].surname;
      const receiverEmail = ambassadorData[0].email;
      await sendUpdatedContactEmailByBrevo(25, receiverEmail, receiverName, variables, subscriber_firstname, subscriber_surname);
    
  } catch (error) {
    console.error("Error:", error);
    return { status: 500, error: "Internal Server Error" }; // Error response
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
async function getMyCourses(param) {
  try {
    console.log("code", param.id);

    const subscriptionPayments = await Subscriptionpayment.find({ userid: param.id, payment_status: "success" }).select('merchantData');
    console.log("subscriptionPayments", subscriptionPayments);
    
    const orderIds = subscriptionPayments.map(payment => payment._id.toString());
    console.log("orderIds", orderIds);

    const coursePurchageDetails = await Purchasedcourses.find({
      userId: param.id,
      is_active: true,
      orderid: { $in: orderIds }
    }).sort({ createdAt: "desc" });
    console.log("coursePurchageDetails", coursePurchageDetails);

    if (coursePurchageDetails.length > 0) {
      const result = coursePurchageDetails.map(data => {
          const matchingPayment = subscriptionPayments.find(payment => payment._id.toString() === data.orderid.toString());
          return {
            ...data.toObject(), // Convert Mongoose document to plain JavaScript object
            merchantData: matchingPayment ? matchingPayment.merchantData : null,
          };
      }).filter(entry => entry !== null);
      console.log("result", result);
      
      return result; 
    } else {
        return [];
    }
    
  } catch (error) {
    console.error("Error:", error);
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
  console.log("code", param.id);
  let courseDetails = await Subscriptionpayment.find({ userid: param.id })
    .select(
      "plan_name subscription_type frequency billing_date payment_mode payment_status amount payment_cycle item_name item_description m_payment_id is_recurring userid is_active createdAt updatedAt uuid merchantData"
    )
    .sort({ createdAt: "desc" });

  let coursePurchageDetails = await Purchasedcourses.find({
    userId: param.id,
    // is_active: true,
  })
    .select("course_title image")
    .sort({ createdAt: "desc" });

  if (courseDetails && coursePurchageDetails) {
    let courseData = [];

    courseDetails.forEach((detail, index) => {
      let mergedCourse = {
        ...detail._doc,
        image: coursePurchageDetails[index]
          ? coursePurchageDetails[index].image
          : null,
      };
      courseData.push(mergedCourse);
    });
    return courseData;
  } else {
    return null;
  }
}
// async function getUserCourses(param) {
//   console.log("code", param.id);
//   let courseData = await Purchasedcourses.find({ userId: param.id })
//     .select(
//       "courseid quantity orderid userId course_title course_price image paymentType is_active createdAt updatedAt"
//     )
//     .sort({ createdAt: "desc" });
//   if (courseData) {
//     console.log(courseData);
//     return courseData;
//   } else {
//     return null;
//   }
// }
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
  console.log("code", param.id);
  let courseData = await Purchasedcourses.find({ userId: param.id })
    .select(
      "courseid quantity orderid userId course_title course_price image paymentType course_category"
    )
    .populate([
      {
        path: "orderid",
        model: Subscriptionpayment,
        select:
          "plan_name subscription_type frequency billing_date payment_mode payment_status amount payment_cycle item_name item_description m_payment_id is_recurring userid merchantData is_active createdAt",
        match: { is_active: true },
      },
      {
        path: "userId",
        model: User,
        select: "firstname surname email",
        match: { is_active: true },
      },
    ])
    .sort({ createdAt: "desc" });
  if (courseData) {
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
  if (referralCode) {
    return referralCode;
  } else {
    return null;
  }
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Save user query
 *
 * @param {param}
 * @returns {Object|null}
 */

async function saveQuery(param) {
  try {
    console.log("saveQuery Param", param);
    const firstname = param.first_name;
    const surname = param.surname;
    const contact_number = param.mobile_number;
    const email = param.email;
    const query = param.query;

    const queryData = await Userquery.create({
      first_name: param.first_name,
      surname: param.surname,
      email: param.email,
      mobile_number: param.mobile_number,
      query: param.query,
    });

    const userQueryData = await queryData.save();
    console.log("userQueryData", userQueryData);

    const emailExisted = await User.find({
      email: email,
    });
    console.log("emailExisted", emailExisted);
    
    //For Brevo email for user query
    let updateContact;
    let addContact;
      //Email for user
    if(emailExisted.length > 0 && emailExisted[0].role === 'ambassador' ){
      updateContact = await updateContactAttributeBrevoForQuery(email, firstname, surname, contact_number, query, email)
    } else {
      addContact = await addContactInBrevoForQuery(email, firstname, surname, contact_number, query);
    };

    const variables1 = {
      SUBSCRIBER_FIRSTNAME: firstname,
      SUBSCRIBER_LASTNAME: surname,
    }
    const receiverName = firstname + " " + surname;
    const receiverEmail = email;
    let sendEmail
    if(updateContact || addContact){
      sendEmail = await sendEmailByBrevo(77, receiverEmail, receiverName, variables1);
    }

    if(emailExisted.length === 0 || emailExisted[0].role !== 'ambassador'){
      console.log("deleteContactBrevo condition is working");
      console.log("deleteContactBrevo receiverEmail", receiverEmail);
      if(sendEmail){
        await deleteContactBrevo(receiverEmail);
      }
    };

    const variables2 = {
      SUBSCRIBER_FIRSTNAME: firstname,
      SUBSCRIBER_LASTNAME: surname,
      CONTACT_NUMBER: contact_number,
      QUERY: query,
      QUERY_EMAIL: email
    }
    //Email for Guild Admin
    //guild@skilltechsa.co.za
    await updateContactAttributeBrevoForQuery('guild@skilltechsa.co.za', firstname, surname, contact_number, query, email);
    await sendEmailByBrevo(80, 'guild@skilltechsa.co.za', 'High Vista Guild', variables2);

    return userQueryData;
  } catch (error) {
    console.log("Error in creating or saving query:", error);
    return null;
  }
};

async function addContactInBrevoForQuery(email, firstname, surname, contact_number, query) {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let createContact = new SibApiV3Sdk.CreateContact();

    createContact.email = email;
    createContact.listIds = [9];
    createContact.attributes = {
      FIRSTNAME: firstname,
      LASTNAME: surname,
      CONTACT_NUMBER: contact_number,
      SUBSCRIBER_FIRSTNAME: firstname,
      SUBSCRIBER_LASTNAME: surname,
      QUERY: query
    };
    
    const data = await apiInstance.createContact(createContact);
    console.log('addContactInBrevoForQuery API called successfully. Returned data: ' + JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error in sending Brevo email:", error.message);
    return null;
  }
};

async function updateContactAttributeBrevoForQuery(email, firstname, surname, contact_number, query, query_email) {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;

    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new SibApiV3Sdk.ContactsApi();

    let identifier = email; 
    let updateContact = new SibApiV3Sdk.UpdateContact(); 

    updateContact.attributes = {'SUBSCRIBER_FIRSTNAME':firstname, 'SUBSCRIBER_LASTNAME':surname, 'CONTACT_NUMBER':contact_number, 'QUERY': query, 'QUERY_EMAIL': query_email};

    const data = await apiInstance.updateContact(identifier, updateContact);
    console.log('updateContactAttributeBrevoForQuery API called successfully. Returned data: ' + JSON.stringify(data));
    return 'Updated';
  } catch {
    console.log("Error in sending Brevo email:", error.message);
    return null;
  }
};


/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Cancel Payfast payment
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function cancelPayfastPayment(req) {
  const token_generated = req.body.token; 
    
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

// cron.schedule('*/1 * * * *', () => {
//   getpayfastTransactionHistory();
//   console.log('Successfully triggered');
//   });
// async function getpayfastTransactionHistory() {
//   function generateTimestamp() {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     const seconds = String(now.getSeconds()).padStart(2, '0');
//     const timezoneOffset = now.getTimezoneOffset();
//     const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
//     const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
//     const offsetSign = timezoneOffset < 0 ? '+' : '-';
//     const formattedOffset = `${offsetSign}${offsetHours}:${offsetMinutes}`;
//     return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formattedOffset}`;
//   }

//   function generateSignature() {
//     let timestamp = generateTimestamp();
//     console.log("Timestamp: ", timestamp);
//     const data = {
//         'date': '2024-07-24',
//         'merchant-id': process.env.PAYFAST_MERCHANT_ID,
//         'passphrase': process.env.PAYFAST_PASSPHRASE,
//         'timestamp': timestamp,
//         'version': 'v1'
//     };

//     const orderedKeys = ['date', 'merchant-id', 'passphrase', 'timestamp', 'version'];
//     let pfOutput = orderedKeys.map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`).join('&');
//     console.log("signature String", pfOutput);

//     const signature = crypto.createHash("md5").update(pfOutput).digest("hex");
//     return signature;
//   }
//   let signature = generateSignature();
//   console.log("Signature: ", signature);
// }


/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Get Payfast payment status
 *
 * @param {param}
 *
 * @returns Object|null
 */
// cron.schedule('*/1 * * * *', () => {
//   getPayfastPaymentStatus();
//   console.log('Successfully triggered');
// });

// async function getPayfastPaymentStatus(req) {
//   // const token_generated = req.body.token;
  
//   function generateTimestamp() {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     const seconds = String(now.getSeconds()).padStart(2, '0');
//     const timezoneOffset = now.getTimezoneOffset();
//     const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
//     const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
//     const offsetSign = timezoneOffset < 0 ? '+' : '-';
//     const formattedOffset = `${offsetSign}${offsetHours}:${offsetMinutes}`;
//     return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formattedOffset}`;
//   }

//   function generateSignature() {
//     const data = {
//         'merchant-id': process.env.PAYFAST_MERCHANT_ID,
//         'passphrase': process.env.PAYFAST_PASSPHRASE,
//         'timestamp': generateTimestamp(),
//         'version': 'v1'
//     };

//     const orderedKeys = ['merchant-id', 'passphrase', 'timestamp', 'version'];
//     let pfOutput = orderedKeys.map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`).join('&');
//     console.log("signature String", pfOutput);

//     const signature = crypto.createHash("md5").update(pfOutput).digest("hex");
//     console.log("signature", signature);
//     return signature;
//   }

//   try {
//       const token = '6cdd65ec-f079-4df9-985b-86805f50ea09';
//       // const token = token_generated;
//       const merchantId = process.env.PAYFAST_MERCHANT_ID;
//       const signature = generateSignature();
//       const timestamp = generateTimestamp();
  
//       console.log("Merchant ID:", merchantId);
//       console.log("Signature:", signature);
//       console.log("Timestamp:", timestamp);
  
//       const url = `https://api.payfast.co.za/subscriptions/${token}/fetch?testing=true`;
//       const version = 'v1';
  
//       const options = {
//           headers: {
//               'merchant-id': merchantId,
//               'version': version,
//               'timestamp': timestamp,
//               'signature': signature
//           }
//       };
  
//       console.log("Request URL:", url);
//       console.log("Request Options:", options);
  
//       const response = await axios.put(url, null, options);
//       console.log("Request response:", response);

//       if (response.status === 200) {
//           console.log("Data found successful.");
//           return response.data;
//       } else {
//           console.error("Data not found:", response.data);
//           return response.data;
//       }
//   } catch (err) {
//       if (err.response) {
//           // The request was made and the server responded with a status code
//           console.error("Response data:", err.response.data);
//           console.error("Response status:", err.response.status);
//           console.error("Response headers:", err.response.headers);
//       } else if (err.request) {
//           // The request was made but no response was received
//           console.error("Request data:", err.request);
//       } else {
//           // Something happened in setting up the request that triggered an Error
//           console.error("Error message:", err.message);
//       }
//       console.error("Config:", err.config);
//       throw err;
//   }
// };


/*****************************************************************************************/
/*****************************************************************************************/
/**
 * remove user courses
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function cancelCourseByUser(req) {
  console.log("id", req.params.id);  
  try {
    const orderId = req.params.id;
    const userId = req.body.userId;

    const statusData = {
      is_active: false,
      cancellation_date: new Date(),
    };
    console.log("statusData====>", statusData);

    const removedCourse = await Purchasedcourses.findOneAndUpdate(
      { _id: orderId },
      statusData,
      { new: true }
    );
    console.log("removeCourse====>", removedCourse);
    if (!removedCourse) {
      console.log("Course not found for id:", orderId);
      return null;
    };

    const updateCourseStatus = await Subscriptionpayment.findOneAndUpdate(
      { _id: removedCourse.orderid },
      {is_active: false},
      { new: true }
    );
    console.log("updateCourseStatus", updateCourseStatus);

    //For blocking the user on unsubscription
    const userBlocked = await User.findOneAndUpdate(
      { _id: userId },
      {is_active: false, subscription_cancellation_date: new Date()},
      { new: true }
    );
    console.log("userBlocked successfully:", userBlocked);

    //For Changing status of Referral code used on unsubscription
    const referralStatus = await Referral.findOneAndUpdate(
      { purchagedcourseId: orderId},
      {is_active: false},
      { new: true }
    );
    console.log("referral status changed successfully:", referralStatus);

    //For Brevo email to SUBSCIBER, when user unsubscribe the subscription
    const subscriberName = `${userBlocked.firstname} ${userBlocked.surname}`
    console.log("subscriberName", subscriberName);
    let sendEmail;
    sendEmail = await sendEmailByBrevo(14, userBlocked.email, subscriberName);
    if(userBlocked.role === "ambassador"){
      if(sendEmail){
          await commonService.deleteContactBrevo(receiverEmail);
      }
    };

    //For Brevo email to AMBASSADOR, when user unsubscribe the subscription
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
        await sendUpdatedContactEmailByBrevo(38, receiverEmail, ambassadorName, variables, subscriber_firstname, subscriber_lastname);
      };
    }

    console.log("Course removed successfully:", removedCourse);
    return removedCourse;
  } catch (err) {
    console.log("Error:", err);
    throw err;
  }
}

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * remove user courses
 *
 * @param {param}
 *
 * @returns Object|null
 */
const subscriptionUuId = uuidv4();
console.log("Subscription UuID:", subscriptionUuId);


/*****************************************************************************************/
/*****************************************************************************************/
/**
 * get defaulted subscription payment of subscribers
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function getDefaultedSubscriptionPaymentOfSubscribers(req) {
  try {
    let param = req.params;
    let id = req.body.userId;
    let query = {};

    if (param && param.start_date && param.end_date) {
      query.subscription_stopped_payment_date = {
        $gte: new Date(param.start_date),
        $lte: new Date(param.end_date),
      };
    }

    const ambassador = await User.findById(id);
    const referrals = await Referral.find({ referral_code: ambassador.referral_code });
    const userIds = referrals.map(referral => referral.userId);

    // query.role = 'subscriber';
    query.is_active = false;
    query.subscription_cancellation_date = null;

    const subscriptionData = [];

    const formatDate = (dateString) => {
      if (!dateString) return "none";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    for (const userId of userIds) {
      const subscriptions = await User.find({
        ...query,
        _id: userId,
      })
        .select('firstname surname subscription_stopped_payment_date is_active')
        .exec();


      const result = subscriptions.map(data => ({
        Subscriber_firstname: data.firstname,
        Subscriber_lastname: data.surname,
        payment_status: 'Insufficient funds',
        last_paid_date: formatDate(data.subscription_stopped_payment_date),
      }));

      subscriptionData.push(...result);
    }

    console.log("subscriptions", subscriptionData);

    return subscriptionData;
  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * get data of active referrals
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function getActiveReferral(req) {
  try {
    let param = req.params;
    let id = req.body.userId;
    let query = {
      purchagedcourseId: { $ne: null },
      is_active: true
    };

    if (param && param.start_date && param.end_date) {
        query.createdAt = {
            $gte: new Date(param.start_date),
            $lte: new Date(param.end_date)
        };
    }

    const ambassador = await User.findById(id);
    query.referral_code = ambassador.referral_code;

    const activeReferral = await Referral.find(query)
    .populate({
      path: 'userId',
      model: User,
      select: 'firstname surname'
    })
    .exec();

    console.log("activeReferral", activeReferral);
     
    if (activeReferral.length > 0) {
        const result = activeReferral.filter(data => data.userId !== null).map(data => {
          const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
          };
            return {
              Subscriber_firstname: data.userId.firstname,
              Subscriber_lastname: data.userId.surname,
              referral_used_date: formatDate(data.createdAt),
              referral_status: 'Active'
            };
        }).filter(entry => entry !== null);
        console.log(result);
        return result;
    } else {
        return [];
    }
} catch (error) {
    console.error('An error occurred:', error);
    throw error;
}
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * get data of inactive referrals
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function getInactiveReferral(req) {
  try {
    let param = req.params;
    let id = req.body.userId;
    let query = {
      purchagedcourseId: { $ne: null },
      is_active: false
    }; 

    if (param && param.start_date && param.end_date) {
        query.createdAt = {
            $gte: new Date(param.start_date),
            $lte: new Date(param.end_date)
        };
    }

    const ambassador = await User.findById(id);
    query.referral_code = ambassador.referral_code;

    const inactiveReferral = await Referral.find(query)
    .populate({
      path: 'userId',
      model: User,
      select: 'firstname surname'
    })
    .exec();

    console.log("inactiveReferral", inactiveReferral);
    
    if (inactiveReferral.length > 0) {
        const result = inactiveReferral.filter(data => data.userId !== null).map(data => {
            const formatDate = (dateString) => {
              const date = new Date(dateString);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
            };
            return {
              Subscriber_firstname: data.userId.firstname,
              Subscriber_lastname: data.userId.surname,
              referral_used_date: formatDate(data.createdAt),
              referral_status: 'Inactive'
            };
        }).filter(entry => entry !== null);
        console.log(result);
        return result;
    } else {
        return [];
    }
} catch (error) {
    console.error('An error occurred:', error);
    throw error;
}
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Get data of cancelled subscription
 *
 * @param {param}
 *
 * @returns Object|null
 */ 
async function getSubscriptionCancelledbySubscriber(req) {
  try {
    let param = req.params;
    let id = req.body.userId;
    
    const ambassador = await User.findById(id);
    const referrals = await Referral.find({ referral_code: ambassador.referral_code, purchagedcourseId: { $ne: null } });
    console.log("referralss: ", referrals);
    const userIds = referrals.map(referral => referral.userId);

    console.log("Ambassador userID numbetrs: ", userIds);

    let query = {};
    if (param && param.start_date && param.end_date) {
      query.subscription_cancellation_date = {
        $gte: new Date(param.start_date),
        $lte: new Date(param.end_date),
      };
    }
    query.is_active = false;
    query.subscription_stopped_payment_date = null;
    // query.role = 'subscriber';

    const subscriptionData = [];

    const formatDate = (dateString) => {
      if (!dateString) return "none";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    for (const userId of userIds) {
      const subscriptions = await User.find({
        ...query,
        _id: userId,
      })
        .select('firstname surname subscription_cancellation_date')
        .exec();
        console.log("subscriptions data", subscriptions);

      const result = subscriptions.map(data => ({
        Subscriber_firstname: data.firstname,
        Subscriber_lastname: data.surname,
        cancellation_date: formatDate(data.subscription_cancellation_date),
      }));

      subscriptionData.push(...result);
    }

    console.log("subscriptions", subscriptionData);

    return subscriptionData;
  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
}
// async function getSubscriptionCancelledbySubscriber(param) {
//   try {
//     const startDate = param && param.start_date ? new Date(param.start_date) : new Date(0);
//     const endDate = param && param.end_date ? new Date(param.end_date) : new Date();
//     const pipeline = [
//         {
//             $match: {
//                 is_active: false,
//                 cancellation_date: {
//                     $gte: new Date(startDate),
//                     $lte: new Date(endDate)
//                 }
//             }
//         },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "userId",
//                 foreignField: "_id",
//                 as: "user"
//             }
//         },
//         {
//             $unwind: "$user"
//         },
//         {
//             $match: {
//                 "user.role": "subscriber"
//             }
//         },
//         {
//             $project: {
//                 _id: 0,
//                 Subscriber_firstname: "$user.firstname",
//                 Subscriber_lastname: "$user.surname",
//                 referral_code: "$user.referral_code",
//                 cancellation_date: 1
//             }
//         },
//         {
//             $sort: {
//                 cancellation_date: -1
//             }
//         }
//     ];

//     const cancellationRecords = await Purchasedcourses.aggregate(pipeline);
    
//     const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         const day = String(date.getDate()).padStart(2, '0');
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const year = date.getFullYear();
//         return `${day}-${month}-${year}`;
//     };
//     const formattedRecords = cancellationRecords.map(record => ({
//         ...record,
//         cancellation_date: formatDate(record.cancellation_date)
//     }));
//     console.log("getSubscriptionCancelledBySubscriber.......", cancellationRecords);
//     return formattedRecords;
// } catch (error) {
//     console.error("Error in getSubscriptionCancelledBySubscriber:", error);
//     throw error;
// }
// }
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Get data of YLD Ambassador
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function getPaymentDue(req) {
  try {
    let param = req.params;
    let query = {
      referral_code: req.body.referral_code,
      purchagedcourseId: { $ne: null },
      is_active: true
    };
    console.log("req.body.referral_code*********", req.body.referral_code)

    if (param && param.start_date && param.end_date) {
        query.createdAt = {
            $gte: new Date(param.start_date),
            $lte: new Date(param.end_date)
        };
    }
    const subscribers = await Referral.find(query)
    .populate({
      path: 'userId',
      model: User,
      select: 'firstname surname'
    })
    .exec();
    console.log("subscribers", subscribers);


    if (subscribers.length > 0) {
      const result = subscribers.map(data => {
          return {
            Subscriber_firstname: data.userId.firstname,
            Subscriber_lastname: data.userId.surname,
            referral_code: req.body.referral_code,
            referral_status: 'Active',
          };
      }).filter(entry => entry !== null);
      console.log(result);
      return result;
    } else {
        return [];
    }
  } catch (error) {
      console.error('An error occurred:', error);
      throw error;
  }

}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * get data of referrals of this month of subscribers to the ambassador
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function getReferralsThisMonth(req) {
  try {
    let { id } = req.params;

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    let query = {
      purchagedcourseId: { $ne: null },
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
    }
    };

    const ambassador = await User.findById(id);
    query.referral_code = ambassador.referral_code;

    const referral = await Referral.find(query)
    .populate({
      path: 'userId',
      model: User,
      select: 'firstname surname is_active'
    })
    .exec();

    console.log("referral", referral);
    
    if (referral.length > 0) {
        const result = referral.map(data => {
            return {
              firstname: data.userId.firstname,
              surname: data.userId.surname,
              referral_used_date: data.createdAt,
              referral_status: data.is_active == false ? "Inactive" : "Active"
            };
        });
        console.log("getReferralsThisMonth result", result);
        return result;
    } else {
        return [];
    }
} catch (error) {
    console.error('An error occurred:', error);
    throw error;
}
}
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Manages to get Ambassador's monthly pay
 *  
 * @param {param}
 * 
 * @returns Object|null
 */

async function getAmbassadorMonthlyPay(req) {
  try {
    const userId = req.params.id;
    console.log("getAmbassadorMonthlyPay referralCode", req.params);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let lastFourMonthsData = [];

    for (let i = 1; i <= 4; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      
      if (month < 0) {
        month += 12;
        year -= 1;
      }

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // Last day of the month

      const ambassadorData = await User.findById(userId).select('referral_code');
      const referralCode = ambassadorData.referral_code;
      console.log("getAmbassadorMonthlyPay referralCode", referralCode);

      let query = {
        referral_code: referralCode,
        purchagedcourseId: { $ne: null },
        is_active: true,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      const subscribers = await Referral.find(query);
      console.log("getAmbassadorMonthlyPay subscribers: ", subscribers);
      
      const referralCount = subscribers.filter(referral => referral.referral_code === referralCode).length;
      const monthlyPay = referralCount * 5;

      lastFourMonthsData.push({
        month: startDate.toLocaleString('default', { month: 'long' }),
        monthly_pay: monthlyPay
      });
    }
    console.log("getAmbassadorMonthlyPay lastFourMonthsData: ", lastFourMonthsData);
    return lastFourMonthsData;
  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
};

/*****************************************************************************************/
/*****************************************************************************************/
/**
 * For varify email for forgot password
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function varifyEmailForgotPassword(req) {
  console.log("req.params.id", req.params.id);
  const emailId = req.params.id;

  try {
      const userData = await User.find({ email: emailId }).select('_id firstname surname email role is_pass_reset');
      console.log("userData", userData);

      if(!userData){
        return
      }

      const userId = userData[0]._id;
      const firstname = userData[0].firstname;
      const surname = userData[0].surname;
      const email = userData[0].email;
      const id = userData[0]._id;
      const current_date_time = generateTimestamp();
      
      // Generate a JWT token
      // const payload = {
      //   id,
      //   dateTime: current_date_time,
      // };
      // const secretKey = '20240805'; // Use a secure key
      // const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });
      // console.log("token forgot password", token);
      // const forgot_password_link = `https://affiliate.skilltechsa.online/forgot-password?var=${token}`
      

      //Encode id and date_time
      const reset_token = { id: id, current_date_time: current_date_time };
      const tokenString = JSON.stringify(reset_token); // Convert object to JSON string
      const tokenData = btoa(tokenString); // Encode the JSON string to Base64

      // const forgot_password_link = `https://affiliate.skilltechsa.online/forgot-password?reset-token=${tokenData}`
      const forgot_password_link = `https://highvista.co.za/forgot-password?reset-token=${tokenData}`

      //Brevo email for changing password
      let addSubscriber;
      let updateContact;
      // if(userData[0].role !== 'ambassador' && userData[0].is_pass_reset === false){
      if(userData.length > 0 && userData[0].role !== 'ambassador' && userData[0].role !== 'admin'){
        addSubscriber = await addSubscriberContactInBrevo(email, firstname, surname, forgot_password_link, userId)
      } else {
        updateContact = await updateContactAttributeBrevo(email, "", "", forgot_password_link)
      };

      const variables = {
        FIRSTNAME: firstname,
        LASTNAME: surname,
        TOKEN_FORGOT_PASSWORD: forgot_password_link,
      }
      const receiverName = firstname + " " + surname;
      const receiverEmail = email;
      let sendEmail;
      if(addSubscriber || updateContact){
        sendEmail = await sendEmailByBrevo(79, receiverEmail, receiverName, variables);
      };

      if(userData[0].role !== 'ambassador' && userData[0].role !== 'admin'){
        if(sendEmail){
          await deleteContactBrevo(email);
        }
      };

      return userData;
      
  } catch (err) {
      console.error("Error in getting user data:", err);
      return false;
  }  
};

function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/*****************************************************************************************/
/*****************************************************************************************/
