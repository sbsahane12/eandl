const User = require('../models/User');
const Scheme = require('../models/Scheme');
const UserForget = require('../models/UserForget');
const passport = require('passport');
const randomstring = require('randomstring');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const {userSchema,emailSchema, passwordResetSchema,userLoginSchema} = require('../validation/userValidation');
const ExpressError = require('../utils/ExpressError');
exports.signupForm = (req, res) => {
    res.render('user/signup');
};

exports.signup = async (req, res) => {

     console.log("Body of request",	req.body);

    try {

        const { error } = userSchema.validate(req.body);
        if (error) {
            req.flash('error', error.details[0].message);
            res.redirect('/user/signup');
            return;
        }
        let { username, name, accountNumber, email, password, role, mobile, startYear, endYear } = req.body;

        
        let existingUser = await User.findOne({ username });
        if (existingUser) {
            throw new Error('A user with the given username is already registered');
        }

       let userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            throw new Error('A user with the given email is already registered');
        }

        userAlreadyExists = await User.findOne({ accountNumber });
        if (userAlreadyExists) {
            throw new Error('A user with the given account number is already registered');
        }

        userAlreadyExists = await User.findOne({ mobile });
        if (userAlreadyExists) {
            throw new Error('A user with the given mobile number is already registered');
        }
        
        userAlreadyExists = await User.findOne({ name });
        if (userAlreadyExists) {
            throw new Error('A user with the given name is already registered');
        }


        let yearPeriod = [];
        for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
            yearPeriod.push(year);
        }

     
        const registeredUser = await User.register(new User({
            username,
            name,
            accountNumber,
            email,
            role,
            mobile,
            yearPeriod
        }), password);

        const verificationToken = randomstring.generate();
        await UserForget.create({ user_id: registeredUser._id, token: verificationToken });

        await sendVerificationEmail(email, verificationToken);

        req.flash('success', 'Registered successfully. Please verify your email.');
        res.redirect('/user/login');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/user/signup');
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            throw new ExpressError('User not found', 404);
        }

        res.render('user/profile', {
            user,
            totalSchemes: user.yearPeriod.length,
            yearPeriod: user.yearPeriod
        });
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/');
    }
};


exports.getSchemesByYear = async (req, res) => {
    try {
        const userId = req.user._id;
        const { year } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            throw new ExpressError('User not found', 404);
        }

        const schemes = await Scheme.find({ userId, year: parseInt(year) });

        // Group schemes by month
        const schemesByMonth = {};

        schemes.forEach(scheme => {
            const month = scheme.date.getMonth();
            if (!schemesByMonth[month]) schemesByMonth[month] = [];
            schemesByMonth[month].push(scheme);
        });

        res.render('user/yearSchemes', {
            user,
            year,
            schemesByMonth
        });
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/user/profile');
    }
};

exports.getSchemesByMonth = async (req, res) => {
    try {
        const userId = req.user._id;
        const { year, month } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            throw new ExpressError('User not found', 404);
        }

        const schemes = await Scheme.find({ userId, year: parseInt(year) });

        // Filter schemes for the specified month and separate them by type
        const groundSchemes = schemes.filter(scheme => scheme.schemeType === 'ground' && scheme.date.getMonth() === parseInt(month));
        const departmentSchemes = schemes.filter(scheme => scheme.schemeType === 'department' && scheme.date.getMonth() === parseInt(month));

        res.render('user/monthSchemes', {
            user,
            year,
            month,
            groundSchemes,
            departmentSchemes
        });
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect(`/user/schemes/${year}`);
    }
};




exports.loginForm = (req, res) => {
    res.render('user/login');
};

exports.login = (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
        try {


           const { error } = userLoginSchema.validate(req.body);

           if (error) {
            req.flash('error', error.details[0].message);
            res.redirect('/user/login');
            return;
        }

            console.log(user);
            const { email, username, password } = req.body;


            if (err) {
                req.flash('error', err.message);
                throw new ExpressError('An error occurred', 500);
            }
            if (!user) {
                req.flash('error', 'Invalid email or password');
                throw new ExpressError('Invalid email or password', 400);
            }

            if (email !== user.email) {
                throw new ExpressError("Please provide valid Email ID", 400);
            }

            if (!user.is_verified) {
                const verificationToken = randomstring.generate();
                await UserForget.create({ user_id: user._id, token: verificationToken });
                await sendVerificationEmail(user.email, verificationToken);

                throw new ExpressError('Please verify your email before logging in. A verification email has been sent.', 400);
            }

            req.login(user, (err) => {
                if (err) {
                    throw new ExpressError('An error occurred', 500);
                }
                req.flash('success', 'Logged in successfully');
                res.redirect(`/${user.role}/profile`);
            });
        } catch (err) {
            console.error(err);
            req.flash('error', err.message);
            res.redirect('/user/login');
        }
    })(req, res, next);
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Logged out successfully');
        res.redirect('/user/login');
    });
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        const userForget = await UserForget.findOne({ token });

        if (!userForget) {
            throw new ExpressError('Invalid token', 400);
        }

        const user = await User.findById(userForget.user_id);
        user.is_verified = true;
        await user.save();
        await UserForget.deleteMany({ user_id: userForget.user_id });

        req.flash('success', 'Email verified successfully');
        res.redirect('/user/login');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/user/login');
    }
};

exports.forgetPasswordForm = (req, res) => {
    res.render('user/forgetPassword');
};

exports.forgetPassword = async (req, res) => {
    try {
        const { error } = emailSchema.validate(req.body);
        if (error) {
            throw new ExpressError(error.details[0].message, 400);
        }

        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            throw new ExpressError('No account found with that email', 400);
        }

        await UserForget.deleteMany({});
        const resetToken = randomstring.generate();
        await UserForget.create({ user_id: user._id, token: resetToken });

        sendPasswordResetEmail(email, resetToken);

        req.flash('success', 'Password reset email sent');
        res.redirect('/user/login');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/user/forgetPassword');
    }
};

exports.resetPasswordForm = (req, res) => {
    const { token } = req.query;
    res.render('user/resetPassword', { token });
};

exports.resetPassword = async (req, res) => {
    try {
        const { error } = passwordResetSchema.validate(req.body);
        if (error) {
            throw new ExpressError(error.details[0].message, 400);
        }

        const { token } = req.body;
        const userForget = await UserForget.findOne({ token });

        if (!userForget) {
            throw new ExpressError('Invalid token', 400);
        }

        const user = await User.findById(userForget.user_id);

        user.setPassword(req.body.password, async (err) => {
            if (err) {
                throw new ExpressError('Password reset failed', 500);
            }

            await user.save();
            await UserForget.deleteMany({});
            req.flash('success', 'Password reset successfully');
            res.redirect('/user/login');
        });
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect(`/user/resetPassword?token=${req.body.token}`);
    }
};


// ... (keep the existing report generation functions)

exports.downloadMonthWiseReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        const schemes = await Scheme.find({
            $expr: {
                $and: [
                    { $eq: [{ $year: "$date" }, parseInt(year)] },
                    { $eq: [{ $month: "$date" }, parseInt(month)] }
                ]
            }
        });

        if (schemes.length === 0) {
            throw new Error('No schemes found for the selected month and year');
        }

        const format = req.query.format || 'pdf';
        if (format === 'pdf') {
            await generatePDFDocument(res, schemes, month, year);
        } else if (format === 'xlsx') {
            await generateExcelWorkbook(res, schemes, month, year);
        } else {
            throw new Error('Unsupported format requested');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

exports.downloadYearWiseReport = async (req, res) => {
    try {
        const { year } = req.query;

        const yearSchemes = await Scheme.aggregate([
            {
                $group: {
                    _id: { month: { $month: '$date' } },
                    schemes: { $push: '$$ROOT' }
                }
            }
        ]);

        if (yearSchemes.length === 0) {
            throw new Error('No schemes found for the selected year');
        }

        await generateYearlyPDFReport(res, year, yearSchemes);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// ... (keep the existing helper functions for report generation)