<?php
// Include database configuration
require_once 'config.php';

// Check if user is logged in
requireLogin();

// Set headers for JSON response
header('Content-Type: application/json');

// Handle GET request for sessions list
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user ID from session
    $user_id = $_SESSION['user_id'];
    
    try {
        // Get all sessions for the current user
        $stmt = $conn->prepare("
            SELECT s.session_id, s.session_name, s.created_at, s.last_modified
            FROM sessions s
            WHERE s.user_id = ?
            ORDER BY s.last_modified DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $sessions = [];
        while ($row = $result->fetch_assoc()) {
            // Format dates
            $row['created_at_formatted'] = date('M j, Y g:i A', strtotime($row['created_at']));
            $row['last_modified_formatted'] = date('M j, Y g:i A', strtotime($row['last_modified']));
            $sessions[] = $row;
        }
        
        echo json_encode(['success' => true, 'sessions' => $sessions]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}