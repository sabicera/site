<?php
include_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if ($data && !empty($data->username) && !empty($data->password)) {
    $query = "SELECT id, username, password_hash, role FROM users WHERE username = :username LIMIT 1";
    $stmt = $conn->prepare($query);
    
    // Sanitize and TRIM whitespace which often causes copy-paste login issues
    $username = htmlspecialchars(strip_tags(trim($data->username)));
    
    $stmt->bindParam(":username", $username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (password_verify($data->password, $row['password_hash'])) {
            // Login Successful
            http_response_code(200);
            echo json_encode([
                "message" => "Login successful",
                "username" => $row['username'],
                "role" => $row['role']
            ]);
        } else {
            // Password mismatch
            http_response_code(401);
            echo json_encode(["message" => "Invalid credentials"]);
        }
    } else {
        // User not found
        // To prevent user enumeration, use a small delay
        usleep(300000); // 300ms delay
        http_response_code(401);
        echo json_encode(["message" => "Invalid credentials"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data"]);
}
?>