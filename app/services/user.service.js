const config = require('../config/index');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const msg = require("../helpers/messages.json");
const { User } = require('../helpers/db');

module.exports = {
    create
};

async function create(param) {
    try {

        if (await User.findOne({ email: param.email })) {
            throw 'email "' + param.email + '" is already taken';
        }
    
        const user = new User({
            name: param.name,
            email: param.email,
            password: bcrypt.hashSync(param.password, 10),
            role: "user",
            purchase_type: param.purchase_type,
            isActive: true
        });
    
        const data = await user.save();
    
        if (data) {
    
            let res = await User.findById(data.id).select("-password -social_accounts -reset_password -image_url");
    
            if (res) {
                return res;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (err) {
        console.log('Error', err);
        return false;
    }
   
}