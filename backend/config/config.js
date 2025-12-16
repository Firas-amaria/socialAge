const mongoose = require('mongoose');
const dotenv = require('dotenv');


// Load environment variables from .env file
dotenv.config();

/**
 * Validate required environment variables
 */
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'DEEPSEEK_API_KEY'];

requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        console.error(`❌ Missing environment variable: ${envVar}`);
        process.exit(1);
    }
});

console.log('✅ Environment variables loaded successfully');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
        process.exit(1); // Exit if connection fails
    }
};

// Export database connection function
module.exports = { connectDB };
