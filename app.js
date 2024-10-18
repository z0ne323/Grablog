const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const express = require('express');

// Set default port
const PORT = process.env.PORT || 443;
const LOGS_DIR = path.join(__dirname, 'logs'); // Centralized logs directory

const app = express();

// Load TLS certificate and key
let tlsOptions;
try {
    tlsOptions = loadTLSCertificates();
} catch (error) {
    logMessage(`Error loading TLS certificates: ${error.message}`, '[-]');
    process.exit(1);
}

/**
 * Loads the TLS certificates from disk.
 * 
 * @returns {Object} - Contains the key and cert for the server.
 */
function loadTLSCertificates() {
    return {
        key: fs.readFileSync(path.join(__dirname, 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
    };
}

/**
 * Get date formatting options based on the provided timezone.
 * 
 * @param {string} timezone - The timezone to format the date.
 * @returns {Object} - Date formatting options.
 */
function getDateFormatOptions(timezone) {
    return {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
}

/**
 * Gets the formatted date and time as a string.
 * 
 * @returns {string} - Formatted date and time.
 */
function getFormattedDateTime() {
    const timezone = process.env.TZ || 'America/New_York';
    let formatter;

    try {
        formatter = new Intl.DateTimeFormat('en-US', getDateFormatOptions(timezone));
    } catch (error) {
        console.error(`Invalid timezone specified: ${timezone}. Defaulting to America/New_York.`);
        formatter = new Intl.DateTimeFormat('en-US', getDateFormatOptions('America/New_York'));
    }

    const dateParts = formatter.formatToParts(new Date());
    const formattedDate = {
        year: dateParts.find(part => part.type === 'year').value,
        month: dateParts.find(part => part.type === 'month').value,
        day: dateParts.find(part => part.type === 'day').value,
        hour: dateParts.find(part => part.type === 'hour').value,
        minute: dateParts.find(part => part.type === 'minute').value,
        second: dateParts.find(part => part.type === 'second').value,
    };

    return `${formattedDate.year}-${formattedDate.month}-${formattedDate.day} ${formattedDate.hour}:${formattedDate.minute}:${formattedDate.second}`;
}

/**
 * Logs a message with a timestamp to the console and a log file.
 * 
 * @param {string} message - The message to log.
 * @param {string} [type='[*]'] - An optional type prefix for the log entry (default is '[*]').
 */
function logMessage(message, type = '[*]') {
    const timeStamp = getFormattedDateTime();
    const logEntry = `${timeStamp} ${type} ${message}\n`;

    // Log to console for immediate feedback (optional)
    console.log(logEntry.trim());

    try {
        fs.appendFileSync(path.join(LOGS_DIR, 'access.log'), logEntry);
    } catch (error) {
        console.error(`Error writing to log file: ${error.message}`);
    }
}

// Centralized error handling middleware
app.use((err, req, res, next) => {
    logMessage(`Error: ${err.message}`, '[-]');
    res.status(err.status || 500).json({ message: 'An error occurred. Please try again later.' });
});

// Utility function for async error handling
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware to log requests
app.use((req, res, next) => {
    const ip = req.ip;
    const method = req.method;
    const userAgent = req.get('User-Agent');
    logMessage(`Incoming request: ${method} ${req.path} from IP: ${ip}, User Agent: ${userAgent}`, '[*]');
    next();
});

// Catch-all route to handle any other paths and redirect
app.all('*', asyncHandler(async (req, res) => {
    const primaryRedirectUrl = process.env.REDIRECT_URL || 'https://www.google.com';
    const fallbackRedirectUrl = 'https://www.bing.com';

    logMessage(`Attempting to redirect from path: ${req.path}`, '[*]');

    try {
        const response = await axios.get(primaryRedirectUrl, { timeout: 5000 });
        if (response.status === 200) {
            logMessage(`Successfully redirected to ${primaryRedirectUrl}`, '[+]');
            return res.redirect(primaryRedirectUrl);
        }
        throw new Error('Primary URL responded with a non-200 status');
    } catch (error) {
        logMessage(`Error fetching ${primaryRedirectUrl}: ${error.message}`, '[-]');
        if (error.response) {
            logMessage(`Response data: ${JSON.stringify(error.response.data)}`, '[-]');
        }
        logMessage(`Redirecting to fallback URL: ${fallbackRedirectUrl}`, '[*]');
        res.redirect(fallbackRedirectUrl);
    }
}));

// Start the HTTPS server
https.createServer(tlsOptions, app).listen(PORT, () => {
    logMessage(`Server is running on https://localhost:${PORT}`, '[+]');
});

// Handle graceful shutdowns
process.on('SIGINT', () => {
    logMessage('Shutting down gracefully...', '[-]');
    process.exit();
});

process.on('SIGTERM', () => {
    logMessage('Shutting down gracefully...', '[-]');
    process.exit();
});

// Capture unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logMessage(`Unhandled Rejection at: ${promise}, reason: ${reason}`, '[-]');
});
