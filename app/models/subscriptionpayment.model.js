var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;
const schema = new Schema({
    plan_name: { type: String, required: false, default: '' },
    payment_mode: { type: String, required: false, default: '' },
    payment_status: { type: String, required: false, default: '' },
    amount: { type: String, required: false, default: '' },
    payment_cycle: { type: String, required: false, default: '' },
    is_recurring: { type: String, required: false, default: '' },
    userid: { type: String, required: false, default: '' },
    is_active: { type: Boolean, required: false, default: true }
},{
    timestamps: true
});

schema.set('toJSON',{ virtuals: true, versionKey: false });

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('Subscriptionpayment',schema);
