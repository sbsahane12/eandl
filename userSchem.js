const mongoose = require('mongoose');
const Scheme = require('./models/Scheme'); // Adjust the path as necessary

const dummySchemes = [
    {
        userId: '6676de3b8f96365ab7b13f3a', 
        schemeName: 'Tree Planting',
        hoursWorked: 5,
        date: new Date('2023-06-02'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Beach Cleanup',
        hoursWorked: 3,
        date: new Date('2023-06-04'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Community Garden',
        hoursWorked: 4,
        date: new Date('2023-06-06'),
        completed: false
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Park Renovation',
        hoursWorked: 6,
        date: new Date('2023-06-08'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Neighborhood Watch',
        hoursWorked: 2,
        date: new Date('2023-06-12'),
        completed: false
    },


    {
        userId: '6676de3b8f96365ab7b13f3a', 
        schemeName: 'Tree Planting',
        hoursWorked: 5,
        date: new Date('2023-07-02'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Beach Cleanup',
        hoursWorked: 3,
        date: new Date('2023-07-04'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Community Garden',
        hoursWorked: 4,
        date: new Date('2023-07-06'),
        completed: false
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Park Renovation',
        hoursWorked: 6,
        date: new Date('2023-07-08'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Neighborhood Watch',
        hoursWorked: 2,
        date: new Date('2023-07-12'),
        completed: false
    },



    {
        userId: '6676de3b8f96365ab7b13f3a', 
        schemeName: 'Tree Planting',
        hoursWorked: 5,
        date: new Date('2023-08-02'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Beach Cleanup',
        hoursWorked: 3,
        date: new Date('2023-08-04'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Community Garden',
        hoursWorked: 4,
        date: new Date('2023-08-06'),
        completed: false
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Park Renovation',
        hoursWorked: 6,
        date: new Date('2023-08-08'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Neighborhood Watch',
        hoursWorked: 2,
        date: new Date('2023-08-12'),
        completed: false
    },

    {
        userId: '6676de3b8f96365ab7b13f3a', 
        schemeName: 'Tree Planting',
        hoursWorked: 5,
        date: new Date('2023-09-02'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Beach Cleanup',
        hoursWorked: 3,
        date: new Date('2023-09-04'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Community Garden',
        hoursWorked: 4,
        date: new Date('2023-09-06'),
        completed: false
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Park Renovation',
        hoursWorked: 6,
        date: new Date('2023-09-08'),
        completed: true
    },
    {
        userId: '6676de3b8f96365ab7b13f3a', // Replace with actual user IDs from your database
        schemeName: 'Neighborhood Watch',
        hoursWorked: 2,
        date: new Date('2023-09-12'),
        completed: false
    }
];

async function insertDummySchemes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/earnandlearn', { useNewUrlParser: true, useUnifiedTopology: true });

        await Scheme.deleteMany({});
        await Scheme.insertMany(dummySchemes);
        console.log('Dummy schemes inserted successfully');
        mongoose.connection.close();
    } catch (err) {
        console.error('Error inserting dummy schemes:', err);
    }
}

insertDummySchemes();
