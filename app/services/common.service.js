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
    user: "highvista@skilltechsa.online", // generated ethereal user
    pass: "FT7q5O0nYNJ6hzwg", // generated ethereal password
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
  sendEmailToAmbassador,
  payFastNotify,
  getSubscriptionId,
  getDefaultedSubscriptionPaymentOfSubscribers,
  getActiveReferral,
  getInactiveReferral,
  getPaymentDueThisMonth, 
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
      password: bcrypt.hashSync(param.password, 10),
      role: "learner",
      isActive: true,
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
  console.log(); 
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
    console.log(user);
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
          opt_in_promotional: {
            receive_monthly_newsletters: param.monthly_newsletters,
            exclusive_deals_promotions: param.deals_promotion,
            keep_in_loop: param.in_loop
          },
          race: param.race,
          gender: param.gender,
          qualification: param.qualification,
          how_did_you_hear_about_us: param.how_did_you_hear_about_us,
          // opt_in_promotional: param.opt_in_promotional,
          authname: param.firstname + " " + param.surname,
          privacy: param.privacy,
          ecommercePolicy: param.ecommercePolicy,
          // deals_promotion: param.deals_promotion,
          // in_loop: param.in_loop,
          role: "subscriber",
          subscription_date: new Date(),
        }, 
      },
    ]);
    //console.log('user',result);

    if (result) {
      let res = await User.findById(param.uid).select(
        "-password -community -social_accounts -reset_password -image_url -phone"
      );
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
            const updateReferral = await Referral.findOneAndUpdate(
              { referral_code: referralCode, userId: param.userid},
              { $set: { purchagedcourseId:  purchagedcourseId} },
              { new: true }
              );
              console.log("updateReferral", updateReferral)
            }
          }
        }else{
          console.log(" Payment is Cancelled")
        }
        return res;
      } else {
        return false;
      }
    } else {
      console.log("error in res ")
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
 * Manages user for ambassador subscription
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function ambassador_subscription(param) {
  const res = param.certificate;
  const base64Data = res.replace(/^data:([A-Za-z-+/]+);base64,/, "");
  let certificateName =
    "CER-" + Math.floor(Math.random() * 1000000) + "-" + Date.now() + ".pdf";
  let certificatePath = path.join(
    __dirname,
    "../../uploads/certificate/" + certificateName
  );
  fs.writeFileSync(certificatePath, base64Data, { encoding: "base64" });
  param.certificate = "uploads/certificate/" + certificateName;

  const res_bankproof = param.bank_proof;
  const base64DataBankProof = res_bankproof.replace(
    /^data:([A-Za-z-+/]+);base64,/,
    ""
  );
  let bankProofName =
    "CER-" + Math.floor(Math.random() * 1000000) + "-" + Date.now() + ".pdf";
  let bankProofPath = path.join(
    __dirname,
    "../../uploads/bank_proof/" + bankProofName
  );
  fs.writeFileSync(bankProofPath, base64DataBankProof, { encoding: "base64" });
  param.bank_proof = "uploads/bank_proof/" + bankProofName;

  var whereCondition = { _id: param.uid };
  const test = User.findOne(whereCondition);

  //console.log('test',test);
  //console.log('param',param);
  if (await User.findOne(whereCondition)) {
    //console.log('inside');
    result = await User.updateMany({ _id: param.uid }, [
      {
        $set: {
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
          bank_proof: param.bank_proof,
          type_of_account: param.type_of_account,
          account_number: param.account_number,
          ambassador_date: new Date(),
          //referredby: param.referredby,
          //referredby_firstname: param.referredby_firstname,
          //referredby_surname: param.referredby_surname,
          referral_code: param.referral_code,
          //referredby_email: param.referredby_email,
          //referredby_mobile_number: param.referredby_mobile_number,
          refer_friend: param.refer_friend,
          certificate: param.certificate,
          confirm_details: param.confirm_details,
          //terms_n_condition:param.terms_n_condition,
          update_information: param.update_information,
          //center_to_assist: param.center_to_assist,
          //pop: param.pop,
          //authname: param.firstname +' '+param.surname,
          //signature: param.signature,
          // signed_place: param.signed_place,
          // signed_on: param.signed_on,
          role: "ambassador",
        },
      },
    ]); 
    console.log('ambassador=',result);

    if (result) {
      let res = await User.findById(param.uid).select(
        "-password -community -social_accounts -reset_password -image_url -phone"
      );

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
async function getReferralCode() {
  const currentYear = new Date().getFullYear();
  
  const pipeline = [
    {
      $match: {
        role: "ambassador",
        $expr: {
          $eq: [{ $year: "$ambassador_date" }, currentYear]
        }
      }
    },
    {
      $count: "countReferral"
    }
  ];

  try {
    const result = await User.aggregate(pipeline);
    if (result.length > 0) {
      return result[0].countReferral;
    } else {
      return "0";
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

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
  console.log("reqData", reqData)
  const subscriptionPayment = new Subscriptionpayment({
    userid: reqData.userid,
    payment_status: reqData.payment_status,
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
    const {code} = req.params; 
    const referralCode = code;
    const { userId } = req.query;
    console.log("UserID", userId);
    console.log("referralCode", referralCode);

    // Check if referral code is already used
    const existingReferral = await Referral.findOne({ referral_code: referralCode, userId: userId });
    if (existingReferral) {
      return ;
    }

     // Referral code not used, proceed with creation
    const countReferral = await User.find({ referral_code: referralCode }).count();
    console.log("countReferral", countReferral);

    const qrCode = await User.find({ referral_code: referralCode }).select("qr_code");
    console.log("qrCode", qrCode);

    if (!qrCode || !qrCode[0].qr_code) {
      throw new Error("QR code not found for the user");
    }

    const referralData = await Referral.create({
      referral_code: referralCode,
      userId: userId,
      qr_code: qrCode[0].qr_code,
    });

    const newReferralData = await referralData.save();
    console.log("newReferralData", newReferralData);

    const data = {
      countReferral: countReferral,
      referralData: newReferralData,
    }

    return data;

  } catch (error) {
    console.error("Error:", error);
    return { status: 500, error: "Internal Server Error" }; // Error response
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
// async function getMyCourses(param) {
//   try {
//     console.log("code", param.id);

//     const subscriptionPayments = await Subscriptionpayment.find({ userid: param.id, payment_status: "success" });

//     const orderIds = subscriptionPayments.map(payment => payment.orderId);

//     const coursePurchageDetails = await Purchasedcourses.find({
//       userId: param.id,
//       is_active: true,
//       orderId: { $in: orderIds }
//     }).sort({ createdAt: "desc" });

//     return coursePurchageDetails;
//   } catch (error) {
//     console.error("Error:", error);
//     return null;
//   }
// }
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
    if (!param) {
      console.log("Param is missing here.");
      return null;
    }

    const queryData = await Userquery.create({
      first_name: param.first_name,
      surname: param.surname,
      email: param.email,
      mobile_number: param.mobile_number,
      query: param.query,
    });

    const userQueryData = await queryData.save();
    console.log(userQueryData);

    return userQueryData;
  } catch (error) {
    console.log("Error in creating or saving query:", error.message);
    return null;
  }
}
// async function saveQuery(param) {
//   try {
//     if (!param) {
//       console.log("Param is missing here.");
//       return null;
//     }

//     const queryData = await Userquery.create({
//       first_name: param.first_name,
//       surname: param.surname,
//       email: param.email,
//       mobile_number: param.mobile_number,
//       query: param.query,
//     });

//     const userQueryData = await queryData.save();
//     console.log(userQueryData);

//     let userName = `${param.first_name} ${param.surname}`
//     let info = await transporter.sendMail({
//       from: `${userName} ${param.email}`, // Sender address
//       to: 'guild@skilltechsa.co.za', // Recipient address
//       subject: `Query request from ${userName}`, // Subject line
//       text: `
//       Query:      
//       ${param.query}
//       `
//     });
//     console.log("Message sent: %s", info.messageId);
//     console.log("Message sent:", info);

//     return userQueryData;
//   } catch (error) {
//     console.log("Error in creating or saving query:", error.message);
//     return null;
//   }
// }
/*****************************************************************************************/
/*****************************************************************************************/
/**
 * Cancel Payfast payment
 *
 * @param {param}
 *
 * @returns Object|null
 */

// async function cancelPayfastPayment(req) {
//   const merchantData = req.body;
//   console.log("merchantData", merchantData)

//   function generateTimestamp() {
//     const now = new Date();
//     const offset = '+02:00';
//     const timezoneOffset = now.getTimezoneOffset();
//     const absTimezoneOffset = Math.abs(timezoneOffset);
//     const hours = Math.floor(absTimezoneOffset / 60);
//     const minutes = absTimezoneOffset % 60;
//     const timezoneString = `${offset.startsWith('-') ? '+' : '-'}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
//     const formattedTimestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}${timezoneString}`;
//     return formattedTimestamp;
//   }

//   function generateSignature() {
//         let pfOutput = "";
//       var data = merchantData.merchantData;
//       var passPhrase = 'quorum87ax36Revving';
//       for (let key in data) {
//         if (data.hasOwnProperty(key)) {
//           if (data[key] !== "") {
//             pfOutput += `${key}=${encodeURIComponent(data[key]).replace(
//               /%20/g,
//               "+"
//             )}&`;
//           }
//         }
//       }
//       let getString = pfOutput.slice(0, -1);
//       if (passPhrase !== null) {
//         getString += `&passphrase=${encodeURIComponent(passPhrase).replace(
//           /%20/g,
//           "+"
//         )}`;
//       }
//       const signature = crypto.createHash("md5").update(getString).digest("hex");
//       console.log("signature", signature);
//       return signature;
//       }

//   try {
//     const token = merchantData.token;
//     const merchantId = merchantData.merchantId;
//     const signature = generateSignature();
//     const timestamp = generateTimestamp();

//     const url = `https://api.payfast.co.za/subscriptions/${token}/cancel?testing=true`;
//     const version = 'v1';

//     const options = {
//       method: 'PUT',
//       headers: {
//         // 'Content-Type': 'application/x-www-form-urlencoded',
//         'merchant-id': merchantId,
//         'version': version,
//         'timestamp': timestamp,
//         'signature': signature
//       }
//     };

//     console.log("options", options);

//     const response = await new Promise((resolve, reject) => {
//       const req = https.request(url, options, res => {
//         let data = '';
//         res.on('data', chunk => {
//           data += chunk;
//         });
//         res.on('end', () => {
//           resolve({
//             status: res.statusCode,
//             data: JSON.parse(data)
//           });
//         });
//       });

//       req.on('error', error => {
//         reject(error);
//       });
//       req.end();
//     });

//     if (response.status === 200) {
//       console.log("Cancellation successful.");
//       return response;
//     } else {
//       console.error("Cancellation failed:", response.data);
//       return response.data;
//     }
//   } catch (err) {
//     console.log("Error:", err);
//     throw err;
//   }
// }

async function cancelPayfastPayment(req) {
  const merchantData = req.body;
  console.log("merchantData", merchantData);

  function generateTimestamp() {
    const now = new Date();
    const offset = '+02:00';
    const timezoneOffset = now.getTimezoneOffset();
    const absTimezoneOffset = Math.abs(timezoneOffset);
    const hours = Math.floor(absTimezoneOffset / 60);
    const minutes = absTimezoneOffset % 60;
    const timezoneString = `${offset.startsWith('-') ? '+' : '-'}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const formattedTimestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}${timezoneString}`;
    return formattedTimestamp;
  }

  function generateSignature() {
    let pfOutput = "";
    var data = merchantData.merchantData;
    var passPhrase = 'quorum87ax36Revving';
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
    const signature = crypto.createHash("md5").update(getString).digest("hex");
    console.log("signature", signature);
    return signature;
  }

  try {
    const token = merchantData.token;
    const merchantId = merchantData.merchantId;
    const signature = generateSignature();
    const timestamp = generateTimestamp();

    console.log("token", token);
    console.log("merchantId", merchantId);
    console.log("timestamp", timestamp);
    console.log("signature", signature);

    // const url = `https://sandbox.payfast.co.za/subscriptions/${token}/cancel`;
    const url = `https://api.payfast.co.za/subscriptions/${token}/cancel?testing=true`;
    const version = 'v1';

    const headers = {
      'merchant-id': merchantId,
      'version': version,
      'timestamp': timestamp,
      'signature': signature
    };

    const response = await axios.put(url, null, { headers });

    console.log("PayFast cancel response:", response.data);

    if (response.status === 200) {
      console.log("Cancellation successful.");
      return response;
    } else {
      console.error("Cancellation failed:", response.data);
    }
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
async function cancelCourseByUser(req) {
  console.log("id", req.params.id);  
  try {
    const id = req.params.id;

    const statusData = {
      is_active: false,
      cancellation_date: new Date(),
    };
    console.log("statusData====>", statusData);

    const removedCourse = await Purchasedcourses.findOneAndUpdate(
      { _id: id },
      statusData,
      { new: true }
    );
    console.log("removeCourse====>", removedCourse);
    if (!removedCourse) {
      console.log("Course not found for id:", id);
      return null;
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
 * Send email to ambassador
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function sendEmailToAmbassador(req) {
  try {
    const id = req.params.id;
    const ambassadorData = await User.findById(id).select("firstname surname email referral_code");
    console.log(ambassadorData);
    if (!ambassadorData) {
      throw new Error("Ambassador not found");
    }

    const adminData = await User.find({ role: "admin" }).select("firstname surname email");
    console.log(adminData);
    if (!adminData || adminData.length === 0) {
      throw new Error("Admin email not found");
    }

    const adminEmail = adminData[0].email; // Assuming there's only one admin email, you might need to adjust this based on your application logic
    const adminName = adminData[0].firstname + ' ' + adminData[0].surname;


    const url = `https://affiliate.skilltechsa.online/ambessador/ambassador-subscription?url=${ambassadorData.referral_code}`;
    const qrCode = await QRCode.toDataURL(url);
    console.log(qrCode);

    // Save QR code to the database
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: { qr_code: qrCode } },
      { new: true }
    );

    let info = await transporter.sendMail({
      from: `${adminName} ${adminEmail}`, // Sender address
      to: ambassadorData.email, // Recipient address
      subject: `Congratulation ${adminData.firstname} as Ambassador! `, // Subject line
      text: `
      Hello ${ambassadorData.firstname}, 
      
      Congratulations! 

      Begin new experience as an Ambasssador.
      
      Referral Code: <span style="font-weight: bold; color: blue">${ambassadorData.referral_code}</span>
      
      Get your QR code below:`,
      attachments: [
        {
            filename: 'qrcode.png',
            content: qrCode.split(';base64,').pop(),
            encoding: 'base64'
        }
    ]
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (err) {
    console.log("Error:", err);
    throw err;
  }
}
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
            query.createdAt = {
                $gte: new Date(param.start_date),
                $lte: new Date(param.end_date)
            };
        }
        
      const ambassador = await User.findById(id);
      query.referral_code = ambassador.referral_code;

      const referrals = await Referral.find(query)

      const userIds = referrals.map(referral => referral.userId);

      const subscriptions = await Subscriptionpayment.find({
        userid: { $in: userIds },
        payment_status: 'cancel'
      }).populate({
          path: 'userid',
          model: User,
          select: 'firstname surname'
      }).exec();

      console.log("subscriptions", subscriptions);
      const result = subscriptions.map(subscription => ({
          firstname: subscription.userid.firstname,
          surname: subscription.userid.surname,
          payment_status: subscription.payment_status
      }));

      console.log(result);
      return result;
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
      purchagedcourseId: { $ne: null }
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
        const result = activeReferral.map(data => {
            return {
              firstname: data.userId.firstname,
              surname: data.userId.surname,
              referral_used_date: data.createdAt,
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
      purchagedcourseId: null
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

    console.log("activeReferral", inactiveReferral);
    
    if (inactiveReferral.length > 0) {
        const result = inactiveReferral.map(data => {
            return {
              firstname: data.userId.firstname,
              surname: data.userId.surname,
              referral_used_date: data.createdAt,
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
 * get data of payment due to this month of ambassador
 *
 * @param {param}
 *
 * @returns Object|null
 */
async function getPaymentDueThisMonth(req) {
  try {
    let param = req.params;
    let id = req.body.userId;
    let query = {
      purchagedcourseId: { $ne: null }
    };

    const ambassador = await User.findById(id);
    
    query.referral_code = ambassador.referral_code;

    const dueReferralData = await Referral.find(query).exec();

    const activeReferralCount = dueReferralData.length;
    const amountDue = activeReferralCount * 5000;
    console.log("activeReferral", dueReferralData);
    
    if(activeReferralCount && amountDue) {
      return {
        referral_count: activeReferralCount,
        due_amount: amountDue,
      }
    } else {
          return [];
      }
  } catch (error) {
      console.error('An error occurred:', error);
      throw error;
  }
}
