<?php
// Include database configuration
require_once 'config.php';

// Check if user is logged in
requireLogin();

// Get username for display
$username = $_SESSION['username'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inspections Checker</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
</head>
<body>
    <div class="app-container">
        <!-- Header with time display and buttons -->
        <header>
            <div class="time-display">
                <span class="label">Panama Now:</span>
                <span id="panama-time" class="time">DD/MM HH:MM:SS</span>
            </div>
            <div class="user-info">
                <span>Welcome, <?php echo htmlspecialchars($username); ?></span>
                <a href="logout.php" class="btn btn-small">Logout</a>
            </div>
            <div class="header-buttons">
                <button id="check-btn" class="btn btn-primary">Check</button>
                <button id="pending-btn" class="btn btn-primary">Pending</button>
                <button id="save-btn" class="btn btn-primary">Save</button>
            </div>
        </header>

        <!-- Main content area with split panels -->
        <main>
            <div class="split-container">
                <!-- K9 Panel -->
                <div class="panel">
                    <div class="text-container">
                        <textarea id="k9-textarea" class="text-area" spellcheck="false" wrap="off">Copy K9 here....!!!</textarea>
                        <div id="k9-highlight" class="highlight-overlay"></div>
                    </div>
                    <div class="panel-buttons">
                        <button id="k9-clear-btn" class="btn btn-danger">Delete</button>
                        <button id="k9-copy-btn" class="btn btn-primary">Copy K9</button>
                    </div>
                </div>

                <!-- UW Panel -->
                <div class="panel">
                    <div class="text-container">
                        <textarea id="uw-textarea" class="text-area" spellcheck="false" wrap="off">Copy UnderWater here...!!!</textarea>
                        <div id="uw-highlight" class="highlight-overlay"></div>
                    </div>
                    <div class="panel-buttons">
                        <button id="uw-clear-btn" class="btn btn-danger">Delete</button>
                        <button id="uw-copy-btn" class="btn btn-primary">Copy U/W</button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Pending Inspections Modal -->
        <div id="pending-modal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>U/W & K9 Countdown</h2>
                    <span id="close-pending-modal" class="close-btn">&times;</span>
                </div>
                <div class="modal-body">
                    <table id="pending-table">
                        <thead>
                            <tr>
                                <th>Inspection Priorities</th>
                                <th>Time Left</th>
                            </tr>
                        </thead>
                        <tbody id="pending-tbody">
                            <!-- Table rows will be added here dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Save Session Modal -->
        <div id="save-modal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Save Session</h2>
                    <span id="close-save-modal" class="close-btn">&times;</span>
                </div>
                <div class="modal-body">
                    <div id="save-message" class="message hidden"></div>
                    
                    <div class="save-form">
                        <div class="form-group">
                            <label for="session-name">Session Name:</label>
                            <input type="text" id="session-name" placeholder="Enter a name for this session">
                            <input type="hidden" id="session-id" value="">
                        </div>
                        <div class="form-actions">
                            <button id="save-session-btn" class="btn btn-primary">Save</button>
                        </div>
                    </div>
                    
                    <div class="sessions-list-container">
                        <h3>Your Sessions</h3>
                        <div id="sessions-list" class="sessions-list">
                            <div class="loading">Loading your sessions...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>