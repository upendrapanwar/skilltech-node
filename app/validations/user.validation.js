/**
 * File Name: User Validation
 * 
 * Description:Manages the validation for user module
 * 
 * Author: Skill Tech
 */
const joi = require('joi');
joi.objectId = require('joi-objectid')(joi);

const schema = {
    register: joi.object({
        name: joi.string().min(3).max(50).label("Name").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.min": "{{#label}} should not be less than 3 characters.",
            "string.max": "{{#label}} should not be greater than 50 characters.",
        }),
        email: joi.string().max(50).label("Email").email().message("{{#label}} address must be valid.").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        role: joi.string().label('Role').required(),
        password: joi.string().min(6).max(20).label("Password").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.min": "{{#label}} should not be less than 6 characters.",
            "string.max": "{{#label}} should not be greater than 50 characters."
        }),
        confirmPassword: joi.string().min(6).max(20).equal(joi.ref('password')).label("Confirm Password").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.min": "{{#label}} should not be less than 6 characters.",
            "string.max": "{{#label}} should not be greater than 50 characters.",
            'any.only': '{{#label}} does not match'
        }),
    }),
    login: joi.object({
        email: joi.string().max(50).label("Email").email().message("{{#label}} address must be valid.").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        role: joi.string().label('Role').required(),
        password: joi.string().min(6).max(20).label("Password").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.min": "{{#label}} should not be less than 6 characters.",
            "string.max": "{{#label}} should not be greater than 50 characters."
        }),
        
    }),
    subscriber_register: joi.object({
        firstname: joi.string().max(80).label("First Name").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.max": "{{#label}} should not be greater than 80 characters.",
        }),
        surname: joi.string().max(80).label("Surname").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.max": "{{#label}} should not be greater than 80 characters.",
        }),
        id_number: joi.string().label("ID Number").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
            
        }),
        email: joi.string().max(120).label("Email").email().message("{{#label}} address must be valid.").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        mobile_number: joi.string().max(14).label("Mobile Number").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.max": "{{#label}} enter valid number."
        }),
        alternate_mobile_number: joi.string().max(14).label("Alternate Mobile Number").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.max": "{{#label}} enter valid number."
        }),
        street: joi.string().label("Street").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        street_name: joi.string().label("Street Name").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        complex_n_unit: joi.string().label("Complex and Unit").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        
        suburb_district: joi.string().label("Suburb/District").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        town_city: joi.string().label("Town/City").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        province: joi.string().label("Province").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        postal_code: joi.string().min(4).max(8).label("Postal Code").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required.",
            "string.min": "{{#label}} should not be less 4 characters.",
            "string.max": "{{#label}} should not be greater than 8 characters."
        }),
        payment_option: joi.string().label("Payment Option").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        method_of_communication:joi.object().keys({
            email: joi.string(),
            whatsapp: joi.string(),
            sms: joi.string(),
            phone_call: joi.string(),
        }).required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        account_holder_title: joi.string().label("Account Holder Title").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        account_holder_name: joi.string().label("Account Holder Name").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        account_holder_surname: joi.string().label("Account Holder Surname").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        bank: joi.string().label("Bank").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        branch: joi.string().label("Branch").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        branch_code: joi.string().label("Branch Code").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        type_of_account: joi.string().label("Type of Account").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        account_number: joi.string().label("Account Number").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        
        race: joi.string().label("Race").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        gender: joi.string().label("Gender").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        qualification: joi.string().label("Qualification").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        employed: joi.string().label("Employed").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        occupation: joi.string().label("Occupation").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        how_did_you_hear_about_us: joi.string().label("How did you hear about us").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        reasons_for_subscribing: joi.string().label("Reasons for subscribing").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        referredby: joi.string().label("Referred By").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        referredby_firstname: joi.string().label("Referred by firstname").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        referredby_surname: joi.string().label("Referred by surname").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        referral_code: joi.string().label("Referred code").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        referredby_email: joi.string().label("Referred by email").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        referredby_mobile_number: joi.string().label("Referred by mobile number").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        refer_friend: joi.string().label("Refer a friend").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        center_to_assist: joi.string().label("Contact centre to assist you with your referrals").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        pop: joi.string().label("Protection of Personal Information").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        signature: joi.string().label("Signature").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        signed_place: joi.string().label("Signed At(Place)").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
        signed_on: joi.string().label("Signed on").required().messages({
            "string.empty": "{{#label}} is required.",
            "any.required": "{{#label}} is required."
        }),
    }),
};

/***********************************************************************/
/***********************************************************************/

module.exports = {
    registerValidation: async(req, res, next) => {
        const value = await schema.register.validate(req.body);
        console.log()
        getMessage(value, res, next);
    },
    loginValidation: async(req, res, next) => {
        const value = await schema.login.validate(req.body);
        console.log()
        getMessage(value, res, next);
    },
    subscriberRegisterValidation: async(req, res, next) => {
        const value = await schema.subscriber_register.validate(req.body);
        console.log()
        getMessage(value, res, next);
    }
};

/***********************************************************************/
/***********************************************************************/
/**
 * Handles all the message regarding validations
 * 
 * @param {*} value 
 * @param {*} res 
 * @param {*} next 
 * @returns bool
 */
function getMessage(value, res, next) {
    if (value.error) {
        res.status(400).json({ status: false, message: value.error.details[0].message });
    } else {
        if (typeof next === "undefined") {
            return true;
        } else {
            next();
        }

    }
}
