
 const mongoose  = require('mongoose');
 const mongoosePaginate = requure('mongoose-pagination-v2')
 const Schema = mongoose.Schema;

 const referralSchema = new Schema({

   referral_code:{
    type:String,
    unique:true,
    required:false
   },

   isActive:{
    type:Boolean,
    required:false,
    default:true
   },

   used_by:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:[]
   }
 },
 {
    timestamps:true
 });
 
 Schema.set('toJSON',{ virtuals: true, versionKey: false });
 Schema.plugin(mongoosePaginate);

exports.default = mongoose.model("Referral",referralSchema);
