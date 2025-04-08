<?php
// Include database configuration
require_once 'config.php';

// Check if user is logged in
requireLogin();

// Set headers for JSON response
header('Content-Type: application/json');

// Handle GET request to load a session
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    // Get session ID from request and user ID from session
    $session_id = intval($_GET['id']);
    $user_id = $_SESSION['user_id'];
    
    try {
        // Get session data
        $stmt = $conn->prepare("
            SELECT s.session_id, s.session_name, s.created_at, s.last_modified,
                   t.k9_text, t.uw_text
            FROM sessions s
            LEFT JOIN text_content t ON s.session_id = t.session_id
            WHERE s.session_id = ? AND s.user_id = ?
        ");
        $stmt->bind_param("ii", $session_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Session not found or you don\'t have permission to access it']);
            exit;
        }
        
        $session = $result->fetch_assoc();
        
        // Format dates
        $session['created_at_formatted'] = date('M j, Y g:i A', strtotime($session['created_at']));
        $session['last_modified_formatted'] = date('M j, Y g:i A', strtotime($session['last_modified']));
        
        echo json_encode(['success' => true, 'session' => $session]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
}