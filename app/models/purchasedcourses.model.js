var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    courseid: { type: String, required: false, default: "" },
    quantity: { type: Number, required: false, default: 1 },
    orderid: {
      type: Schema.Types.ObjectId,
      ref: "Subscriptionpayment",
      required: false,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    course_title: { type: String, required: false, default: "" },
    course_price: { type: String, required: false, default: "" },
    image: { type: String, required: false, default: "" },
    paymentType: { type: String, required: false, default: "" },
    course_category: { type: String, required: false, default: "" },
    cancellation_date: { type: Date, required: false, default: null },
    stopped_payment_date: { type: Date, required: false, default: null },
    is_active: { type: Boolean, required: false, default: true },
  },
  {
    timestamps: true,
  }
);

schema.set("toJSON", { virtuals: true, versionKey: false });

schema.plugin(mongoosePaginate);

module.exports = mongoose.model("Purchasedcourses", schema);
