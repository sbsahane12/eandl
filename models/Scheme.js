const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    schemeName: { type: String, required: true },
    schemeType: { type: String, enum: ['ground', 'department'], required: true },
    hoursWorked: { type: Number, required: true },
    date: { type: Date, required: true },
    year: { type: Number, required: true }, // add year field
    completed: { type: Boolean, default: false },
});

module.exports = mongoose.model('Scheme', SchemeSchema);
