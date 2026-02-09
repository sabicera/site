<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// --- GET: List All Users ---
if ($method === 'GET') {
    try {
        // Return all users so Admin can see even those with 0 activity
        $stmt = $conn->query("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => $e->getMessage()]);
    }
    exit;
}

// --- POST: Create or Delete ---
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
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

        try {
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
                throw new Exception("Insert failed");
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error: " . $e->getMessage()]);
        }
    }
    
    // 2. DELETE USER
    if ($data->action === 'delete_user') {
        if (empty($data->username)) {
            http_response_code(400); exit;
        }
        
        // Protect root admin
        if ($data->username === 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Cannot delete the root 'admin' user."]);
            exit;
        }

        try {
            $stmt = $conn->prepare("DELETE FROM users WHERE username = :username");
            if ($stmt->execute([':username' => $data->username])) {
                echo json_encode(["message" => "User deleted successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Failed to delete user"]);
            }
        } catch (Exception $e) {
             http_response_code(500);
             echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
?>