<?php
// Database configuration
define('DB_SERVER', '2yzhf.h.filess.io');
define('DB_USERNAME', 'inspections_strangeday'); // Change to your MySQL username
define('DB_PASSWORD', '6e3ffeb5c219f8488f16fef036db9bac69b21e53'); // Change to your MySQL password
define('DB_NAME', 'inspections_strangeday');

// Create database connection
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Function to check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Function to redirect if not logged in
function requireLogin() {
    if (!isLoggedIn()) {
        header("Location: login.php");
        exit;
    }
}