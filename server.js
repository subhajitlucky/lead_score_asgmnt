// server.js
const express = require('express');  //initializing express for server
const app = express();               //creating an instance of express
const pool = require('./db');        //importing the database connection pool


require("dotenv").config();          //loading environment variables from .env file

const PORT = process.env.PORT || 3000; //setting the port for the server

app.use(express.json()); //middleware to parse JSON bodies

//health check the server
app.get('/health', 
    (req,res) => {
        res.json({status:"ok"});
    }
);

//database test route
app.get('/db-test', 
    async (req,res) => {
        try {
            const result = await pool.query('SELECT NOW()'); //query to get current time from database
            res.json({dbTime: result.rows[0]}); //sending the result as JSON response
        } catch (err) {
            console.error(err.message);
            res.status(500).json({error: 'Database error'}); //handling errors
        }
    }
);

//starting the server
app.listen(PORT ,
    () => {
        console.log(`Server is running on port ${PORT}`);
    }
)

