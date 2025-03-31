<?php
// Set headers to allow cross-origin requests and JSON content type
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'], '/'));
$input = json_decode(file_get_contents('php://input'), true);

// Database credentials
$host = '2yzhf.h.filess.io';
$port = '61002';
$database = 'inspections_strangeday';
$user = 'inspections_strangeday';
$password = '6e3ffeb5c219f8488f16fef036db9bac69b21e53';

// Connect to database
function connectToDatabase() {
    global $host, $port, $database, $user, $password;
    
    $conn = new mysqli($host, $port, $user, $password, $database);
    
    if ($conn->connect_error) {
        returnError("Connection failed: " . $conn->connect_error);
    }
    
    return $conn;
}

// Return error response
function returnError($message) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

// Return success response
function returnSuccess($data = null) {
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

// Create tables if they don't exist
function ensureTablesExist($conn) {
    $createVesselsTable = "
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
    ";
    
    if (!$conn->query($createVesselsTable)) {
        returnError("Error creating tables: " . $conn->error);
    }
}

// Test the database connection
if ($method === 'GET' && $request[0] === 'test') {
    try {
        $conn = connectToDatabase();
        ensureTablesExist($conn);
        $conn->close();
        returnSuccess(['message' => 'Connection successful']);
    } catch (Exception $e) {
        returnError("Connection failed: " . $e->getMessage());
    }
}

// Get all vessels
if ($method === 'GET' && $request[0] === 'vessels') {
    try {
        $conn = connectToDatabase();
        ensureTablesExist($conn);
        
        $result = $conn->query("SELECT * FROM vessels ORDER BY etd ASC");
        
        $vessels = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $vessels[] = $row;
            }
        }
        
        $conn->close();
        returnSuccess(['vessels' => $vessels]);
    } catch (Exception $e) {
        returnError("Error fetching vessels: " . $e->getMessage());
    }
}

// Add a new vessel
if ($method === 'POST' && $request[0] === 'vessels') {
    try {
        $conn = connectToDatabase();
        ensureTablesExist($conn);
        
        // Validate required fields
        if (!isset($input['vessels']) || !isset($input['etb']) || !isset($input['etd']) || !isset($input['port'])) {
            returnError("Missing required fields");
        }
        
        // Prepare the SQL statement
        $stmt = $conn->prepare("INSERT INTO vessels (inspection, inspectionTiming, vessels, etb, etd, port, comments, departed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssssi", 
            $input['inspection'], 
            $input['inspectionTiming'], 
            $input['vessels'], 
            $input['etb'], 
            $input['etd'], 
            $input['port'], 
            $input['comments'], 
            $departed
        );
        
        // Set default values
        $departed = isset($input['departed']) ? $input['departed'] : 0;
        
        if ($stmt->execute()) {
            $id = $conn->insert_id;
            $stmt->close();
            $conn->close();
            returnSuccess(['id' => $id]);
        } else {
            returnError("Error adding vessel: " . $stmt->error);
        }
    } catch (Exception $e) {
        returnError("Error adding vessel: " . $e->getMessage());
    }
}

// Update a vessel
if ($method === 'PUT' && $request[0] === 'vessels' && isset($request[1])) {
    try {
        $conn = connectToDatabase();
        ensureTablesExist($conn);
        
        $id = $request[1];
        
        // Build update SQL based on provided fields
        $updateFields = [];
        $types = "";
        $values = [];
        
        if (isset($input['inspection'])) {
            $updateFields[] = "inspection = ?";
            $types .= "s";
            $values[] = $input['inspection'];
        }
        
        if (isset($input['inspectionTiming'])) {
            $updateFields[] = "inspectionTiming = ?";
            $types .= "s";
            $values[] = $input['inspectionTiming'];
        }
        
        if (isset($input['vessels'])) {
            $updateFields[] = "vessels = ?";
            $types .= "s";
            $values[] = $input['vessels'];
        }
        
        if (isset($input['etb'])) {
            $updateFields[] = "etb = ?";
            $types .= "s";
            $values[] = $input['etb'];
        }
        
        if (isset($input['etd'])) {
            $updateFields[] = "etd = ?";
            $types .= "s";
            $values[] = $input['etd'];
        }
        
        if (isset($input['port'])) {
            $updateFields[] = "port = ?";
            $types .= "s";
            $values[] = $input['port'];
        }
        
        if (isset($input['comments'])) {
            $updateFields[] = "comments = ?";
            $types .= "s";
            $values[] = $input['comments'];
        }
        
        if (isset($input['departed'])) {
            $updateFields[] = "departed = ?";
            $types .= "i";
            $values[] = $input['departed'] ? 1 : 0;
        }
        
        // Return error if no fields to update
        if (empty($updateFields)) {
            returnError("No fields to update");
        }
        
        // Add ID to values and types
        $values[] = $id;
        $types .= "i";
        
        $sql = "UPDATE vessels SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        // Bind parameters dynamically
        $bindParams = array($types);
        foreach ($values as $key => $value) {
            $bindParams[] = &$values[$key];
        }
        call_user_func_array(array($stmt, 'bind_param'), $bindParams);
        
        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            returnSuccess(['message' => 'Vessel updated successfully']);
        } else {
            returnError("Error updating vessel: " . $stmt->error);
        }
    } catch (Exception $e) {
        returnError("Error updating vessel: " . $e->getMessage());
    }
}

// Update a specific field of a vessel
if ($method === 'PATCH' && $request[0] === 'vessels' && isset($request[1])) {
    try {
        $conn = connectToDatabase();
        ensureTablesExist($conn);
        
        $id = $request[1];
        
        // Validate required fields
        if (!isset($input['field']) || !isset($input['value'])) {
            returnError("Missing field or value");
        }
        
        $field = $input['field'];
        $value = $input['value'];
        
        // Validate field
        $allowedFields = ['inspection', 'inspectionTiming', 'vessels', 'etb', 'etd', 'port', 'comments', 'departed'];
        if (!in_array($field, $allowedFields)) {
            returnError("Invalid field: " . $field);
        }
        
        // Prepare the SQL statement
        $sql = "UPDATE vessels SET $field = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        // Bind parameters based on field type
        if ($field === 'departed') {
            $stmt->bind_param("ii", $value, $id);
        } else {
            $stmt->bind_param("si", $value, $id);
        }
        
        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            returnSuccess(['message' => 'Field updated successfully']);
        } else {
            returnError("Error updating field: " . $stmt->error);
        }
    } catch (Exception $e) {
        returnError("Error updating field: " . $e->getMessage());
    }
}

// Delete a vessel
if ($method === 'DELETE' && $request[0] === 'vessels' && isset($request[1])) {
    try {
        $conn = connectToDatabase();
        ensureTablesExist($conn);
        
        $id = $request[1];
        
        // Prepare the SQL statement
        $stmt = $conn->prepare("DELETE FROM vessels WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            returnSuccess(['message' => 'Vessel deleted successfully']);
        } else {
            returnError("Error deleting vessel: " . $stmt->error);
        }
    } catch (Exception $e) {
        returnError("Error deleting vessel: " . $e->getMessage());
    }
}

// If no route matched, return 404
http_response_code(404);
echo json_encode(['success' => false, 'message' => 'Not found']);