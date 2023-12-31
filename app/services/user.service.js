const config = require('../config/index');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const msg = require("../helpers/messages.json");
const { User } = require('../helpers/db');

module.exports = {
    create,
    updateProfileDetails,
    getProfileDetails,
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
/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Manages user for update profile data
 *  
 * @param {param}
 * 
 * @returns Object|null
 */
async function updateProfileDetails(param, data) {
    console.log("param", param);
    console.log("First name:", data.firstname);
    const whereCondition = { _id: param.id };
    try {
        const updatedData = await User.findOneAndUpdate(
            whereCondition,
            {
                $set: {
                    firstname: data.firstname,
                    surname: data.surname,
                    id_number: data.id_number,
                    subscriber_email: data.email,
                    mobile_number: data.mobile_number,
                    alternate_mobile_number: data.alternate_mobile_number,
                    street: data.street,
                    street_name: data.street_name,
                    complex_n_unit: data.complex_n_unit,
                    suburb_district: data.suburb_district,
                    town_city: data.town_city,
                    province: data.province,
                    postal_code: data.postal_code,
                    // method_of_communication:data.method_of_communication, 
                    // opt_in_promotional: data.opt_in_promotional,
                    race: data.race,
                    gender: data.gender,
                    qualification: data.qualification,
                }
            },
            { new: true }
        );

        if (updatedData) {
            return updatedData;
        } else {
            return false;
        }
    } catch (err) {
        console.error("Error updating profile details:", err);
        return false;
    }
}



/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Manages user to get profile data
 *  
 * @param {param}
 * 
 * @returns Object|null
 */

async function getProfileDetails(param) {
    try {
        console.log("param", param);
        const whereCondition = { _id: param.id };
        const profileData = await User.find(whereCondition).select("firstname surname id_number subscriber_email mobile_number alternate_mobile_number street street_name complex_n_unit suburb_district town_city province postal_code method_of_communication opt_in_promotional race gender qualification");
        
        if (profileData && profileData.length > 0) {
            return profileData;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching profile data:', error);
        return null;
    }
}
/*****************************************************************************************/
/*****************************************************************************************/