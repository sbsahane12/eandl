const mongoose = require('mongoose');

const UserForgetSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true }
});

module.exports = mongoose.model('UserForget', UserForgetSchema);
