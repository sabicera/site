<?php
// Include database configuration
require_once 'config.php';

// Check if user is logged in
requireLogin();

// Set headers for JSON response
header('Content-Type: application/json');

// Handle DELETE request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['session_id'])) {
    // Get session ID from request and user ID from session
    $session_id = intval($_POST['session_id']);
    $user_id = $_SESSION['user_id'];
    
    try {
        // Verify session belongs to user
        $stmt = $conn->prepare("
            SELECT session_id FROM sessions
            WHERE session_id = ? AND user_id = ?
        ");
        $stmt->bind_param("ii", $session_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Session not found or you don\'t have permission to delete it']);
            exit;
        }
        
        // Delete session (cascades to text_content due to foreign key)
        $stmt = $conn->prepare("DELETE FROM sessions WHERE session_id = ?");
        $stmt->bind_param("i", $session_id);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Session deleted successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
}