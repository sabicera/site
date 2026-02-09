<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors as HTML, let JSON handle it if possible

include_once 'config.php';

// Ensure config.php didn't output anything that messes up JSON
if (headers_sent()) {
    exit("Server Error: Headers already sent by config.php");
}

header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER['REQUEST_METHOD'];

try {
    // --- GET: List All Users ---
    if ($method === 'GET') {
        // Return all users so Admin can see even those with 0 activity
        $stmt = $conn->query("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
        exit;
    }

    // --- POST: Create or Delete ---
    if ($method === 'POST') {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(["message" => "Invalid JSON input"]);
            exit;
        }

        if (!isset($data->action)) {
            http_response_code(400);
            echo json_encode(["message" => "No action specified"]);
            exit;
        }

        // 1. CREATE USER
        if ($data->action === 'create_user') {
            if (empty($data->username) || empty($data->password)) {
                http_response_code(400);
                echo json_encode(["message" => "Username and password are required"]);
                exit;
            }

            // Check if exists
            $check = $conn->prepare("SELECT id FROM users WHERE username = :username");
            $check->execute([':username' => $data->username]);
            
            if ($check->rowCount() > 0) {
                http_response_code(409);
                echo json_encode(["message" => "User already exists"]);
                exit;
            }

            // Insert
            $sql = "INSERT INTO users (username, password_hash, role) VALUES (:u, :p, :r)";
            $stmt = $conn->prepare($sql);
            
            $username = htmlspecialchars(strip_tags(trim($data->username)));
            $hash = password_hash($data->password, PASSWORD_DEFAULT);
            $role = !empty($data->role) ? $data->role : 'user';

            if ($stmt->execute([':u' => $username, ':p' => $hash, ':r' => $role])) {
                http_response_code(201);
                echo json_encode(["message" => "User created successfully"]);
            } else {
                throw new Exception("Database Insert failed");
            }
        }
        
        // 2. DELETE USER
        elseif ($data->action === 'delete_user') {
            if (empty($data->username)) {
                http_response_code(400); 
                echo json_encode(["message" => "Username required"]);
                exit;
            }
            
            // Protect root admin
            if ($data->username === 'admin') {
                http_response_code(403);
                echo json_encode(["message" => "Cannot delete the root 'admin' user."]);
                exit;
            }

            $stmt = $conn->prepare("DELETE FROM users WHERE username = :username");
            if ($stmt->execute([':username' => $data->username])) {
                echo json_encode(["message" => "User deleted successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Failed to delete user"]);
            }
        }
        else {
             http_response_code(400);
             echo json_encode(["message" => "Invalid action"]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>