const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust the path as per your file structure
const Scheme = require('./models/Scheme'); // Adjust the path as per your file structure
require('dotenv').config();
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('MongoDB connected');

    try {
        // Clear existing data
        await User.deleteMany({});
        await Scheme.deleteMany({});

        // Dummy data
        const userData = [
            {
                username: 'user1',
                name: 'User One',
                accountNumber: 'ACC001',
                email: 'user1@example.com',
                mobile: '1234567890',
                photo: 'user1.jpg',
                role: 'admin',
                is_verified: true,
                yearPeriod: [2023, 2024] // example array of years
            },
            {
                username: 'user2',
                name: 'User Two',
                accountNumber: 'ACC002',
                email: 'user2@example.com',
                mobile: '2345678901',
                photo: 'user2.jpg',
                yearPeriod: [2023, 2024]
            },
            {
                username: 'user3',
                name: 'User Three',
                accountNumber: 'ACC003',
                email: 'user3@example.com',
                mobile: '3456789012',
                photo: 'user3.jpg',
                yearPeriod: [2024]
            },
            {
                username: 'user4',
                name: 'User Four',
                accountNumber: 'ACC004',
                email: 'user4@example.com',
                mobile: '4567890123',
                photo: 'user4.jpg',
                yearPeriod: [2024]
            }
        ];

        // Create users with hashed passwords
        const createdUsers = [];
        for (const user of userData) {
            const newUser = new User({
                username: user.username,
                name: user.name,
                accountNumber: user.accountNumber,
                email: user.email,
                mobile: user.mobile,
                photo: user.photo,
                yearPeriod: user.yearPeriod
            });
            await User.register(newUser, 'password'); // assuming a default password 'password'
            createdUsers.push(newUser);
        }
        console.log('Users created:', createdUsers);

        // Dummy schemes
        const schemes = [];
        createdUsers.forEach(user => {
            // Generate 3 'ground' schemes for each user for each year in yearPeriod
            user.yearPeriod.forEach(year => {
                for (let i = 1; i <= 3; i++) {
                    schemes.push({
                        userId: user._id,
                        schemeName: `Ground Scheme ${i}`,
                        schemeType: 'ground',
                        hoursWorked: Math.floor(Math.random() * 10) + 1, // Random hours between 1 and 10
                        date: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1), // Random date within the year
                        year: year,
                        completed: true
                    });
                }
                // Generate 2 'department' schemes for each user for each year in yearPeriod
                for (let i = 1; i <= 2; i++) {
                    schemes.push({
                        userId: user._id,
                        schemeName: `Department Scheme ${i}`,
                        schemeType: 'department',
                        hoursWorked: Math.floor(Math.random() * 10) + 1, // Random hours between 1 and 10
                        date: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1), // Random date within the year
                        year: year,
                        completed: true
                    });
                }
            });
        });

        // Create schemes
        const createdSchemes = await Scheme.insertMany(schemes);
        console.log('Schemes created:', createdSchemes);

        // Close the connection after data insertion
        mongoose.connection.close();
    } catch (err) {
        console.error('Error inserting data:', err);
        mongoose.connection.close();
    }
}).catch(err => console.error('MongoDB connection error:', err));
