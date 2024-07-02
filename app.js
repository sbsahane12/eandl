require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const methodOverride = require('method-override');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User');
const expressLayouts = require('express-ejs-layouts');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ejsMate = require('ejs-mate');
const path = require('path');
const app = express();


// Database connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Database connected');
}).catch(err => {
    console.log('Database connection error:', err);
});

// Middleware

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(session({
    secret: 'notagoodsecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    },
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.get('/', (req, res) => {
    res.render('home');
})
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.get("*", (req, res) => {
    res.status(404).render('error', { error1: 'Page Not Found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: 'Internal Server Error' });
});

app.listen(8000, () => {
    console.log('Serving on port 8000');
});
