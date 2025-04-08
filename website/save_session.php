<?php
// Include database configuration
require_once 'config.php';

// Check if user is logged in
requireLogin();

// Set headers for JSON response
header('Content-Type: application/json');

// Handle POST request to save a session
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data from request body
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);
    
    // Validate input
    if (!isset($data['session_name']) || empty($data['session_name'])) {
        echo json_encode(['success' => false, 'message' => 'Session name is required']);
        exit;
    }
    
    // Get user ID from session
    $user_id = $_SESSION['user_id'];
    $session_name = $data['session_name'];
    $k9_text = $data['k9_text'] ?? '';
    $uw_text = $data['uw_text'] ?? '';
    $session_id = $data['session_id'] ?? null;
    
    // Begin transaction
    $conn->begin_transaction();
    
    try {
        if ($session_id) {
            // Update existing session
            $stmt = $conn->prepare("UPDATE sessions SET session_name = ? WHERE session_id = ? AND user_id = ?");
            $stmt->bind_param("sii", $session_name, $session_id, $user_id);
            $stmt->execute();
            
            if ($stmt->affected_rows === 0) {
                throw new Exception("Session not found or you don't have permission to update it");
            }
            
            // Update text content
            $stmt = $conn->prepare("UPDATE text_content SET k9_text = ?, uw_text = ? WHERE session_id = ?");
            $stmt->bind_param("ssi", $k9_text, $uw_text, $session_id);
            $stmt->execute();
            
            if ($stmt->affected_rows === 0) {
                // Insert if update failed (shouldn't normally happen)
                $stmt = $conn->prepare("INSERT INTO text_content (session_id, k9_text, uw_text) VALUES (?, ?, ?)");
                $stmt->bind_param("iss", $session_id, $k9_text, $uw_text);
                $stmt->execute();
            }
            
            $message = "Session updated successfully";
        } else {
            // Create new session
            $stmt = $conn->prepare("INSERT INTO sessions (user_id, session_name) VALUES (?, ?)");
            $stmt->bind_param("is", $user_id, $session_name);
            $stmt->execute();
            
            $session_id = $conn->insert_id;
            
            // Create text content
            $stmt = $conn->prepare("INSERT INTO text_content (session_id, k9_text, uw_text) VALUES (?, ?, ?)");
            $stmt->bind_param("iss", $session_id, $k9_text, $uw_text);
            $stmt->execute();
            
            $message = "Session created successfully";
        }
        
        // Commit transaction
        $conn->commit();
        
        echo json_encode(['success' => true, 'message' => $message, 'session_id' => $session_id]);
    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}