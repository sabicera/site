// Simple API proxy service for the Vessel Management System
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create MySQL connection
function createConnection(config) {
    return mysql.createConnection({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password
    });
}

// Test route
app.get('/', (req, res) => {
    res.send('Vessel Management System API Proxy is running');
});

// Connect to database
app.post('/connect', (req, res) => {
    const config = req.body;
    
    try {
        const connection = createConnection(config);
        
        connection.connect((err) => {
            if (err) {
                console.error('Error connecting to database:', err);
                return res.status(500).json({ success: false, message: err.message });
            }
            
            // Test the connection
            connection.query('SELECT 1', (err, results) => {
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }
                
                // Connection successful
                res.json({ success: true, message: 'Database connection successful' });
                
                // Close the connection
                connection.end();
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all vessels
app.get('/vessels', (req, res) => {
    const config = JSON.parse(req.query.config);
    
    try {
        const connection = createConnection(config);
        
        connection.connect((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            
            // Create the vessels table if it doesn't exist
            const createTableSql = `
                CREATE TABLE IF NOT EXISTS vessels (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    inspection VARCHAR(20) NOT NULL,
                    inspectionTiming VARCHAR(20) NOT NULL,
                    vessels VARCHAR(100) NOT NULL,
                    etb VARCHAR(20) NOT NULL,
                    etd VARCHAR(20) NOT NULL,
                    port VARCHAR(50) NOT NULL,
                    comments TEXT,
                    departed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `;
            
            connection.query(createTableSql, (err) => {
                if (err) {
                    connection.end();
                    return res.status(500).json({ success: false, message: err.message });
                }
                
                // Get all vessels
                connection.query('SELECT * FROM vessels', (err, results) => {
                    connection.end();
                    
                    if (err) {
                        return res.status(500).json({ success: false, message: err.message });
                    }
                    
                    res.json({ success: true, vessels: results });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new vessel
app.post('/vessels', (req, res) => {
    const config = req.body.config;
    const vessel = req.body.vessel;
    
    try {
        const connection = createConnection(config);
        
        connection.connect((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            
            // Insert vessel
            connection.query('INSERT INTO vessels SET ?', vessel, (err, result) => {
                connection.end();
                
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }
                
                res.json({ success: true, id: result.insertId });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update vessel
app.put('/vessels/:id', (req, res) => {
    const config = req.body.config;
    const update = req.body.update;
    const id = req.params.id;
    
    try {
        const connection = createConnection(config);
        
        connection.connect((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            
            // Create update object
            const updateObj = {};
            updateObj[update.field] = update.value;
            
            // Update vessel
            connection.query('UPDATE vessels SET ? WHERE id = ?', [updateObj, id], (err) => {
                connection.end();
                
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }
                
                res.json({ success: true });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete vessel
app.delete('/vessels/:id', (req, res) => {
    const config = req.body.config;
    const id = req.params.id;
    
    try {
        const connection = createConnection(config);
        
        connection.connect((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            
            // Delete vessel
            connection.query('DELETE FROM vessels WHERE id = ?', id, (err) => {
                connection.end();
                
                if (err) {
                    return res.status(500).json({ success: false, message: err.message });
                }
                
                res.json({ success: true });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`API Proxy Server running on port ${PORT}`);
});