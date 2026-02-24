<?php
// Utility to generate a bcrypt password hash for manual database updates
// Usage: Visit /api/generate_password.php?password=YOUR_NEW_PASSWORD

// Buffer output to prevent premature header sending if any
ob_start();

$db_status = "Unknown";
$db_message = "";
$user_exists = false;
$conn = null;
$update_success = false;
$update_error = "";

try {
    if (file_exists('config.php')) {
        // Include config to get $conn. 
        // config.php sets Content-Type: application/json, so we must override it later.
        include 'config.php';
        
        if (isset($conn)) {
            $db_status = "Connected";
            
            // Check if table exists
            try {
                $check = $conn->query("SELECT 1 FROM users LIMIT 1");
                $db_message = "Table 'users' exists.";
                
                // Check if admin exists
                $stmt = $conn->prepare("SELECT id FROM users WHERE username = 'admin'");
                $stmt->execute();
                if ($stmt->rowCount() > 0) {
                    $user_exists = true;
                    $db_message .= " User 'admin' found.";
                } else {
                    $db_message .= " User 'admin' NOT found.";
                }
            } catch (Exception $e) {
                $db_status = "Connected (Issues Found)";
                $db_message = "Table 'users' might be missing. Error: " . $e->getMessage();
            }
        }
    } else {
        $db_status = "Config Missing";
    }
} catch (Exception $e) {
    $db_status = "Connection Failed";
    $db_message = $e->getMessage();
}

// CRITICAL: Override the JSON header from config.php with HTML
header("Content-Type: text/html; charset=UTF-8");

$password = isset($_REQUEST['password']) ? $_REQUEST['password'] : 'password123';
$hash = password_hash($password, PASSWORD_DEFAULT);

// Handle Auto-Update
if (isset($_POST['action']) && $_POST['action'] === 'update_admin' && $conn) {
    try {
        if ($user_exists) {
            $sql = "UPDATE users SET password_hash = :hash WHERE username = 'admin'";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':hash', $hash);
            $stmt->execute();
            $update_success = true;
            $db_message = "✅ Password successfully updated for 'admin'!";
        } else {
             $sql = "INSERT INTO users (username, password_hash, role) VALUES ('admin', :hash, 'admin')";
             $stmt = $conn->prepare($sql);
             $stmt->bindParam(':hash', $hash);
             $stmt->execute();
             $update_success = true;
             $user_exists = true;
             $db_message = "✅ User 'admin' created with new password!";
        }
    } catch (Exception $e) {
        $update_error = "Update Failed: " . $e->getMessage();
    }
}

// Clear any buffered output (like potential whitespace from includes)
ob_end_clean();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Password & DB Helper</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; line-height: 1.5; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        h2 { margin-top: 0; color: #3b82f6; font-size: 1.25rem; margin-bottom: 1rem; }
        code { background: #020617; padding: 4px 8px; border-radius: 4px; color: #10b981; font-family: monospace; font-size: 0.9em; }
        .sql-block { display: block; background: #020617; padding: 15px; margin-top: 10px; border-radius: 6px; color: #cbd5e1; font-family: monospace; white-space: pre-wrap; border: 1px solid #334155; }
        
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 0.875rem; font-weight: 600; }
        .status-success { background: #059669; color: white; }
        .status-error { background: #dc2626; color: white; }
        .status-warning { background: #d97706; color: white; }
        
        input[type="text"] { background: #334155; border: 1px solid #475569; color: white; padding: 8px 12px; border-radius: 6px; width: 100%; max-width: 300px; }
        button { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        button:hover { background: #2563eb; }
        button.btn-green { background: #059669; }
        button.btn-green:hover { background: #047857; }
        
        .form-row { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
        .alert-success { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .alert-error { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        
        .nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .back-link { color: #94a3b8; text-decoration: none; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; }
        .back-link:hover { color: white; }
    </style>
<script type='text/javascript' nonce='QDLeK3CFzlgTJ02z0KE1Rw==' src='https://aistudio.google.com/xUgbpHL5B41LKpkPZY7FTqqI3peHComKefyF3i26kTRWLuXR11uIQAeiLrcPM_AePtZ-E-yKEJCuHYWxiTFWkkhNip5-iv_SU5GctsckUmjWW7hRFtlfup1kO3SjfPm3CiaJigkJerSL1-899HInfjH139fSlethvU3YkyK3fHJGjbfblyzaHxmsDmOfKBEE4Hy1yHRdAezEXbXXDJ-nnsaXMDKYTGZ8wLa_s907xf3ZnVabyHvvsmZ2ynYbGnC7Xjfnj5yUnU0XTOoF-1M6T4nd7rf16gj3EoM4mT1WxyROara-uvX5QoJoGUkJ02dXUn0u5JuLemw7wOR2jHpmfRj-RwYZ3k4OWWTInpDJvUkek4ot9QJf3FRXd_emdYXoHvHg-hVpTpxeosEIAbL6G0VLdhKK-H_PNGadUZfsoR_ove-T_c8HiRAskPbfFfu0s3647l6G-EakCVoZgzPfgFkNNz2Nwk_YCTx1SI6NHOKptLGTeyRwD-VNUlkFqgQ3wBywXqyElyzR5DAa2TNd2LLf0gjMvew6YWjH6JA1BI3hXO6hWzhjOGd0hrzz9mxhLBJOfgR7zauv4CVHBGrPV-0SbQHpZwAai3mez8uX0Jj7JuZ0Mw'></script></head>
<body>
    <div class="container">
        
        <div class="nav-header">
            <h1 style="font-size: 1.5rem; margin:0; color: white;">Setup Helper</h1>
            <a href="/" class="back-link">
                <svg width="16" height="16" fill="none" viewbox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back to Login
            </a>
        </div>
        
        <?php if ($update_success): ?>
        <div class="alert-success">
            <strong>Success!</strong> You can now log in with username: <strong>admin</strong> and password: <strong><?php echo htmlspecialchars($password); ?></strong>
            <div style="margin-top:10px;"><a href="/" style="color:white; text-decoration:underline;">Go to Login Page</a></div>
        </div>
        <?php endif; ?>

        <?php if ($update_error): ?>
        <div class="alert-error">
            <?php echo htmlspecialchars($update_error); ?>
        </div>
        <?php endif; ?>

        <!-- DB Status Card -->
        <div class="card">
            <h2>Database Connection Status</h2>
            <p>
                Status: 
                <span class="status-badge &lt;?php echo strpos($db_status, &#39;Connected&#39;) !== false ? &#39;status-success&#39; : &#39;status-error&#39;; ?&gt;">
                    <?php echo htmlspecialchars($db_status); ?>
                </span>
            </p>
            <?php if ($db_message): ?>
                <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 8px;"><?php echo htmlspecialchars($db_message); ?></p>
            <?php endif; ?>
        </div>

        <!-- Password Generator Card -->
        <div class="card">
            <h2>Update User Password</h2>
            <form method="POST" action="">
                <input type="hidden" name="action" value="update_admin">
                <div class="form-row">
                    <input type="text" name="password" value="&lt;?php echo htmlspecialchars($password); ?&gt;" placeholder="Enter new password">
                    <?php if ($db_status === "Connected"): ?>
                        <button type="submit" class="btn-green">Update 'admin' Password Now</button>
                    <?php else: ?>
                        <button type="button" disabled="" style="opacity:0.5; cursor:not-allowed;">DB Not Connected</button>
                    <?php endif; ?>
                </div>
            </form>
            <p style="font-size:0.85rem; color:#94a3b8; margin-top:-10px; margin-bottom:20px;">Clicking "Update" will instantly apply this password to the database.</p>

            <p><strong>Hash Preview:</strong> <code><?php echo htmlspecialchars($hash); ?></code></p>
            
            <hr style="border-color: #334155; margin: 20px 0;">
            
            <p>Manual SQL (if you prefer phpMyAdmin):</p>
            <?php if ($db_status === "Connected" && !$user_exists): ?>
                <div class="sql-block">INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '<?php echo $hash; ?>', 'admin');</div>
            <?php else: ?>
                <div class="sql-block">UPDATE users 
SET password_hash = '<?php echo $hash; ?>' 
WHERE username = 'admin';</div>
            <?php endif; ?>
        </div>

        <!-- Table Setup Helper -->
        <div class="card">
             <h2>Missing Tables?</h2>
             <p style="font-size: 0.9rem; color: #94a3b8;">If your database is empty, run this SQL to set up the required table:</p>
             <div class="sql-block">CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    files_processed INT DEFAULT 0,
    containers_processed INT DEFAULT 0,
    seals_extracted INT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);</div>
        </div>

    </div>
</body>
</html>