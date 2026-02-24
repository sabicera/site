<?php
// Prevent caching
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Display errors for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

function extract_config() {
    $file = 'config.php';
    if (!file_exists($file)) return null;
    
    $content = file_get_contents($file);
    $creds = [];
    
    // Regex to extract values without executing the file
    if (preg_match('/\$host\s*=\s*["\']([^"\']+)["\']/', $content, $m)) $creds['host'] = $m[1];
    if (preg_match('/\$db_name\s*=\s*["\']([^"\']+)["\']/', $content, $m)) $creds['db_name'] = $m[1];
    if (preg_match('/\$username\s*=\s*["\']([^"\']+)["\']/', $content, $m)) $creds['username'] = $m[1];
    if (preg_match('/\$password\s*=\s*["\']([^"\']+)["\']/', $content, $m)) $creds['password'] = $m[1];
    
    return $creds;
}

$creds = extract_config();
$pdo = null;
$status = "pending";
$error_msg = "";
$tables = [];
$users = [];

// Normalize extensions to lowercase for easier checking
$php_extensions = array_map('strtolower', get_loaded_extensions());

// 1. Connection Test
if ($creds) {
    try {
        $dsn = "mysql:host=" . $creds['host'] . ";dbname=" . $creds['db_name'];
        $pdo = new PDO($dsn, $creds['username'], $creds['password']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $status = "success";
    } catch (PDOException $e) {
        $status = "error";
        $error_msg = $e->getMessage();
    }
}

// 2. Data Retrieval (only if connected)
if ($status === "success" && $pdo) {
    try {
        // List Tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Check Users
        if (in_array('users', $tables)) {
            $uStmt = $pdo->query("SELECT id, username, role, created_at FROM users LIMIT 10");
            $users = $uStmt->fetchAll(PDO::FETCH_ASSOC);
        }
    } catch (Exception $e) {
        $error_msg = "Query Error: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DB Diagnostic Tool</title>
    <script type='text/javascript' nonce='UHCRLwf2DVHsGlg1OSQ2SA==' src='https://aistudio.google.com/31MkhckhbVySncLPJrGLCbfl8bhXm-8wRVCK0mVIumpolly1uXARzF7K3_okC641-4jJpgLQ4EW_U7OtTx8Oea3Rb5oB-3oRDpO2LrDoJnfdBVrEDjTGji6Cqa0XBFg77pIymNFdanJNzk_9lgFwatgJaTl7QlUsbHnrpppsGBueRFpWauI0HCY2EXkcoQjidUrXNnuCutTR5w-2XQRTRlAgKAl_nvRm97irhj2XcX0ntLr19c22_BnUutAdKd_db0KaxuQL1O0Ut_-gKHDFBGjjKZqQXGJeRlxWU7eQgvSHm2Ph52ar8x2gKb3gS1OcQ8BQVRVya7kwlzIoxMi5oT_jJY_pmNUVGDJUKKXwxgu1xqi4LXhveDXfoAgvK0Skqt1_lNPdskHrC2TkVuRS_xltjIqTrU10np55ZDB-SXbFQrq19SmIlrq3y1W2Z1rL2jwB6s-1aG95F6tWScO9z1oHrevLd4mxZPk58RSnNLIg6U8UK50zb4vyvBV_8_U2Cs5OJAiWIIf34JFMvlr3801WDGJ83lf4gWxhSdlEqcXPeHQpHkoRv9p3Pc75YPb9UJ831K04GVGkwQ7NbMmgNLS3--Yagf3ROlNQCQFJMH1siUabJQ'></script><script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.25rem; font-weight: 600; }
        .value { font-family: monospace; background: #020617; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #1e293b; color: #e2e8f0; }
        .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
        .badge-success { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
        .badge-error { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    </style>
</head>
<body class="p-6 max-w-4xl mx-auto">

    <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <span class="p-2 bg-blue-600 rounded-lg">🛠</span>
            System Diagnostics
        </h1>
        <div class="text-sm text-slate-400">
            PHP v<?php echo phpversion(); ?>
        </div>
    </div>

    <!-- 1. Configuration Check -->
    <div class="card">
        <h2 class="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">1. Config File (public/api/config.php)</h2>
        <?php if ($creds): ?>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div class="label">Status</div>
                    <div class="text-emerald-400 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" viewbox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        Found & Parsed
                    </div>
                </div>
                <div>
                    <div class="label">Host</div>
                    <div class="value"><?php echo htmlspecialchars($creds['host']); ?></div>
                </div>
                <div>
                    <div class="label">Database</div>
                    <div class="value"><?php echo htmlspecialchars($creds['db_name']); ?></div>
                </div>
                <div>
                    <div class="label">User</div>
                    <div class="value"><?php echo htmlspecialchars($creds['username']); ?></div>
                </div>
            </div>
        <?php else: ?>
            <div class="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400">
                <strong>Error:</strong> config.php not found or could not be read.
            </div>
        <?php endif; ?>
    </div>

    <!-- 2. Connection Test -->
    <div class="card">
        <h2 class="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">2. Database Connection</h2>
        <?php if ($status === "success"): ?>
            <div class="flex flex-col gap-4">
                <div class="badge badge-success self-start">
                    Connection Successful
                </div>
                <div class="text-slate-300 text-sm">
                    Successfully authenticated with MySQL server.
                </div>
            </div>
        <?php elseif ($status === "error"): ?>
            <div class="flex flex-col gap-4">
                <div class="badge badge-error self-start">
                    Connection Failed
                </div>
                <div class="p-4 bg-red-950/50 border border-red-500/30 rounded text-red-300 font-mono text-sm break-all">
                    <?php echo htmlspecialchars($error_msg); ?>
                </div>
                <div class="text-slate-400 text-sm">
                    <strong>Tip:</strong> If you see "Access denied", check your password. If you see "Unknown database", check the DB name.
                </div>
            </div>
        <?php else: ?>
            <div class="text-slate-500">Waiting for config...</div>
        <?php endif; ?>
    </div>

    <!-- 3. Table Integrity -->
    <?php if ($status === "success"): ?>
        <div class="card">
            <h2 class="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">3. Table Status</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <!-- Table List -->
                <div>
                    <div class="label">Tables in Database</div>
                    <?php if (count($tables) > 0): ?>
                        <ul class="mt-2 space-y-1">
                            <?php foreach($tables as $t): ?>
                                <li class="flex items-center gap-2 text-sm text-slate-300">
                                    <span class="w-1.5 h-1.5 rounded-full &lt;?php echo in_array($t, [&#39;users&#39;, &#39;usage_stats&#39;]) ? &#39;bg-emerald-500&#39; : &#39;bg-slate-500&#39;; ?&gt;"></span>
                                    <?php echo htmlspecialchars($t); ?>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php else: ?>
                        <div class="text-amber-400 text-sm mt-2">Database is empty (0 tables).</div>
                    <?php endif; ?>
                </div>

                <!-- User Check -->
                <div>
                    <div class="label">Users Table Check</div>
                    <?php if (in_array('users', $tables)): ?>
                        <?php if (count($users) > 0): ?>
                            <div class="mt-2">
                                <table class="w-full text-left text-sm text-slate-400">
                                    <thead class="text-xs uppercase bg-slate-800/50">
                                        <tr>
                                            <th class="p-2">ID</th>
                                            <th class="p-2">Username</th>
                                            <th class="p-2">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-700">
                                        <?php foreach($users as $u): ?>
                                            <tr>
                                                <td class="p-2 font-mono text-slate-500"><?php echo $u['id']; ?></td>
                                                <td class="p-2 text-white font-semibold"><?php echo htmlspecialchars($u['username']); ?></td>
                                                <td class="p-2"><?php echo htmlspecialchars($u['role']); ?></td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php else: ?>
                            <div class="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded mt-2 text-sm">
                                Table 'users' exists but is empty. You cannot log in.
                            </div>
                        <?php endif; ?>
                    <?php else: ?>
                        <div class="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded mt-2 text-sm">
                            CRITICAL: Table 'users' is missing.
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- 4. Environment -->
    <div class="card">
        <div class="label mb-2">PHP Environment Check</div>
        <div class="flex flex-wrap gap-2">
            <?php 
            $required = ['pdo', 'pdo_mysql', 'json'];
            foreach($required as $ext) {
                // Check if class exists for PDO, or extension is loaded (case-insensitive)
                $has = false;
                if ($ext === 'pdo') {
                    $has = class_exists('PDO');
                } else {
                    $has = in_array(strtolower($ext), $php_extensions);
                }
                
                echo '<span class="px-2 py-1 rounded text-xs font-bold '.($has ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400').'">';
                echo $ext . ' ' . ($has ? '✓' : 'MISSING');
                echo '</span>';
            }
            ?>
        </div>
        <div class="text-xs text-slate-500 mt-2">
            Note: If Database Connection (Step 2) is successful, PDO is definitely working regardless of this check.
        </div>
    </div>

</body>
</html>