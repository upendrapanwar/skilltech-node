var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const Schema = mongoose.Schema;

const schema = new Schema({
    benefactor_name: { type: String, required: false, default: '' },
    benefactor_email: { type: String, required: false, default: '' },
    benefactor_contact_firstname: { type: String, required: false, default: '' },
    benefactor_contact_surname: { type: String, required: false, default: '' },
    benefactor_contact_mobile_number: { type: String, required: false, default: '' },
    start_date_sponsored_subscription: { type:Date, required:false, default:null },
    end_date_sponsored_subscription: { type:Date, required:false, default:null },
    is_notified: {type: Boolean, required: false, default: false},
    }, 
 {
    timestamps:true
 });

schema.set("toJSON", { virtuals: true, versionKey: false });

schema.plugin(mongoosePaginate);

module.exports = mongoose.model("Sed", schema);
