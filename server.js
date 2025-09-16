// server.js
const express = require('express');  //initializing express for server
const multer = require('multer');    //middleware for handling file uploads
const csv = require('csv-parser');   //CSV parsing library
const fs = require('fs');            //file system operations
const { GoogleGenerativeAI } = require('@google/generative-ai'); //Google Gemini for AI scoring
const app = express();               //creating an instance of express
const pool = require('./db');        //importing the database connection pool


require("dotenv").config();          //loading environment variables from .env file

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

// SCORING FUNCTIONS - Let me explain each one!

// Function 1: Calculate rule-based score (max 50 points)
function calculateRuleScore(lead) {
    let score = 0;

    // Rule 1: Role relevance (max 20 points)
    const decisionMakerRoles = ['ceo', 'cto', 'vp', 'director', 'head', 'manager'];
    const influencerRoles = ['senior', 'lead', 'principal', 'architect'];

    const roleWords = lead.role.toLowerCase().split(' ');

    // Check if they're a decision maker
    const isDecisionMaker = decisionMakerRoles.some(role =>
        roleWords.some(word => word.includes(role))
    );

    // Check if they're an influencer
    const isInfluencer = influencerRoles.some(role =>
        roleWords.some(word => word.includes(role))
    );

    if (isDecisionMaker) {
        score += 20; // Decision makers get full points
    } else if (isInfluencer) {
        score += 10; // Influencers get half points
    }
    // Everyone else gets 0 points

    // Rule 2: Industry match (max 20 points)
    const idealIndustries = ['saas', 'software', 'tech', 'startup'];
    const adjacentIndustries = ['consulting', 'marketing', 'analytics'];

    const industryLower = lead.industry.toLowerCase();

    if (idealIndustries.some(industry => industryLower.includes(industry))) {
        score += 20; // Perfect match
    } else if (adjacentIndustries.some(industry => industryLower.includes(industry))) {
        score += 10; // Adjacent industry
    }

    // Rule 3: Data completeness (max 10 points)
    const hasAllFields = lead.name && lead.role && lead.company &&
        lead.industry && lead.location && lead.linkedin_bio;

    if (hasAllFields && lead.linkedin_bio.length > 50) {
        score += 10; // Complete profile with good bio
    }

    return score;
}

// Function 2: Calculate AI-based score using Google Gemini (max 50 points)
async function calculateAIScore(lead, offer) {
    try {
        // Create a simple prompt for Gemini AI
        const prompt = `
You are a sales expert. Analyze this lead and determine their buying intent for our product.

PRODUCT: ${offer.name}
VALUE PROPS: ${offer.value_props.join(', ')}
IDEAL USE CASES: ${offer.ideal_use_cases.join(', ')}

LEAD INFORMATION:
Name: ${lead.name}
Role: ${lead.role}
Company: ${lead.company}
Industry: ${lead.industry}
Location: ${lead.location}
LinkedIn Bio: ${lead.linkedin_bio}

Based on this information, classify their buying intent as exactly one word: High, Medium, or Low

Respond with ONLY one word.
`;

        // Call Gemini AI
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const intent = response.text().trim().toLowerCase();
        
        // Convert AI response to points and reasoning
        if (intent.includes('high')) {
            return { 
                points: 50, 
                intent: 'High', 
                reasoning: 'Gemini AI detected high buying intent based on role and profile match' 
            };
        } else if (intent.includes('medium')) {
            return { 
                points: 30, 
                intent: 'Medium', 
                reasoning: 'Gemini AI detected medium buying intent with moderate fit' 
            };
        } else {
            return { 
                points: 10, 
                intent: 'Low', 
                reasoning: 'Gemini AI detected low buying intent with limited relevance' 
            };
        }
        
    } catch (error) {
        console.error('Gemini AI scoring error:', error.message);
        // Fallback scoring if AI fails
        return { 
            points: 25, 
            intent: 'Medium', 
            reasoning: 'AI unavailable, using default score' 
        };
    }
}// POST /score - The main scoring endpoint!
app.post('/score', async (req, res) => {
    try {
        // Step 1: Get the most recent offer from database
        const offerResult = await pool.query('SELECT * FROM offers ORDER BY created_at DESC LIMIT 1');

        if (offerResult.rows.length === 0) {
            return res.status(400).json({ error: "No offers found. Please create an offer first." });
        }

        const offer = offerResult.rows[0];

        // Step 2: Get all leads from database
        const leadsResult = await pool.query('SELECT * FROM leads');

        if (leadsResult.rows.length === 0) {
            return res.status(400).json({ error: "No leads found. Please upload leads first." });
        }

        const leads = leadsResult.rows;

        // Step 3: Score each lead (one by one)
        const scoredLeads = [];

        for (let lead of leads) {
            // Calculate rule score (max 50)
            const ruleScore = calculateRuleScore(lead);

            // Calculate AI score (max 50) 
            const aiResult = await calculateAIScore(lead, offer);

            // Calculate final score
            const finalScore = ruleScore + aiResult.points;

            // Update the lead in database with scores
            await pool.query(
                'UPDATE leads SET rule_score = $1, ai_score = $2, final_score = $3, intent = $4, reasoning = $5 WHERE id = $6',
                [ruleScore, aiResult.points, finalScore, aiResult.intent, aiResult.reasoning, lead.id]
            );

            // Add to results
            scoredLeads.push({
                name: lead.name,
                role: lead.role,
                company: lead.company,
                rule_score: ruleScore,
                ai_score: aiResult.points,
                final_score: finalScore,
                intent: aiResult.intent,
                reasoning: aiResult.reasoning
            });
        }

        // Step 4: Send results
        res.json({
            message: "Scoring completed successfully!",
            offer_used: offer.name,
            leads_scored: scoredLeads.length,
            results: scoredLeads
        });

    } catch (error) {
        console.error("Scoring error:", error);
        res.status(500).json({ error: "Something went wrong during scoring" });
    }
});

// GET /results - Get all scored leads
app.get('/results', async (req, res) => {
    try {
        // Get all leads with their scores
        const result = await pool.query(`
            SELECT name, role, company, industry, location, 
                   rule_score, ai_score, final_score, intent, reasoning
            FROM leads 
            WHERE final_score IS NOT NULL 
            ORDER BY final_score DESC
        `);

        if (result.rows.length === 0) {
            return res.json({
                message: "No scored leads found. Please run scoring first.",
                results: []
            });
        }

        res.json({
            message: "Scored leads retrieved successfully",
            count: result.rows.length,
            results: result.rows
        });

    } catch (error) {
        console.error("Results error:", error);
        res.status(500).json({ error: "Something went wrong getting results" });
    }
});

//starting the server
app.listen(PORT,
    () => {
        console.log(`Server is running on port ${PORT}`);
    }
)

