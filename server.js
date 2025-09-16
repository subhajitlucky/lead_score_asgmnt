// server.js
const express = require('express');  //initializing express for server
const multer = require('multer');    //middleware for handling file uploads
const csv = require('csv-parser');   //CSV parsing library
const fs = require('fs');            //file system operations
const app = express();               //creating an instance of express
const pool = require('./db');        //importing the database connection pool


require("dotenv").config();          //loading environment variables from .env file

const PORT = process.env.PORT || 3000; //setting the port for the server

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/', // temporary directory for uploaded files
    fileFilter: (req, file, cb) => {
        // Only accept CSV files
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

app.use(express.json()); //middleware to parse JSON bodies

//health check the server
app.get('/health',
    (req, res) => {
        res.json({ status: "ok" });
    }
);

//database test route
app.get('/db-test',
    async (req, res) => {
        try {
            const result = await pool.query('SELECT NOW()'); //query to get current time from database
            res.json({ dbTime: result.rows[0] }); //sending the result as JSON response
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Database error' }); //handling errors
        }
    }
);

// POST /offers
app.post('/offers',
    async (req, res) => {
        try {
            // Extract offer details from request body
            const { name, value_props, ideal_use_cases } = req.body;

            // Insert new offer into the database
            const result = await pool.query(
                `INSERT INTO offers (name, value_props, ideal_use_cases)
       VALUES ($1, $2, $3)
       RETURNING *;`,
                [name, value_props, ideal_use_cases]
            );

            // Respond with the newly created offer
            res.status(201).json({
                message: "Offer created successfully",
                offer: result.rows[0],
            });
        } catch (error) {
            console.error("Error inserting offer:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// POST /leads/upload - Simple CSV upload
app.post('/leads/upload', upload.single('file'), async (req, res) => {
    try {
        // Step 1: Check if user uploaded a file
        if (!req.file) {
            return res.status(400).json({ error: "Please upload a CSV file" });
        }

        // Step 2: Read and parse the CSV file
        const leads = [];
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (row) => {
                // Step 3: For each row, save the lead data
                leads.push({
                    name: row.name,
                    role: row.role,
                    company: row.company,
                    industry: row.industry,
                    location: row.location,
                    linkedin_bio: row.linkedin_bio
                });
            })
            .on('end', async () => {
                // Step 4: Save all leads to database
                for (let lead of leads) {
                    await pool.query(
                        'INSERT INTO leads (name, role, company, industry, location, linkedin_bio) VALUES ($1, $2, $3, $4, $5, $6)',
                        [lead.name, lead.role, lead.company, lead.industry, lead.location, lead.linkedin_bio]
                    );
                }

                // Step 5: Delete the uploaded file (cleanup)
                fs.unlinkSync(req.file.path);

                // Step 6: Send success response
                res.json({
                    message: "CSV uploaded successfully!",
                    leads_count: leads.length
                });
            });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});



//starting the server
app.listen(PORT,
    () => {
        console.log(`Server is running on port ${PORT}`);
    }
)

