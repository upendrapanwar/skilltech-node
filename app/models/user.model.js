var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;
const schema = new Schema({
    firstname: { type: String, required: false, default: '' },
    surname: { type: String, required: false, default: '' },
    id_number: { type: String, required: false, default: '' },
    email: { type: String, unique: false, required: false, index: true, default: '' },
    mobile_number: { type: String, required: false, default: '' },
    alternate_mobile_number: { type: String, required: false, default: '' },
    street: { type: String, required: false, default: '' },
    street_name: { type: String, required: false, default: '' },
    complex_n_unit: { type: String, required: false, default: '' },
    suburb_district: { type: String, required: false, default: '' },
    town_city: { type: String, required: false, default: '' },
    province: { type: String, required: false, default: '' },
    postal_code: { type: String, required: false, default: '' },
    //payment_option: { type: String, required: false, default: '' },
    //account_holder_title: { type: String, required: false, default: '' },
    account_holder_name: { type: String, required: false, default: '' },
    //account_holder_surname: { type: String, required: false, default: '' },
    bank: { type: String, required: false, default: '' },
    branch: { type: String, required: false, default: '' },
    branch_code: { type: String, required: false, default: '' },
    type_of_account: { type: String, required: false, default: '' },
    account_number: { type: String, required: false, default: '' },
    bank_contact_details: {
        email: { type: String, required: false, default: '' },
        mobile_number: { type: String, required: false, default: '' },
        alternate_mobile_number: { type: String, required: false, default: '' },
        street: { type: String, required: false, default: '' },
        street_name: { type: String, required: false, default: '' },
        complex_n_unit: { type: String, required: false, default: '' },
        suburb_district: { type: String, required: false, default: '' },
        town_city: { type: String, required: false, default: '' },
        province: { type: String, required: false, default: '' },
        postal_code: { type: String, required: false, default: '' },
    },
    method_of_communication:{
        email: { type: String, required: false, default: "" },
        whatsapp: { type: String, required: false, default: "" },
        sms: { type: String, required: false, default: 0 },
        phone_call: { type: String, required: false, default: "" },
    }, 
    policy_consent:{
        ecommercePolicy: { type: Boolean, required: false, default: false },
        privacy: { type: Boolean, required: false, default: false },
        userConsent: { type: Boolean, required: false, default: false },
    }, 
    opt_in_promotional:{
        receive_monthly_newsletters: { type: String, required: false, default: "" },
        exclusive_deals_promotions: { type: String, required: false, default: "" },
        keep_in_loop: { type: String, required: false, default: 0 }
    },
    race: { type: String, required: false, default: '' },
    gender: { type: String, required: false, default: '' },
    qualification: { type: String, required: false, default: '' },
    //employed: { type: String, required: false, default: '' },
    //occupation: { type: String, required: false, default: '' },
    how_did_you_hear_about_us: {
        social_media_page: { type: String, required: false, default: "" },
        our_website: { type: String, required: false, default: "" },
        referred_by_ambassador: { type: String, required: false, default: "" },
        referred_by_friend: { type: String, required: false, default: "" },
        stumbled_on_browsing: { type: String, required: false, default: "" },
        other_option: { type: String, required: false, default: "" }
    },
    //reasons_for_subscribing: { type: String, required: false, default: '' },
    //how_did_you_hear_about_us_other: { type: String, required: false, default: '' },
    //topic_interest: { type: String, required: false, default: '' },
    //referredby: { type: String, required: false, default: '' },
    //referredby_firstname: { type: String, required: false, default: '' },
    //referredby_surname: { type: String, required: false, default: '' },
    referral_code: { type: String, required: false, default: '' },
    qr_code: { type: String, required: false, default: '' },
    //referredby_email: { type: String, required: false,default: '' },
    //referredby_mobile_number: { type: String, required: false, default: '' },
    refer_friend: { type: String, required: false, default: '' },
    //center_to_assist: { type: String, required: false, default: '' },
    //earn_cash_as_ambassador: { type: String, required: false, default: '' },
    certificate: { type: String, required: false, default: '' },
    //highest_qualication_certificate: { type: String, required: false, default: '' },
    bank_proof: { type: String, required: false, default: '' },
    //pop: { type: String, required: false, default: '' },
    //authname: { type: String, required: false, default: '' },
    //signature: { type: String, required: false, default: '' },
    //signed_place: { type: String, required: false, default: '' },
    //signed_on: { type: String, required: false, default: '' },
    privacy: { type: String, required: false, default: '' },
    ecommercePolicy: { type: String, required: false, default: '' },
    promotional_consent: { type: String, required: false, default: '' },
    // deals_promotion: { type: String, required: false, default: '' },
    // in_loop: { type: String, required: false, default: '' },
    confirm_details: { type: String, required: false, default: '' },
    terms_n_condition: { type: String, required: false, default: '' },
    update_information: { type: String, required: false, default: '' },
    password: { type: String, required: false, default: '' },
    social_accounts: {
        google: {
            google_id: { type: String, required: false, default: null, index: true },
            google_data: {},
        },
        facebook: {
            facebook_id: { type: String, required: false, default: null, index: true },
            facebook_data: {},
        }
    },
    role: { type: String, require: false, default: 'learner' },
    image_url: { type: String, required: false, default: null },
    is_active: { type: Boolean, required: false, default: true },
    reset_password: { 
        verify_code: { type: String, required: false, default: null },
        code_valid_at: { type: Date, required: false, default: null },
        is_pass_req: { type: Boolean, required: false, default: false }
    },
    is_pass_reset: { type: Boolean, required: false, default: false },
    subscription_date:{ type:Date, required:false, default:null },
    subscription_cancellation_date:{type:Date, required:false, default:null},
    subscription_stopped_payment_date:{type:Date, required:false, default:null},
    ambassador_date:{type:Date, required:false, default:null},
    moodle_pass:{type:String, required:false, default:''},
    moodle_login_id:{type:String, required:false, default:''},
    cart_items: { type: [{
        title: {type:String, required:false, default:''},
        quantity: { type: Number, required: true, default: 1 },
        price: {type: Number, required:false, default:''},
    }], required: false, default: [] },
},{
    timestamps: true
});

schema.set('toJSON',{ virtuals: true, versionKey: false });

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('User',schema);
