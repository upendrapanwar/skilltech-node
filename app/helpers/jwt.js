const config = require('../config/index');
const { expressjwt: jwtt} = require('express-jwt');
const commonService = require('../services/common.service');
const userService = require('../services/user.service');

module.exports = jwt;

function jwt() {
    const secret = config.secret;

    return jwtt({ secret, isRevoked, algorithms: ['HS256']}).unless({
        path: [
            //common
            '/common/signup',
            '/common/signin',
            '/common/subscription',
            //user
            '/user/login',
            '/user/social-login',
            '/user/signup',
            
            '/user/forgot-password',
            '/user/reset-password',
        ]
    })
}

async function isRevoked(req, payload) {
    console.log(req);
    const url = req.originalUrl;
    
    if(url.includes('commmon/') == true) {
        let param = { id: payload, role: "learner" };
        //onst user = await userService
        return true;
    }
    if(url.includes('user/') == true) {
        let param = { id: payload, role: "user" };
        //onst user = await userService

    }
}
