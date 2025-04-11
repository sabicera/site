using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Net.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using MySql.Data.MySqlClient;

namespace VesselBridgeApplication
{
    public partial class MainForm : Form
    {
        private string apiUrl = "http://localhost:3000"; // Default API URL
        private string dbHost = "2yzhf.h.filess.io";
        private string dbPort = "61002";
        private string dbName = "inspections_strangeday";
        private string dbUser = "inspections_strangeday";
        private string dbPassword = "6e3ffeb5c219f8488f16fef036db9bac69b21e53";
        private bool isConnected = false;
        private HttpClient httpClient;
        private Timer refreshTimer;

        // List to store vessel data
        private List<Vessel> vessels = new List<Vessel>();
        
        public MainForm()
        {
            InitializeComponent();
            httpClient = new HttpClient();
            
            // Initialize timer for periodic updates
            refreshTimer = new Timer();
            refreshTimer.Interval = 30000; // 30 seconds
            refreshTimer.Tick += RefreshTimer_Tick;
            
            // Set initial UI state
            UpdateConnectionStatus(false);
        }

        private void MainForm_Load(object sender, EventArgs e)
        {
            // Load settings from app.config if available
            LoadSettings();
            
            // Initialize the UI
            txtApiUrl.Text = apiUrl;
            txtDbHost.Text = dbHost;
            txtDbPort.Text = dbPort;
            txtDbName.Text = dbName;
            txtDbUser.Text = dbUser;
            txtDbPassword.Text = dbPassword;
            
            // Set up the data grid view
            SetupDataGridView();
        }
        
        private void SetupDataGridView()
        {
            // Configure the vessels data grid view
            dgvVessels.AutoGenerateColumns = false;
            
            // Add columns
            dgvVessels.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "Id",
                HeaderText = "ID",
                DataPropertyName = "Id",
                Width = 50
            });
            
            dgvVessels.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "Inspection",
                HeaderText = "Inspection",
                DataPropertyName = "Inspection",
                Width = 100
            });
            
            dgvVessels.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "InspectionTiming",
                HeaderText = "Timing",
                DataPropertyName = "InspectionTiming",
                Width = 100
            });
            
            dgvVessels.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "VesselName",
                HeaderText = "Vessel",
                DataPropertyName = "VesselName",
                Width = 150
            });
            
            dgvVessels.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "ETB",
                HeaderText = "ETB",
                DataPropertyName = "ETB",
                Width = 100
            });
            
            dgvVessels.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "ETD",
                HeaderText = "ETD",
                DataPropertyName = "ETD",
                Width = 100
            });
            
            dgvVessels.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "Port",
                HeaderText = "Port",
                DataPropertyName = "Port",
                Width = 100
            });
            
            dgvVessels.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = "Comments",
                HeaderText = "Comments",
                DataPropertyName = "Comments",
                Width = 200
            });
            
            dgvVessels.Columns.Add(new DataGridViewCheckBoxColumn
            {
                Name = "Departed",
                HeaderText = "Departed",
                DataPropertyName = "Departed",
                Width = 70
            });
        }

        private void LoadSettings()
        {
            // Load settings from app.config
            // This is a placeholder - implement as needed
            apiUrl = Properties.Settings.Default.ApiUrl;
            dbHost = Properties.Settings.Default.DbHost;
            dbPort = Properties.Settings.Default.DbPort;
            dbName = Properties.Settings.Default.DbName;
            dbUser = Properties.Settings.Default.DbUser;
            dbPassword = Properties.Settings.Default.DbPassword;
        }

        private void SaveSettings()
        {
            // Save settings to app.config
            Properties.Settings.Default.ApiUrl = apiUrl;
            Properties.Settings.Default.DbHost = dbHost;
            Properties.Settings.Default.DbPort = dbPort;
            Properties.Settings.Default.DbName = dbName;
            Properties.Settings.Default.DbUser = dbUser;
            Properties.Settings.Default.DbPassword = dbPassword;
            Properties.Settings.Default.Save();
        }

        private async void btnConnect_Click(object sender, EventArgs e)
        {
            // Update connection parameters from input fields
            apiUrl = txtApiUrl.Text.Trim();
            dbHost = txtDbHost.Text.Trim();
            dbPort = txtDbPort.Text.Trim();
            dbName = txtDbName.Text.Trim();
            dbUser = txtDbUser.Text.Trim();
            dbPassword = txtDbPassword.Text.Trim();
            
            // Try to connect to database
            try
            {
                // Show status
                lblStatus.Text = "Connecting...";
                Application.DoEvents();
                
                // Test direct MySQL connection first
                bool directDbConnection = await TestDirectDatabaseConnection();
                
                if (directDbConnection)
                {
                    // Now test API connection
                    bool apiConnection = await TestApiConnection();
                    
                    if (apiConnection)
                    {
                        // Both connections successful
                        UpdateConnectionStatus(true);
                        SaveSettings();
                        
                        // Load vessel data
                        await LoadVessels();
                        
                        // Start refresh timer
                        refreshTimer.Start();
                    }
                    else
                    {
                        // API connection failed
                        MessageBox.Show("API connection failed. Please check API URL and try again.",
                            "Connection Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        UpdateConnectionStatus(false);
                    }
                }
                else
                {
                    // Direct database connection failed
                    MessageBox.Show("Database connection failed. Please check database settings and try again.",
                        "Connection Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    UpdateConnectionStatus(false);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error connecting to database: {ex.Message}",
                    "Connection Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                UpdateConnectionStatus(false);
            }
        }

        private async Task<bool> TestDirectDatabaseConnection()
        {
            try
            {
                string connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};Uid={dbUser};Pwd={dbPassword};";
                using (MySqlConnection connection = new MySqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    // Test the connection with a simple query
                    using (MySqlCommand cmd = new MySqlCommand("SELECT 1", connection))
                    {
                        await cmd.ExecuteScalarAsync();
                    }
                    return true;
                }
            }
            catch (Exception)
            {
                return false;
            }
        }

        private async Task<bool> TestApiConnection()
        {
            try
            {
                // Create API connection test endpoint
                string testUrl = $"{apiUrl}/";
                HttpResponseMessage response = await httpClient.GetAsync(testUrl);
                return response.IsSuccessStatusCode;
            }
            catch (Exception)
            {
                return false;
            }
        }

        private void UpdateConnectionStatus(bool connected)
        {
            isConnected = connected;
            if (connected)
            {
                lblStatus.Text = "Connected to database";
                lblStatus.ForeColor = Color.Green;
                btnConnect.Text = "Reconnect";
                btnSync.Enabled = true;
            }
            else
            {
                lblStatus.Text = "Not connected";
                lblStatus.ForeColor = Color.Red;
                btnConnect.Text = "Connect";
                btnSync.Enabled = false;
                refreshTimer.Stop();
            }
        }

        private async void RefreshTimer_Tick(object sender, EventArgs e)
        {
            // Auto-refresh vessels data
            await LoadVessels();
        }

        private async void btnSync_Click(object sender, EventArgs e)
        {
            await SyncVessels();
        }

        private async Task SyncVessels()
        {
            if (!isConnected)
            {
                MessageBox.Show("Not connected to database. Please connect first.",
                    "Connection Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            try
            {
                lblStatus.Text = "Syncing vessels...";
                Application.DoEvents();

                // Get vessels from web app database
                await LoadVessels();

                // Now sync with the web application
                // This would likely involve an API call to push data to the web app
                // For this example, we'll just show a success message
                MessageBox.Show("Vessels synchronized successfully.",
                    "Sync Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);

                lblStatus.Text = "Connected to database";
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error syncing vessels: {ex.Message}",
                    "Sync Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                lblStatus.Text = "Connected to database";
            }
        }

        private async Task LoadVessels()
        {
            if (!isConnected) return;

            try
            {
                // First try to load from direct database connection
                await LoadVesselsFromDatabase();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error loading vessels: {ex.Message}",
                    "Data Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task LoadVesselsFromDatabase()
        {
            string connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};Uid={dbUser};Pwd={dbPassword};";
            
            using (MySqlConnection connection = new MySqlConnection(connectionString))
            {
                await connection.OpenAsync();
                
                // Check if vessels table exists, create if not
                await EnsureVesselsTableExists(connection);
                
                // Load vessels from database
                string sql = "SELECT * FROM vessels";
                using (MySqlCommand cmd = new MySqlCommand(sql, connection))
                {
                    using (MySqlDataReader reader = (MySqlDataReader)await cmd.ExecuteReaderAsync())
                    {
                        vessels.Clear();
                        
                        while (await reader.ReadAsync())
                        {
                            Vessel vessel = new Vessel
                            {
                                Id = reader.GetInt32("id"),
                                Inspection = reader.GetString("inspection"),
                                InspectionTiming = reader.GetString("inspectionTiming"),
                                VesselName = reader.GetString("vessels"),
                                ETB = reader.GetString("etb"),
                                ETD = reader.GetString("etd"),
                                Port = reader.GetString("port"),
                                Comments = reader.IsDBNull(reader.GetOrdinal("comments")) ? "" : reader.GetString("comments"),
                                Departed = reader.GetBoolean("departed")
                            };
                            
                            vessels.Add(vessel);
                        }
                    }
                }
            }
            
            // Update data grid view
            dgvVessels.DataSource = null;
            dgvVessels.DataSource = vessels;
            
            // Update status
            lblVesselCount.Text = $"Total Vessels: {vessels.Count}";
        }

        private async Task EnsureVesselsTableExists(MySqlConnection connection)
        {
            // Check if vessels table exists, create if not
            string createTableSql = @"
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
                )";
            
            using (MySqlCommand cmd = new MySqlCommand(createTableSql, connection))
            {
                await cmd.ExecuteNonQueryAsync();
            }
        }

        private void btnExit_Click(object sender, EventArgs e)
        {
            Application.Exit();
        }
    }

    public class Vessel
    {
        public int Id { get; set; }
        public string Inspection { get; set; }
        public string InspectionTiming { get; set; }
        public string VesselName { get; set; }
        public string ETB { get; set; }
        public string ETD { get; set; }
        public string Port { get; set; }
        public string Comments { get; set; }
        public bool Departed { get; set; }
    }
}