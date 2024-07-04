const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { isLoggedIn } = require('../middleware');

router.get('/signup', userController.signupForm);
router.post('/signup',userController.signup);

router.get('/login', userController.loginForm);
router.post('/login', userController.login);

router.get('/logout', isLoggedIn, userController.logout);

router.get('/verify-email', userController.verifyEmail);

// router.get('/forgetPassword', userController.forgetPasswordForm);
router.post('/forgetPassword', userController.forgetPassword);

router.get('/resetPassword', userController.resetPasswordForm);
router.post('/resetPassword', userController.resetPassword);

router.get('/profile', isLoggedIn, userController.getProfile);
router.get('/schemes/:year', isLoggedIn, userController.getSchemesByYear);

router.get('/schemes/:year/:month', isLoggedIn, userController.getSchemesByMonth);

router.post('/contact', userController.submitContactForm);

router.get('/downloadMonthWiseReport', userController.downloadMonthWiseReport);
router.get('/downloadYearWiseReport', userController.downloadYearWiseReport);
module.exports = router;
