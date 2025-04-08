<?php
// Include database configuration
require_once 'config.php';

$error = '';
$success = '';

// Handle registration form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    
    // Validate input
    if (empty($username) || empty($email) || empty($password) || empty($confirm_password)) {
        $error = "Please fill out all fields.";
    } elseif ($password !== $confirm_password) {
        $error = "Passwords do not match.";
    } elseif (strlen($password) < 6) {
        $error = "Password must be at least 6 characters.";
    } else {
        // Check if username already exists
        $sql = "SELECT user_id FROM users WHERE username = ?";
        
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $stmt->store_result();
            
            if ($stmt->num_rows > 0) {
                $error = "This username is already taken.";
            } else {
                $stmt->close();
                
                // Check if email already exists
                $sql = "SELECT user_id FROM users WHERE email = ?";
                
                if ($stmt = $conn->prepare($sql)) {
                    $stmt->bind_param("s", $email);
                    $stmt->execute();
                    $stmt->store_result();
                    
                    if ($stmt->num_rows > 0) {
                        $error = "This email is already registered.";
                    } else {
                        $stmt->close();
                        
                        // All checks passed, insert new user
                        $sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
                        
                        if ($stmt = $conn->prepare($sql)) {
                            // Hash the password
                            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                            
                            $stmt->bind_param("sss", $username, $email, $hashed_password);
                            
                            if ($stmt->execute()) {
                                $success = "Registration successful! You can now <a href='login.php'>login</a>.";
                            } else {
                                $error = "Something went wrong. Please try again later.";
                            }
                            
                            $stmt->close();
                        }
                    }
                }
            }
        }
    }
    
    // Close connection
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Inspections Checker</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body class="login-page">
    <div class="login-container">
        <div class="login-header">
            <h1>Create Account</h1>
            <p>Register to use Inspections Checker</p>
        </div>
        
        <?php if (!empty($error)): ?>
            <div class="error-message">
                <?php echo $error; ?>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($success)): ?>
            <div class="success-message">
                <?php echo $success; ?>
            </div>
        <?php else: ?>
            <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post" class="login-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                    <small>At least 6 characters</small>
                </div>
                
                <div class="form-group">
                    <label for="confirm_password">Confirm Password</label>
                    <input type="password" id="confirm_password" name="confirm_password" required>
                </div>
                
                <div class="form-group">
                    <button type="submit" class="btn btn-primary btn-block">Register</button>
                </div>
                
                <div class="form-footer">
                    <p>Already have an account? <a href="login.php">Login here</a></p>
                </div>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>