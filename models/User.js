const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true },
    name: { type: String, required: true },
    accountNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    photo: { type: String },
    schemesCompleted: { type: Number, default: 0 },
    is_verified: { type: Boolean, default: false },
    role: { type: String, default: 'user' }, // user or admin
    yearPeriod: { type: [Number], required: true } // array of years
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
