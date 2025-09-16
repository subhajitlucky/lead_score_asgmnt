// schema.js
const pool = require("./db");

const createTables = async () => {
  try {
    // Offers table 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        value_props TEXT[],
        ideal_use_cases TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Leads table 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        company TEXT,
        industry TEXT,
        location TEXT,
        linkedin_bio TEXT,
        rule_score INT DEFAULT 0,
        ai_score INT DEFAULT 0,
        final_score INT DEFAULT 0,
        intent TEXT,
        reasoning TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Tables created successfully (offers + leads)");
    return true;
  } catch (err) {
    console.error("Error creating tables", err);
    throw err;
  }
};

// Export the function for use in other files
module.exports = { createTables };

// If this file is run directly, create tables and exit
if (require.main === module) {
  createTables()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
