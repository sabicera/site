<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // RECORD STATS
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->username)) {
        $query = "INSERT INTO usage_stats (username, files_processed, containers_processed, seals_extracted) 
                  VALUES (:username, :files, :containers, :seals)";
        
        $stmt = $conn->prepare($query);
        
        $username = htmlspecialchars(strip_tags($data->username));
        $files = intval($data->files);
        $containers = intval($data->containers);
        $seals = intval($data->seals);
        
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":files", $files);
        $stmt->bindParam(":containers", $containers);
        $stmt->bindParam(":seals", $seals);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Stats recorded"]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to record stats"]);
        }
    }
} elseif ($method === 'GET') {
    // GET AGGREGATED STATS
    // Returns stats grouped by user
    $query = "SELECT 
                username, 
                COUNT(*) as login_estimate, 
                SUM(files_processed) as totalFiles, 
                SUM(containers_processed) as totalContainers, 
                SUM(seals_extracted) as totalSeals, 
                MAX(timestamp) as lastActive 
              FROM usage_stats 
              GROUP BY username 
              ORDER BY totalContainers DESC";
              
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Transform data to match frontend Type
    $output = [];
    foreach($results as $row) {
        $output[] = [
            "username" => $row['username'],
            "totalFiles" => intval($row['totalFiles']),
            "totalContainers" => intval($row['totalContainers']),
            "totalSeals" => intval($row['totalSeals']),
            "lastActive" => $row['lastActive'],
            "loginCount" => intval($row['login_estimate']) // Rough estimate based on rows
        ];
    }
    
    echo json_encode($output);
}
?>
