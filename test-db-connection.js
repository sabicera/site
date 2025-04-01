// test-db-connection.js
// A simple script to test your database connection

const mysql = require('mysql');

// Database configuration
const dbConfig = {
  host: '2yzhf.h.filess.io',
  port: '61002',
  database: 'inspections_strangeday',
  user: 'inspections_strangeday',
  password: '6e3ffeb5c219f8488f16fef036db9bac69b21e53'
};

console.log('Attempting to connect to database...');
console.log('Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  // Password hidden for log output
});

// Create connection
const connection = mysql.createConnection(dbConfig);

// Connect to database
connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    console.error('Connection failed with error code:', err.code);
    process.exit(1);
  }
  
  console.log('✅ Connected to database successfully!');
  
  // Test query
  console.log('Running test query...');
  connection.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error('❌ Error running test query:', err);
      process.exit(1);
    }
    
    console.log('✅ Test query successful. Result:', results[0].result);
    
    // Test vessels table
    console.log('Checking if vessels table exists...');
    connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_name = 'vessels'
    `, [dbConfig.database], (err, results) => {
      if (err) {
        console.error('❌ Error checking for vessels table:', err);
        process.exit(1);
      }
      
      if (results.length === 0) {
        console.log('⚠️ Vessels table does not exist. Creating it...');
        
        // Create vessels table
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
            console.error('❌ Error creating vessels table:', err);
            process.exit(1);
          }
          
          console.log('✅ Vessels table created successfully!');
          
          // Insert sample data
          console.log('Inserting sample vessel data...');
          const sampleVessel = {
            inspection: 'Both',
            inspectionTiming: 'Upon Departure',
            vessels: 'Test Vessel',
            etb: '25/03 - 1500',
            etd: '27/03 - 1800',
            port: 'Balboa',
            comments: 'This is a test vessel',
            departed: false
          };
          
          connection.query('INSERT INTO vessels SET ?', sampleVessel, (err) => {
            if (err) {
              console.error('❌ Error inserting sample data:', err);
            } else {
              console.log('✅ Sample data inserted successfully!');
            }
            
            // Close connection
            connection.end();
            console.log('Database connection closed.');
          });
        });
      } else {
        console.log('✅ Vessels table exists.');
        
        // Test count of vessels
        connection.query('SELECT COUNT(*) AS count FROM vessels', (err, results) => {
          if (err) {
            console.error('❌ Error counting vessels:', err);
          } else {
            console.log(`✅ Found ${results[0].count} vessels in the database.`);
          }
          
          // Close connection
          connection.end();
          console.log('Database connection closed.');
        });
      }
    });
  });
});
