const User = require('../models/User');
const Scheme = require('../models/Scheme');
const ExpressError = require('../utils/ExpressError');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, convertInchesToTwip } = require("docx");
const { isValidObjectId } = require('mongoose');
const randomstring = require('randomstring');
const { sendVerificationEmail, sendSchemeAddedEmail, sendSchemeUpdatedEmail, sendSchemeDeletedEmail } = require('../utils/mailer');
const UserForget = require('../models/UserForget');
const { userSchema, schemeSchema, updateSchemeSchema, } = require('../validation/userValidation');
const ensureDownloadDir = () => {
    const downloadsDir = path.join(__dirname, '../../public/downloads');
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }
    return downloadsDir;
};


const getMonthlySchemes = async (userId, year) => {
    const schemes = await Scheme.find({ userId, date: { $gte: new Date(year, 0, 1), $lt: new Date(parseInt(year) + 1, 0, 1) } });
    const monthlySchemes = Array(12).fill(0);
    schemes.forEach(scheme => {
        const month = scheme.date.getMonth();
        monthlySchemes[month]++;
    });
    return monthlySchemes;
};

const groupSchemesByMonth = (schemes) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const grouped = {};
    schemes.forEach(scheme => {
        const monthName = months[scheme.date.getMonth()];
        if (!grouped[monthName]) grouped[monthName] = [];
        grouped[monthName].push(scheme);
    });
    return Object.entries(grouped).map(([monthName, schemes]) => ({ monthName, schemes }));
};

const getMonthNumber = (monthName) => {
    const months = { "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6, "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12 };
    return months[monthName];
};

exports.dashboard = (req, res) => {
    res.render('admin/profile', { user: req.user });
};

exports.manageUsers = async (req, res) => {
    try {
        const users = await User.find({});
        const years = new Set();

        users.forEach(user => {
            if (user.yearPeriod) {
                user.yearPeriod.forEach(year => years.add(year));
            }
        });

        res.render('admin/manageUsers', { years: Array.from(years) });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching users');
        res.redirect('/');
    }
};

exports.createUserForm = (req, res) => {
    res.render('admin/createUser');
};

exports.createUser = async (req, res) => {


    console.log("Body of request",	req.body);
    const { error } = userSchema.validate(req.body);
    if (error) {
        req.flash('error', error.details[0].message);
        res.redirect('/admin/createUser');
        return;
    }
    const { username, name, accountNumber, email, mobile, role, password, startYear, endYear,is_verified} = req.body;
    
    // const is_verified = req.body.is_verified === 'on';
    console.log(is_verified);

    let yearPeriod = [];
    for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
        yearPeriod.push(year);
    }

    try {
        // Check if the user already exists
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

      


        const registeredUser = await User.register(new User({ username, name, accountNumber, email, mobile, role, yearPeriod, is_verified }), password);

        if (!is_verified) {
            await UserForget.deleteMany({});
            const verificationToken = randomstring.generate();
            await UserForget.create({ user_id: registeredUser._id, token: verificationToken });
            await sendVerificationEmail(email, verificationToken);

            req.flash('success', 'Registered successfully. Please verify your email.');
        } else {
            req.flash('success', 'Registered successfully.');
        }
        
        res.redirect('/admin/manageUsers');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/admin/manageUsers');
    }
};

exports.editUser = async (req, res) => {
    
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);

        if (!user) throw new Error('User not found');
        res.render('admin/editUser', { user });
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/admin/manageUsers');
    }
};


exports.updateUser = async (req, res) => {
    console.log("Body of request", req.body);

    const { userId } = req.params;
    const { username, name, accountNumber, email, mobile, role, startYear, endYear, is_verified } = req.body;


    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 30 || !/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(username)) {
        req.flash('error', 'Username must be a text string between 3 and 30 characters long, containing at least one uppercase letter, one number, and one special character.');
        return res.redirect('/admin/manageUsers');
    }
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50) {
        req.flash('error', 'Name must be a text string between 2 and 50 characters long.');
        return res.redirect('/admin/manageUsers');
    }

    if (!accountNumber || !/^[0-9]{14}$/.test(accountNumber)) {
        req.flash('error', 'Account number must be 14 digits long.');
        return res.redirect('/admin/manageUsers');
    }
    
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        req.flash('error', 'Email must be a valid email address.');
        return res.redirect('/admin/manageUsers');
    }
       
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
        req.flash('error', 'Mobile number must be 10 digits long.');
        return res.redirect('/admin/manageUsers');
    }
     
    if (!role || (role !== 'admin' && role !== 'user')) {
        req.flash('error', 'Role must be either "admin" or "user".');
        return res.redirect('/admin/manageUsers');
    }

    if (!startYear || typeof Number(startYear) !== 'number' || !Number.isInteger(Number(startYear)) || Number(startYear) < 1900 || Number(startYear) > 2100) {
        req.flash('error', 'Start year must be Number between 1900 and 2100.');
        return res.redirect('/admin/manageUsers');
    }

    if (!endYear || typeof Number(endYear) !== 'number' || !Number.isInteger(Number(endYear)) || Number(endYear) < 1900 || Number(endYear) > 2100) {
        req.flash('error', 'End year must be Number between 1900 and 2100.');
        return res.redirect('/admin/manageUsers');
    }


    console.log('User ID:', userId);
    console.log('User ID Type:', typeof userId);

    let yearPeriod = [];
    for (let year = Number(startYear); year <= Number(endYear); year++) {
        yearPeriod.push(year);
    }

    console.log('Constructed yearPeriod:', yearPeriod);

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, {
            username,
            name,
            accountNumber,
            email,
            mobile,
            role,
            yearPeriod,
            is_verified,
        }, { new: true });

        console.log('Updated User:', updatedUser);

        req.flash('success', 'User updated successfully');
        res.redirect(`/admin/users/${startYear}`);
    } catch (err) {
        console.error('Error updating user:', err);
        req.flash('error', err.message);
        res.redirect('/admin/manageUsers');
    }
};




exports.deleteUser = async (req, res) => {
    const { userId, year } = req.params;

    try {

        // Delete schemes for the user in the specified year
        await Scheme.deleteMany({ userId, 'date': { '$gte': new Date(`${year}-01-01`), '$lte': new Date(`${year}-12-31`) } });

        // Remove the year from the user's yearPeriod array
        await User.findByIdAndUpdate(userId, { $pull: { yearPeriod: parseInt(year) } });

        req.flash('success', `User's schemes for ${year} and year period removed successfully`);
        res.redirect('/admin/manageUsers');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/admin/manageUsers');
    }
};

exports.usersByYear = async (req, res) => {
    const { year } = req.params;

    try {
        const users = await User.find({ yearPeriod: year });
        if (!users.length) {
            req.flash('error', 'No users found for the specified year');
            return res.redirect(`/admin/manageUsers`);
        }

        const usersWithSchemes = await Promise.all(users.map(async user => {
            const schemes = await Scheme.find({ userId: user._id, year });
            const schemesByMonth = Array(12).fill(0);
            let schemesCompleted = 0;

            schemes.forEach(scheme => {
                const month = scheme.date.getMonth();
                schemesByMonth[month]++;
                if (scheme.completed) {
                    schemesCompleted++;
                }
            });

            // Update user object with schemesByMonth and schemesCompleted
            return { ...user._doc, schemesByMonth, schemesCompleted };
        }));

        res.render('admin/usersByYear', { year, usersWithSchemes });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching users');
        res.redirect(`/admin/manageUsers`);
    }
};

exports.newSchemeForm = async (req, res) => {
    try {
        const usersByYear = {};
        const allUsers = await User.find({});
        
        allUsers.forEach(user => {
            user.yearPeriod.forEach(year => {
                if (!usersByYear[year]) {
                    usersByYear[year] = [];
                }
                usersByYear[year].push(user);
            });
        });

        const years = Object.keys(usersByYear).sort((a, b) => a - b);
        
        res.render('admin/newScheme', { usersByYear, years });
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/admin/manageUsers');
    }
};

exports.editSchemeForm = async (req, res) => {
    const { year, scheme_id } = req.params;
    try {
        const scheme = await Scheme.findById(scheme_id);
        if (!scheme) {
            req.flash('error', 'Scheme not found');
            return res.redirect(`/admin/schemes/earn-learn-student/${year}`);
        }
        res.render('admin/editScheme', { year, scheme });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching scheme');
        res.redirect(`/admin/schemes/earn-learn-student/${year}`);
    }
};



exports.addScheme = async (req, res) => {
    try {
        const { error } = schemeSchema.validate(req.body);
        if (error) {
            req.flash('error', error.details[0].message);
            return res.redirect('/admin/schemes');
        }

        const { schemeName, schemeType, hoursWorked, date, selectedUsers, year, completed } = req.body;

        const users = await User.find({ _id: { $in: selectedUsers }, yearPeriod: year });

        const schemes = users.map(user => ({
            schemeName,
            schemeType,
            hoursWorked,
            date,
            userId: user._id,
            year,
            completed
        }));

        await Scheme.insertMany(schemes);

        // Send email notification to each user
        users.forEach(user => {
            const emailContent = {
                schemeName,
                schemeType,
                hoursWorked,
                date,
                year
            };
            sendSchemeAddedEmail(user.email, emailContent);
        });

        req.flash('success', 'Scheme added successfully to selected users');
        res.redirect('/admin/schemes');
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect('/admin/schemes');
    }
};

exports.updateScheme = async (req, res) => {
    const { scheme_id } = req.params;
    try {
        const { error } = updateSchemeSchema.validate(req.body);
        if (error) {
            req.flash('error', error.details[0].message);
            return res.redirect('/admin/schemes');
        }
        const { schemeName, schemeType, hoursWorked, date, completed } = req.body;
        const year = new Date(date).getFullYear(); // Extract year from date

        await Scheme.findByIdAndUpdate(scheme_id, {
            schemeName,
            schemeType,
            hoursWorked,
            date,
            completed,
            year
        });

        // Fetch updated scheme details
        const updatedScheme = await Scheme.findById(scheme_id);

        console.log(updatedScheme);

        // Send email notification to affected user(s)
        const user = await User.findById(updatedScheme.userId); // Assuming Scheme model has userId field

        console.log(user);

        const emailContent = {
            schemeName,
            schemeType,
            hoursWorked,
            date,
            year,
            completed
        };
        sendSchemeUpdatedEmail(user.email, emailContent);

        req.flash('success', 'Scheme updated successfully');
        res.redirect(`/admin/schemes/earn-learn-student/${year}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating scheme');
        res.redirect('/admin/schemes');
    }
};





exports.deleteScheme = async (req, res) => {
    const { scheme_id } = req.params; // Correctly access scheme_id from params

    try {
        // Find the scheme to be deleted
        const deletedScheme = await Scheme.findById(scheme_id);
        if (!deletedScheme) {
            req.flash('error', 'Scheme not found');
            return res.redirect('/admin/schemes');
        }

        // Delete the scheme from the database
        await Scheme.findByIdAndDelete(scheme_id);

        // Send email notification to affected user
        const user = await User.findById(deletedScheme.userId); // Assuming Scheme model has userId field
        const emailContent = {
            schemeName: deletedScheme.schemeName,
            schemeType: deletedScheme.schemeType,
            year: deletedScheme.year
        };
        sendSchemeDeletedEmail(user.email, emailContent);

        req.flash('success', 'Scheme deleted successfully');
        res.redirect('/admin/schemes'); // Redirect to the schemes page after deletion
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting scheme');
        res.redirect('/admin/schemes'); // Redirect to the schemes page on error
    }
};

exports.manageSchemes = async (req, res) => {
    try {
        const users = await User.find({});
        const years = Array.from(new Set(users.flatMap(user => user.yearPeriod)));

        res.render('admin/manageSchemes', {years });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching schemes');
        res.redirect('/admin/schemes');
    }
};

exports.getUsersByYear = async (req, res) => {
    const { year } = req.params;
    try {
        const users = await User.find({ yearPeriod: year });
        res.render('admin/userByYear', { year, users });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching users');
        res.redirect('/admin/schemes');
    }
};




exports.schemesByUserAndYear = async (req, res) => {
    const { userId, year } = req.params;

    try {
        if (!isValidObjectId(userId)) throw new Error('Invalid user ID');

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const schemes = await Scheme.find({ userId, year });
        const groupedSchemes = groupSchemesByMonth(schemes); // Ensure this function returns the correct structure

        res.render('admin/userSchemes', { user, year, schemesByMonth: groupedSchemes ,getMonthNumber});

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error fetching schemes for user');
        res.redirect(`/admin/schemes/${userId}`);
    }
};

exports.downloadGroundWord = async (req, res) => {
    const { userId, year, month } = req.params;

    try {
        console.log(`Fetching user with ID: ${userId}`);
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        console.log(`Fetching schemes for user with ID: ${userId}`);
        const schemes = await Scheme.find({ userId });
        console.log(`Total schemes found: ${schemes.length}`);

        const filteredSchemes = schemes.filter(scheme => {
            const schemeYear = scheme.date.getFullYear();
            const schemeMonth = scheme.date.getMonth() + 1; // getMonth() returns 0-based index
            return scheme.schemeType === 'ground' && schemeYear === parseInt(year) && schemeMonth === parseInt(month);
        });
        console.log(`Filtered schemes for ${year}-${month}: ${filteredSchemes.length}`);

        // Group schemes by date for easier access
        const groupedSchemes = {};
        let totalHours = 0;

        filteredSchemes.forEach(scheme => {
            const dayOfMonth = scheme.date.getDate();
            if (!groupedSchemes[dayOfMonth]) {
                groupedSchemes[dayOfMonth] = [];
            }
            groupedSchemes[dayOfMonth].push(scheme);
            totalHours += scheme.hoursWorked;
        });

        const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in the month
        console.log(`Days in month ${month}/${year}: ${daysInMonth}`);

        const tableRows = [];

        // Populate table rows
        for (let i = 1; i <= daysInMonth; i++) {
            const schemesForDay = groupedSchemes[i];
            if (schemesForDay && schemesForDay.length > 0) {
                schemesForDay.forEach((scheme, index) => {
                    tableRows.push(
                        new TableRow({
                            children: [
                                index === 0 ? new TableCell({ children: [new Paragraph(`${i}`)] }) : new TableCell(), // Serial number only for the first scheme of the day
                                index === 0 ? new TableCell({ children: [new Paragraph(`${scheme.date.toDateString()}`)] }) : new TableCell(), // Date only for the first scheme of the day
                                new TableCell({ children: [new Paragraph(`${scheme.schemeName}`)] }), // Scheme Name
                                new TableCell({ children: [new Paragraph(`${scheme.hoursWorked}`)] }), // Hours Worked
                                new TableCell({ children: [new Paragraph('')] }) // Signature
                            ],
                            height: {
                                value: convertInchesToTwip(0.256), // Set row height to 0.65 cm
                                rule: 'exact'
                            }
                        })
                    );
                });
            } else {
                // If no scheme for this date, show blank scheme columns but display the date
                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(`${i}`)] }), // Serial number
                            new TableCell({ children: [new Paragraph(`${new Date(year, month - 1, i).toDateString()}`)] }), // Date
                            new TableCell({ children: [new Paragraph('')] }), // Scheme Name
                            new TableCell({ children: [new Paragraph('')] }), // Hours Worked
                            new TableCell({ children: [new Paragraph('')] }) // Signature
                        ],
                        height: {
                            value: convertInchesToTwip(0.256), // Set row height to 0.65 cm
                            rule: 'exact'
                        }
                    })
                );
            }
        }

        // Create the document
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.5),
                            right: convertInchesToTwip(0.5),
                            bottom: convertInchesToTwip(0.5),
                            left: convertInchesToTwip(0.5)
                        }
                    }
                },
                children: [
                    new Paragraph({
                        text: 'PRAVARA RURAL EDUCATION SOCIETY’S',
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            before: 0,
                            after: 200 // Adjust spacing after this paragraph
                        }
                    }),
                    new Paragraph({
                        text: 'PADMASHRI VIKHE PATIL COLLEGE OF ARTS, SCIENCE AND COMMERCE, PRAVARNAGAR',
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            before: 0,
                            after: 200 // Adjust spacing after this paragraph
                        }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: ' '.repeat(10), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: `Name: ${user.name}    `,
                                bold: true
                            }),
                            new TextRun({
                                text: ' '.repeat(80), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: `Account Number: ${user.accountNumber}`,
                                bold: true
                            })
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: ' '.repeat(10), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: `Scheme Type: Ground Schemes    `,
                                bold: true
                            }),
                            new TextRun({
                                text: ' '.repeat(60), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: `Month: ${month}/${year}`,
                                bold: true
                            })
                        ],
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: 'pct'
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph('No')] }),
                                    new TableCell({ children: [new Paragraph('Date')] }),
                                    new TableCell({ children: [new Paragraph('Name Of Schemes')] }),
                                    new TableCell({ children: [new Paragraph('Hours Worked')] }),
                                    new TableCell({ children: [new Paragraph('Signature')] })
                                ],
                                height: {
                                    value: convertInchesToTwip(0.256), // Set header row height to 0.65 cm
                                    rule: 'exact'
                                }
                            }),
                            ...tableRows, // Append generated table rows
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph('Total')],
                                        columnSpan: 3
                                    }),
                                    new TableCell({
                                        children: [new Paragraph(`${totalHours}`)]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph('')]
                                    })
                                ],
                                height: {
                                    value: convertInchesToTwip(0.256), // Set row height to 0.65 cm
                                    rule: 'exact'
                                }
                            })
                        ]
                    }),
                    // Add signature section
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Signature 1',
                                bold: true
                            }),
                            new TextRun({
                                text: ' '.repeat(30), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: 'Signature 2',
                                bold: true
                            }),
                            new TextRun({
                                text: ' '.repeat(30), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: 'Signature 3',
                                bold: true
                            }),
                            new TextRun({
                                text: ' '.repeat(30), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: 'Signature 4',
                                bold: true
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            before: 200, // Adjust spacing before this paragraph
                            after: 0 // No spacing after this paragraph
                        }
                    })
                ]
            }]
        });

        // Convert the document to buffer and save to file
        const buffer = await Packer.toBuffer(doc);
        const filePath = `ground_schemes_${user.username}_${year}_${month}.docx`;
        fs.writeFileSync(filePath, buffer);
        console.log(`File saved at: ${filePath}`);

        res.download(filePath, (err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Error downloading file');
                res.redirect(`/admin/schemes/${userId}`);
            } else {
                fs.unlinkSync(filePath);
            }
        });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error exporting Ground Schemes to Word');
        res.redirect(`/admin/schemes/${userId}`);
    }
}
exports.downloadDepartmentWord = async (req, res) => {
    const { userId, year, month } = req.params;

    try {
        console.log(`Fetching user with ID: ${userId}`);
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        console.log(`Fetching schemes for user with ID: ${userId}`);
        const schemes = await Scheme.find({ userId });
        console.log(`Total schemes found: ${schemes.length}`);

        const filteredSchemes = schemes.filter(scheme => {
            const schemeYear = scheme.date.getFullYear();
            const schemeMonth = scheme.date.getMonth() + 1; // getMonth() returns 0-based index
            return scheme.schemeType === 'department' && schemeYear === parseInt(year) && schemeMonth === parseInt(month);
        });
        console.log(`Filtered schemes for ${year}-${month}: ${filteredSchemes.length}`);

        // Group schemes by date for easier access
        const groupedSchemes = {};
        let totalHours = 0;

        filteredSchemes.forEach(scheme => {
            const dayOfMonth = scheme.date.getDate();
            if (!groupedSchemes[dayOfMonth]) {
                groupedSchemes[dayOfMonth] = [];
            }
            groupedSchemes[dayOfMonth].push(scheme);
            totalHours += scheme.hoursWorked;
        });

        const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in the month
        console.log(`Days in month ${month}/${year}: ${daysInMonth}`);

        const tableRows = [];

        // Populate table rows
        for (let i = 1; i <= daysInMonth; i++) {
            const schemesForDay = groupedSchemes[i];
            if (schemesForDay && schemesForDay.length > 0) {
                schemesForDay.forEach((scheme, index) => {
                    tableRows.push(
                        new TableRow({
                            children: [
                                index === 0 ? new TableCell({ children: [new Paragraph(`${i}`)] }) : new TableCell(), // Serial number only for the first scheme of the day
                                index === 0 ? new TableCell({ children: [new Paragraph(`${scheme.date.toDateString()}`)] }) : new TableCell(), // Date only for the first scheme of the day
                                new TableCell({ children: [new Paragraph(`${scheme.schemeName}`)] }), // Scheme Name
                                new TableCell({ children: [new Paragraph(`${scheme.hoursWorked}`)] }), // Hours Worked
                                new TableCell({ children: [new Paragraph('')] }) // Signature
                            ],
                            height: {
                                value: convertInchesToTwip(0.256), // Set row height to 0.65 cm
                                rule: 'exact'
                            }
                        })
                    );
                });
            } else {
                // If no scheme for this date, show blank scheme columns but display the date
                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(`${i}`)] }), // Serial number
                            new TableCell({ children: [new Paragraph(`${new Date(year, month - 1, i).toDateString()}`)] }), // Date
                            new TableCell({ children: [new Paragraph('')] }), // Scheme Name
                            new TableCell({ children: [new Paragraph('')] }), // Hours Worked
                            new TableCell({ children: [new Paragraph('')] }) // Signature
                        ],
                        height: {
                            value: convertInchesToTwip(0.256), // Set row height to 0.65 cm
                            rule: 'exact'
                        }
                    })
                );
            }
        }

        // Create the document
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.5),
                            right: convertInchesToTwip(0.5),
                            bottom: convertInchesToTwip(0.5),
                            left: convertInchesToTwip(0.5)
                        }
                    }
                },
                children: [
                    new Paragraph({
                        text: 'PRAVARA RURAL EDUCATION SOCIETY’S',
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            before: 0,
                            after: 200 // Adjust spacing after this paragraph
                        }
                    }),
                    new Paragraph({
                        text: 'PADMASHRI VIKHE PATIL COLLEGE OF ARTS, SCIENCE AND COMMERCE, PRAVARNAGAR',
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            before: 0,
                            after: 200 // Adjust spacing after this paragraph
                        }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Name: ${user.name}    `,
                                bold: true
                            }),
                            new TextRun({
                                text: `Account Number: ${user.accountNumber}`,
                                bold: true
                            })
                        ],
                        spacing: {
                            before: 200, // Adjust spacing before this paragraph
                            after: 0 // No spacing after this paragraph
                        }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Scheme Type: Department Schemes    `,
                                bold: true
                            }),
                            new TextRun({
                                text: `Month: ${month}/${year}`,
                                bold: true
                            })
                        ],
                        spacing: {
                            before: 0, // No spacing before this paragraph
                            after: 200 // Adjust spacing after this paragraph
                        }
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: 'pct'
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph('No')] }),
                                    new TableCell({ children: [new Paragraph('Date')] }),
                                    new TableCell({ children: [new Paragraph('Name Of Schemes')] }),
                                    new TableCell({ children: [new Paragraph('Hours Worked')] }),
                                    new TableCell({ children: [new Paragraph('Signature')] })
                                ],
                                height: {
                                    value: convertInchesToTwip(0.256), // Set header row height to 0.65 cm
                                    rule: 'exact'
                                }
                            }),
                            ...tableRows, // Append generated table rows
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph('Total')],
                                        columnSpan: 3
                                    }),
                                    new TableCell({
                                        children: [new Paragraph(`${totalHours}`)]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph('')]
                                    })
                                ],
                                height: {
                                    value: convertInchesToTwip(0.256), // Set row height to 0.65 cm
                                    rule: 'exact'
                                }
                            })
                        ]
                    }),
                    // Add signature section
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Signature 1',
                                bold: true
                            }),
                            new TextRun({
                                text: ' '.repeat(30), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: 'Signature 2',
                                bold: true
                            }),
                            new TextRun({
                                text: ' '.repeat(30), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: 'Signature 3',
                                bold: true
                            }),
                            new TextRun({
                                text: ' '.repeat(30), // Adjust spacing
                                bold: false
                            }),
                            new TextRun({
                                text: 'Signature 4',
                                bold: true
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            before: 200, // Adjust spacing before this paragraph
                            after: 0 // No spacing after this paragraph
                        }
                    })
                ]
            }]
        });

        // Convert the document to buffer and save to file
        const buffer = await Packer.toBuffer(doc);
        const filePath = `department_schemes_${user.username}_${year}_${month}.docx`;
        fs.writeFileSync(filePath, buffer);
        console.log(`File saved at: ${filePath}`);

        res.download(filePath, (err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Error downloading file');
                res.redirect(`/admin/schemes/${userId}`);
            } else {
                fs.unlinkSync(filePath);
            }
        });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error exporting Department Schemes to Word');
        res.redirect(`/admin/schemes/${userId}`);
    }
};
exports.downloadDepartmentExcel = async (req, res) => {
    const { userId, year, month } = req.params;

    try {
        console.log(`Fetching user with ID: ${userId}`);
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        console.log(`Fetching schemes for user with ID: ${userId}`);
        const schemes = await Scheme.find({ userId });
        console.log(`Total schemes found: ${schemes.length}`);

        const filteredSchemes = schemes.filter(scheme => {
            const schemeYear = scheme.date.getFullYear();
            const schemeMonth = scheme.date.getMonth() + 1; // getMonth() returns 0-based index
            return scheme.schemeType === 'department' && schemeYear === parseInt(year) && schemeMonth === parseInt(month);
        });
        console.log(`Filtered schemes for ${year}-${month}: ${filteredSchemes.length}`);

        // Group schemes by date for easier access
        const groupedSchemes = {};
        let totalHours = 0;

        filteredSchemes.forEach(scheme => {
            const dayOfMonth = scheme.date.getDate();
            if (!groupedSchemes[dayOfMonth]) {
                groupedSchemes[dayOfMonth] = [];
            }
            groupedSchemes[dayOfMonth].push(scheme);
            totalHours += scheme.hoursWorked;
        });

        const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in the month
        console.log(`Days in month ${month}/${year}: ${daysInMonth}`);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Department Schemes ${month}-${year}`);

        // Set column headers
        worksheet.columns = [
            { header: 'No', key: 'no', width: 10 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Name Of Schemes', key: 'schemeName', width: 30 },
            { header: 'Hours Worked', key: 'hoursWorked', width: 20 },
            { header: 'Signature', key: 'signature', width: 30 }
        ];

        // Populate rows
        for (let i = 1; i <= daysInMonth; i++) {
            const schemesForDay = groupedSchemes[i];
            if (schemesForDay && schemesForDay.length > 0) {
                schemesForDay.forEach((scheme, index) => {
                    worksheet.addRow({
                        no: index === 0 ? i : '',
                        date: index === 0 ? scheme.date.toDateString() : '',
                        schemeName: scheme.schemeName,
                        hoursWorked: scheme.hoursWorked,
                        signature: ''
                    });
                });
            } else {
                worksheet.addRow({
                    no: i,
                    date: new Date(year, month - 1, i).toDateString(),
                    schemeName: '',
                    hoursWorked: '',
                    signature: ''
                });
            }
        }

        // Add total hours row
        worksheet.addRow({
            no: '',
            date: '',
            schemeName: 'Total',
            hoursWorked: totalHours,
            signature: ''
        });

        // Add signature row
       

        const filePath = path.join(__dirname, `../../department_schemes_${user.username}_${year}_${month}.xlsx`);
        await workbook.xlsx.writeFile(filePath);
        console.log(`File saved at: ${filePath}`);

        res.download(filePath, (err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Error downloading file');
                res.redirect(`/admin/schemes/${userId}`);
            } else {
                fs.unlinkSync(filePath);
            }
        });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error exporting Department Schemes to Excel');
        res.redirect(`/admin/schemes/${userId}`);
    }
};
exports.downloadGroundExcel = async (req, res) => {
    const { userId, year, month } = req.params;

    try {
        console.log(`Fetching user with ID: ${userId}`);
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        console.log(`Fetching schemes for user with ID: ${userId}`);
        const schemes = await Scheme.find({ userId });
        console.log(`Total schemes found: ${schemes.length}`);

        const filteredSchemes = schemes.filter(scheme => {
            const schemeYear = scheme.date.getFullYear();
            const schemeMonth = scheme.date.getMonth() + 1; // getMonth() returns 0-based index
            return scheme.schemeType === 'ground' && schemeYear === parseInt(year) && schemeMonth === parseInt(month);
        });
        console.log(`Filtered schemes for ${year}-${month}: ${filteredSchemes.length}`);

        // Group schemes by date for easier access
        const groupedSchemes = {};
        let totalHours = 0;

        filteredSchemes.forEach(scheme => {
            const dayOfMonth = scheme.date.getDate();
            if (!groupedSchemes[dayOfMonth]) {
                groupedSchemes[dayOfMonth] = [];
            }
            groupedSchemes[dayOfMonth].push(scheme);
            totalHours += scheme.hoursWorked;
        });

        const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in the month
        console.log(`Days in month ${month}/${year}: ${daysInMonth}`);

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Ground Schemes ${month}-${year}`);

        // Add headers
        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Name Of Schemes', key: 'schemeName', width: 30 },
            { header: 'Hours Worked', key: 'hoursWorked', width: 15 },
            { header: 'Signature', key: 'signature', width: 20 }
        ];

        // Populate rows
        for (let i = 1; i <= daysInMonth; i++) {
            const schemesForDay = groupedSchemes[i];
            if (schemesForDay && schemesForDay.length > 0) {
                schemesForDay.forEach((scheme, index) => {
                    worksheet.addRow({
                        no: index === 0 ? i : '',
                        date: index === 0 ? scheme.date.toDateString() : '',
                        schemeName: scheme.schemeName,
                        hoursWorked: scheme.hoursWorked,
                        signature: ''
                    });
                });
            } else {
                worksheet.addRow({
                    no: i,
                    date: new Date(year, month - 1, i).toDateString(),
                    schemeName: '',
                    hoursWorked: '',
                    signature: ''
                });
            }
        }

        // Add total hours row
        worksheet.addRow({
            no: '',
            date: '',
            schemeName: 'Total',
            hoursWorked: totalHours,
            signature: ''
        });

        // Add signature row
        

        // Write to buffer and save to file
        const buffer = await workbook.xlsx.writeBuffer();
        const filePath = path.join(__dirname, `../../public/downloads/ground_schemes_${user.username}_${year}_${month}.xlsx`);
        fs.writeFileSync(filePath, buffer);
        console.log(`File saved at: ${filePath}`);

        res.download(filePath, (err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Error downloading file');
                res.redirect(`/admin/schemes/${userId}`);
            } else {
                fs.unlinkSync(filePath);
            }
        });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error exporting Ground Schemes to Excel');
        res.redirect(`/admin/schemes/${userId}`);
    }
};




exports.downloadUsersDataWord = async (req, res) => {
    const { year } = req.params;

    try {
        const users = await User.find();
        const rows = [];

        for (const user of users) {
            const monthlySchemes = await getMonthlySchemes(user._id, year);
            const totalSchemes = monthlySchemes.reduce((acc, val) => acc + val, 0);

            // Only include users with schemes for the specified year
            if (totalSchemes > 0) {
                const row = {
                    Username: user.username,
                    Name: user.name,
                    'Account Number': user.accountNumber,
                    Email: user.email,
                    Mobile: user.mobile,
                    Role: user.role,
                    Verified: user.verified ? 'Yes' : 'No',
                    'Jan Schemes': monthlySchemes[0],
                    'Feb Schemes': monthlySchemes[1],
                    'Mar Schemes': monthlySchemes[2],
                    'Apr Schemes': monthlySchemes[3],
                    'May Schemes': monthlySchemes[4],
                    'Jun Schemes': monthlySchemes[5],
                    'Jul Schemes': monthlySchemes[6],
                    'Aug Schemes': monthlySchemes[7],
                    'Sep Schemes': monthlySchemes[8],
                    'Oct Schemes': monthlySchemes[9],
                    'Nov Schemes': monthlySchemes[10],
                    'Dec Schemes': monthlySchemes[11],
                    'Total Schemes Completed': totalSchemes,
                    Action: ''
                };

                rows.push(row);
            }
        }

        if (rows.length === 0) {
            req.flash('error', '');
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.5),
                            right: convertInchesToTwip(0.5),
                            bottom: convertInchesToTwip(0.5),
                            left: convertInchesToTwip(0.5)
                        }
                    }
                },
                children: [
                    new Paragraph({
                        text: `User Data for ${year}`,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            before: 0,
                            after: 200
                        }
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: 'pct'
                        },
                        rows: [
                            new TableRow({
                                children: Object.keys(rows[0]).map(header => new TableCell({ children: [new Paragraph(header)] })),
                                height: {
                                    value: convertInchesToTwip(0.256),
                                    rule: 'exact'
                                }
                            }),
                            ...rows.map(row => new TableRow({
                                children: Object.values(row).map(value => new TableCell({ children: [new Paragraph(value.toString())] })),
                                height: {
                                    value: convertInchesToTwip(0.256),
                                    rule: 'exact'
                                }
                            }))
                        ]
                    })
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        const downloadsDir = ensureDownloadDir();
        const filePath = path.join(downloadsDir, `users_${year}.docx`);
        fs.writeFileSync(filePath, buffer);

        res.download(filePath, (err) => {
            if (err) {
                req.flash('error', 'Error downloading the Word file.');
                res.redirect('/admin/manageUsers');
            } else {
                fs.unlinkSync(filePath);
            }
        });

    } catch (err) {
        console.error(err);
        req.flash('error', "Any user hasn't completed any schemes in this year.Sorry so you can't download it.");
        res.redirect('/admin/manageUsers');
    }
};

exports.downloadUsersDataExcel = async (req, res) => {
    const { year } = req.params;

    try {
        const users = await User.find();
        const rows = [];

        for (const user of users) {
            const monthlySchemes = await getMonthlySchemes(user._id, year);
            const totalSchemes = monthlySchemes.reduce((acc, val) => acc + val, 0);

            // Only include users with schemes for the specified year
            if (totalSchemes > 0) {
                const row = {
                    Username: user.username,
                    Name: user.name,
                    'Account Number': user.accountNumber,
                    Email: user.email,
                    Mobile: user.mobile,
                    Role: user.role,
                    Verified: user.verified ? 'Yes' : 'No',
                    'Jan Schemes': monthlySchemes[0],
                    'Feb Schemes': monthlySchemes[1],
                    'Mar Schemes': monthlySchemes[2],
                    'Apr Schemes': monthlySchemes[3],
                    'May Schemes': monthlySchemes[4],
                    'Jun Schemes': monthlySchemes[5],
                    'Jul Schemes': monthlySchemes[6],
                    'Aug Schemes': monthlySchemes[7],
                    'Sep Schemes': monthlySchemes[8],
                    'Oct Schemes': monthlySchemes[9],
                    'Nov Schemes': monthlySchemes[10],
                    'Dec Schemes': monthlySchemes[11],
                    'Total Schemes Completed': totalSchemes,
                    Action: ''
                };

                rows.push(row);
            }
        }

        if (rows.length === 0) {
            req.flash('error', '');
        }

        const downloadsDir = ensureDownloadDir();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Users_${year}`);
        
        worksheet.columns = Object.keys(rows[0]).map(key => ({
            header: key, key, width: 20
        }));

        rows.forEach(row => {
            worksheet.addRow(row);
        });

        const excelFilePath = path.join(downloadsDir, `users_${year}.xlsx`);
        await workbook.xlsx.writeFile(excelFilePath);

        res.download(excelFilePath, (err) => {
            if (err) {
                req.flash('error', 'Error downloading the Excel file.');
                res.redirect('/admin/manageUsers');
            } else {
                fs.unlinkSync(excelFilePath);
            }
        });

    } catch (err) {
        console.error(err);
        req.flash('error', "Any user hasn't completed any schemes in this year.Sorry so you can't download it.");
        res.redirect('/admin/manageUsers');
    }
};