// This is a Header section //

header.innerHTML = `
<header>
<nav>
    <a href="index.html"><h1 class="logo">Ramnuda&copy;</h1></a>
    <a href="#" title="menu" class="toggle-button"><span class="bar"></span><span class="bar"></span><span class="bar"></span></a>
    <ul class="menu">
        <li><a href="#">Downloads</a>
            <ul class="submenu">
                <li><a href="downloads/windows.html">Windows ISO</a></li>
                <li><a href="downloads/drivers.html">GPU Drivers</a></li>
                <li><a href="downloads/programs.html">Programs</a></li>
            </ul>
        </li>
        <li><a href="#">Guides</a>
            <ul class="submenu">
                <li><a href="guides/commands.html">Commands</a>
                    <li><a href="#">How to</a>
                        <ul class="submenu2">
                            <li><a href="guides/howto/win-install.html">Windows setup</a></li>
                            <li><a href="guides/howto/bios-update.html">Bios Update</a></li>
                        </ul>
                    </li>
                </li>
            </ul>
        </li>
        <li><a href="#">Did you Know</a>
            <ul class="submenu">
                <li><a href="didyouknow/usbversions.html">USB Versions</a></li>
                <li><a href="didyouknow/hdmiversions.html">HDMI Versions</a></li>
                <li><a href="didyouknow/pcieversions.html">PCIe Versions</a></li>
                <li><a href="didyouknow/psucalc.html">PSU Efficiency</a></li>
                <li><a href="didyouknow/storage.html">Storage Interfaces</a></li>
                <li><a href="didyouknow/wane.html">WAN Standards</a></li>
                <li><a href="didyouknow/bluetooth.html">Bluetooth Interface</a></li>
                <li><a href="didyouknow/video.html">Digital Video Rates</a></li>
                <li><a href="didyouknow/ethernet.html">Ethernet Cables Speeds</a></li>
            </ul>
        </li>
        <li><a href="cdkeys.html">Buy CDKeys</a></li>
        <li><a href="https://www.buymeacoffee.com/sabicera">Buy me a beer</a></li>
    </ul>
</nav>
</header>
`;

// This a a Footer section //

footer.innerHTML = `
<footer>
    <h1 class="footer">Ramnuda &copy; 2022  |  All rights reserved</h1>
</footer>
<a href="#" title="Go up" class="to-top"><i class="fa-solid fa-chevron-up"></i></a>
`;
