var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const Schema = mongoose.Schema;

const schema = new Schema({
  referral_code: { type: String, required: true, default: "" },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    default: null,
  },
  purchagedcourseId: {
    type: String,
    ref: "Purchasedcourses",
    required: false,
    default: null,
  },
  is_active: { type: Boolean, required: false, default: true },
 },
 {
    timestamps:true
 });

schema.set("toJSON", { virtuals: true, versionKey: false });

schema.plugin(mongoosePaginate);

module.exports = mongoose.model("Referral", schema);
