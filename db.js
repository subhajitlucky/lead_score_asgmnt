const {Pool}= require('pg'); // Importing the Pool class from the pg module
require('dotenv').config(); // Loading environment variables from a .env file

// Creating a new Pool instance with database connection parameters from environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Testing the database connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Database connected successfully');
    release();
});

// Exporting the pool instance for use in other parts of the application
module.exports = pool;