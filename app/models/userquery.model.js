const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const schema = new Schema({
  first_name:{
        type:String,
        required:true,  
        default:''
    },
    
    surname:{
      type:String,
      required:true,
      default:''
    },

    email:{
     type:String,
     required:true,
     default:''
    },

    mobile_number:{
     type:String,
     required:true,
     default:''
    },

    query:{
      type:String,
      required:false,
      default:''
    },
},
{
   timestamps: true 
}
);

schema.set('toJSON',{ virtuals: false, versionKey: false });

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('Userquery',schema);
