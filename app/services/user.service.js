const config = require('../config/index');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const msg = require("../helpers/messages.json");
const { User } = require('../helpers/db');
const fs = require('fs');
const path = require('path');
const mime = require("mime-types");

module.exports = {
    create,
    updateProfileDetails,
    updateAmbassadorProfileDetails,
    getProfileDetails,
    checkSouthAfricanId,
    saveMoodleLoginId,
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
 * For update profile data of Subscriber
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
 * For update profile data of Ambassador
 *  
 * @param {param}
 * 
 * @returns Object|null
 */

async function updateAmbassadorProfileDetails(param, data) {
    console.log("param", param);
    console.log("updateAmbassadorProfileDetails data:", data);

    try {
        const whereCondition = { _id: param.id };
        let userData = await User.findById(whereCondition).select("bank_proof certificate");

        function saveBase64File(base64String, uploadDir) {
            const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new Error("Invalid base64 string");
            }

            const mimeType = matches[1];
            const base64Data = matches[2];
            const extension = mime.extension(mimeType);
            if (!extension) {
                throw new Error("Unsupported file type");
            }

            const fileName = `CER-${Math.floor(Math.random() * 1000000)}-${Date.now()}.${extension}`;
            const filePath = path.join(__dirname, `../../uploads/${uploadDir}/`, fileName);
            fs.writeFileSync(filePath, base64Data, { encoding: "base64" });

            return `uploads/${uploadDir}/${fileName}`;
        }

        if (data.certificate && !/^uploads\/certificate\/CER-\d+-\d+\.\w+$/.test(data.certificate)) {
            data.certificate = saveBase64File(data.certificate, "certificate");

            // Delete the existing certificate file
            if (userData.certificate && fs.existsSync(path.join(__dirname, "../../", userData.certificate))) {
                fs.unlinkSync(path.join(__dirname, "../../", userData.certificate));
            }
        }

        if (data.bank_proof && !/^uploads\/bank_proof\/CER-\d+-\d+\.\w+$/.test(data.bank_proof)) {
            data.bank_proof = saveBase64File(data.bank_proof, "bank_proof");

            // Delete the existing bank proof file
            if (userData.bank_proof && fs.existsSync(path.join(__dirname, "../../", userData.bank_proof))) {
                fs.unlinkSync(path.join(__dirname, "../../", userData.bank_proof));
            }
        }

        // Update data in the database
        const updatedData = await User.findOneAndUpdate(
            whereCondition,
            {
                $set: {
                    bank: data.bank,
                    branch: data.branch,
                    branch_code: data.branch_code,
                    account_number: data.account_number,
                    account_holder_name: data.account_holder_name,
                    type_of_account: data.type_of_account,
                    bank_contact_details: {
                        email: data.contact_details.email,
                        mobile_number: data.contact_details.mobile_number,
                        alternate_mobile_number: data.contact_details.alternate_mobile_number,
                        street: data.contact_details.street,
                        street_name: data.contact_details.street_name,
                        complex_n_unit: data.contact_details.complex_n_unit,
                        suburb_district: data.contact_details.suburb_district,
                        town_city: data.contact_details.town_city,
                        province: data.contact_details.province,
                        postal_code: data.contact_details.postal_code,
                    },
                    bank_proof: data.bank_proof,
                    certificate: data.certificate,
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
};


// async function updateAmbassadorProfileDetails(param, data) {
//     console.log("param", param);
//     console.log("updateAmbassadorProfileDetails data:", data);

//     try {
//         const whereCondition = { _id: param.id };
//         let userData = await User.findById(whereCondition).select("bank_proof certificate");

//         const certificateRegex = /^uploads\/certificate\/CER-\d+-\d+\.pdf$/;
//         const bankProofRegex = /^uploads\/bank_proof\/CER-\d+-\d+\.pdf$/;

//         //Add certificate and bank proof file in server
//         if (!certificateRegex.test(data.certificate)) {
//             const res = data.certificate;
//             const base64Data = res.replace(/^data:([A-Za-z-+/]+);base64,/, "");
//             let certificateName =
//                 "CER-" + Math.floor(Math.random() * 1000000) + "-" + Date.now() + ".pdf";
//             let certificatePath = path.join(
//                 __dirname,
//                 "../../uploads/certificate/" + certificateName
//             );
//             fs.writeFileSync(certificatePath, base64Data, { encoding: "base64" });
//             data.certificate = "uploads/certificate/" + certificateName;

//             // Delete the existing certificate file
//             if (userData.certificate && fs.existsSync(path.join(__dirname, "../../", userData.certificate))) {
//                 fs.unlinkSync(path.join(__dirname, "../../", userData.certificate));
//             }
//         }

//         if (!bankProofRegex.test(data.bank_proof)) {
//             const res_bankproof = data.bank_proof;
//             const base64DataBankProof = res_bankproof.replace(
//                 /^data:([A-Za-z-+/]+);base64,/,
//                 ""
//             );
//             let bankProofName =
//                 "CER-" + Math.floor(Math.random() * 1000000) + "-" + Date.now() + ".pdf";
//             let bankProofPath = path.join(
//                 __dirname,
//                 "../../uploads/bank_proof/" + bankProofName
//             );
//             fs.writeFileSync(bankProofPath, base64DataBankProof, { encoding: "base64" });
//             data.bank_proof = "uploads/bank_proof/" + bankProofName;

//             // Delete the existing bank proof file
//             if (userData.bank_proof && fs.existsSync(path.join(__dirname, "../../", userData.bank_proof))) {
//                 fs.unlinkSync(path.join(__dirname, "../../", userData.bank_proof));
//             }
//         }

//         // Update data in the database
//         const updatedData = await User.findOneAndUpdate(
//             whereCondition,
//             {
//                 $set: {
//                     bank: data.bank,
//                     branch: data.branch,
//                     branch_code: data.branch_code,
//                     account_number: data.account_number,
//                     account_holder_name: data.account_holder_name,
//                     type_of_account: data.type_of_account,
//                     bank_contact_details: {
//                         email: data.contact_details.email,
//                         mobile_number: data.contact_details.mobile_number,
//                         alternate_mobile_number: data.contact_details.alternate_mobile_number,
//                         street: data.contact_details.street,
//                         street_name: data.contact_details.street_name,
//                         complex_n_unit: data.contact_details.complex_n_unit,
//                         suburb_district: data.contact_details.suburb_district,
//                         town_city: data.contact_details.town_city,
//                         province: data.contact_details.province,
//                         postal_code: data.contact_details.postal_code,
//                     },
//                     bank_proof: data.bank_proof,
//                     certificate: data.certificate,
//                 }
//             },
//             { new: true }
//         );

//         if (updatedData) {
//             return updatedData;
//         } else {
//             return false;
//         }
//     } catch (err) {
//         console.error("Error updating profile details:", err);
//         return false;
//     }
// };



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
        const profileData = await User.find(whereCondition).select("firstname surname id_number email mobile_number alternate_mobile_number street street_name complex_n_unit suburb_district town_city province postal_code method_of_communication policy_consent opt_in_promotional race gender qualification privacy ecommercePolicy deals_promotion in_loop how_did_you_hear_about_us opt_in_promotional moodle_pass moodle_login_id account_holder_name bank branch branch_code type_of_account account_number bank_contact_details bank_proof certificate confirm_details update_information referral_code");
        
        if (profileData && profileData.length > 0) {
            console.log("profileData",profileData);

            // const certificate = converBase64ToOriginalFile(profileData[0].certificate);
            // const bank_proof = converBase64ToOriginalFile(profileData[0].bank_proof);

            // console.log("profileData certificate: ",certificate);
            // console.log("profileData bank_proof: ",bank_proof);

            // profileData[0].certificate = certificate;
            // profileData[0].bank_proof = bank_proof;

            return profileData;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching profile data:', error);
        return null;
    }
};

const converBase64ToOriginalFile = (fileURL) => {
    let certificateUrl = fileURL;
    let certificatePath = path.join(__dirname, "../../", certificateUrl);
    let fileContent = fs.readFileSync(certificatePath);
    let base64Certificate = fileContent.toString('base64');
    let base64DataUrl = `data:application/pdf;base64,${base64Certificate}`; // Format the base64 string as a Data URL
    return base64DataUrl
}


async function checkSouthAfricanId(req) {
    try {
        const southAfricanId = req.params.id; 
        console.log("southAfricanId", southAfricanId);
    
        const existingSouthAfricanId = await User.findOne({ id_number: southAfricanId}).select('id_number');
        console.log("existingSouthAfricanId", existingSouthAfricanId);
        if (existingSouthAfricanId !== null) {
          return existingSouthAfricanId;
        } else {
            return;
        }
    } catch (error) {
        console.error('Error fetching profile data:', error);
        return null;
    }
}

/*****************************************************************************************/
/*****************************************************************************************/

/**
 * Manages to save Moodle login ID
 *  
 * @param {param}
 * 
 * @returns Object|null
 */

async function saveMoodleLoginId(req) {
    try {
        console.log("param", req.params);
        console.log("moodle id", req.body);
        const userId = req.params.id;
        const moodleLoginId = req.body.moodleLoginId;
        
        const whereCondition = { _id: userId };
        const updatedData = await User.findOneAndUpdate(
            whereCondition,
            {
                $set: {
                    moodle_login_id: moodleLoginId,
                }
            },
            { new: true }
        );

        if (updatedData) {
            return updatedData;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error saving moodle login id:', error);
        return null;
    }
}

/*****************************************************************************************/
/*****************************************************************************************/

