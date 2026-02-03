<?php
/**
 * Secure PDF API Backend
 * Modern PHP implementation with improved security and error handling
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

$config = [
    'db' => [
        'host' => 'localhost',
        'database' => 'securems_pdf',
        'username' => 'securems_admin',
        'password' => 'n]N?nE;x4Yu;,uR$',
        'charset' => 'utf8mb4'
    ]
];

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

function getDatabase($config) {
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = sprintf(
            "mysql:host=%s;dbname=%s;charset=%s",
            $config['db']['host'],
            $config['db']['database'],
            $config['db']['charset']
        );
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        try {
            $pdo = new PDO($dsn, $config['db']['username'], $config['db']['password'], $options);
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database connection failed');
        }
    }
    
    return $pdo;
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function successResponse($data = []) {
    jsonResponse(array_merge(['success' => true], $data));
}

function errorResponse($message, $statusCode = 400) {
    jsonResponse(['success' => false, 'message' => $message], $statusCode);
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

function getJsonInput() {
    // Only parse JSON for POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return [];
    }
    
    $input = file_get_contents('php://input');
    if (empty($input)) {
        return [];
    }
    
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }
    
    return $data ?? [];
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function sanitizeString($string, $maxLength = 255) {
    return substr(trim($string), 0, $maxLength);
}

// ============================================================================
// ROUTING
// ============================================================================

function getRoute() {
    $requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('api/', $requestPath, 2);
    return isset($pathParts[1]) ? 'api/' . rtrim($pathParts[1], '/') : trim($requestPath, '/');
}

// ============================================================================
// API HANDLERS
// ============================================================================

function handleRegister($pdo, $input) {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $name = $input['name'] ?? '';
    
    // Validate inputs
    if (empty($email) || empty($password) || empty($name)) {
        throw new Exception('Name, email and password are required');
    }
    
    if (!validateEmail($email)) {
        throw new Exception('Invalid email address');
    }
    
    if (strlen($password) < 6) {
        throw new Exception('Password must be at least 6 characters');
    }
    
    // Sanitize inputs
    $email = sanitizeString($email, 255);
    $name = sanitizeString($name, 100);
    
    // Check if email already exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        throw new Exception('Email already registered');
    }
    
    // Hash password (in production, use password_hash())
    // For compatibility with existing system, keeping plain text
    // TODO: Implement proper password hashing
    $token = bin2hex(random_bytes(16));
    
    // Insert new user
    $stmt = $pdo->prepare(
        'INSERT INTO users (email, password, name, verification_token, is_verified, plan, lifetime_processed, created_at) 
         VALUES (?, ?, ?, ?, 1, "free", 0, NOW())'
    );
    $stmt->execute([$email, $password, $name, $token]);
    
    successResponse();
}

function handleLogin($pdo, $input) {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        throw new Exception('Email and password are required');
    }
    
    // Query user
    $stmt = $pdo->prepare(
        'SELECT id, name, email, plan, is_verified 
         FROM users 
         WHERE email = ? AND password = ?'
    );
    $stmt->execute([$email, $password]);
    $user = $stmt->fetch();
    
    if (!$user) {
        errorResponse('Invalid credentials', 401);
    }
    
    successResponse(['user' => $user]);
}

function handleGlobalStats($pdo) {
    $stmt = $pdo->query('SELECT COALESCE(SUM(lifetime_processed), 0) as total FROM users');
    $row = $stmt->fetch();
    
    jsonResponse(['total' => (int)$row['total']]);
}

function handleUserStats($pdo, $userId) {
    if (!is_numeric($userId) || $userId <= 0) {
        throw new Exception('Invalid user ID');
    }
    
    $stmt = $pdo->prepare('SELECT lifetime_processed FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    
    if (!$row) {
        throw new Exception('User not found');
    }
    
    jsonResponse(['count' => (int)$row['lifetime_processed']]);
}

function handleUpdateStats($pdo, $input) {
    $userId = $input['userId'] ?? 0;
    $count = $input['count'] ?? 0;
    
    if (!is_numeric($userId) || $userId <= 0) {
        throw new Exception('Invalid user ID');
    }
    
    if (!is_numeric($count) || $count < 0) {
        throw new Exception('Invalid count');
    }
    
    $stmt = $pdo->prepare(
        'UPDATE users 
         SET lifetime_processed = lifetime_processed + ?,
             updated_at = NOW()
         WHERE id = ?'
    );
    $stmt->execute([$count, $userId]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('User not found');
    }
    
    successResponse();
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

try {
    $pdo = getDatabase($config);
    $route = getRoute();
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Parse input (only for POST requests)
    $input = getJsonInput();
    
    // Log request for debugging (remove in production)
    error_log("API Request: $method $route");
    
    switch ($route) {
        case 'api/test':
            // Simple test endpoint
            jsonResponse([
                'success' => true,
                'message' => 'API is working!',
                'method' => $method,
                'route' => $route,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
            
        case 'api/register':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }
            handleRegister($pdo, $input);
            break;
            
        case 'api/login':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }
            handleLogin($pdo, $input);
            break;
            
        case 'api/global-stats':
            if ($method !== 'GET') {
                errorResponse('Method not allowed', 405);
            }
            handleGlobalStats($pdo);
            break;
            
        case 'api/update-stats':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }
            handleUpdateStats($pdo, $input);
            break;
            
        default:
            // Check if it's a user stats request
            if (preg_match('/^api\/stats\/(\d+)$/', $route, $matches)) {
                if ($method !== 'GET') {
                    errorResponse('Method not allowed', 405);
                }
                handleUserStats($pdo, $matches[1]);
            } else {
                errorResponse('API route not found: ' . $route, 404);
            }
            break;
    }
    
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    errorResponse($e->getMessage(), 400);
}