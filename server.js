// server.js
const express = require('express');  //initializing express for server
const app = express();               //creating an instance of express

require("dotenv").config();          //loading environment variables from .env file

const PORT = process.env.PORT || 3000; //setting the port for the server

app.use(express.json()); //middleware to parse JSON bodies

//health check the server
app.get('/health', 
    (req,res) => {
        res.json({status:"ok"});
    }
);

//starting the server
app.listen(PORT ,
    () => {
        console.log(`Server is running on port ${PORT}`);
    }
)

