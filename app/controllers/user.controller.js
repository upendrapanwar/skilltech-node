const config = require('../config/index');
const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const { array } = require('joi');
const { registerValidation } = require('../validations/user.validation');
const msg = require('../helpers/messages.json');

const multer = require('multer');

router.post('/signup', registerValidation, register);

module.exports = router;

/**
 * Function registers the user
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * 
 * @return JSON|null
 */
function register(req, res, next) {
    userService.create(req.body)
    .then(user => user ? res.status(201).json({ status: true, message: msg.user.signup.success, data: user }) : res.status(400).json({ status: false, message: msg.user.signup.error }))
    .catch(err => next(res.status(400).json({ status: false, message: err })));
}

/*****************************************************************************************/
/*****************************************************************************************/