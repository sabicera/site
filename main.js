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
                    <li><a href="guides/psuefficiency.html">PSU Efficiency</a></li>
                    <li><a href="guides/win-install.html">Windows setup</a></li>
                    <li><a href="guides/biosupdate.html">Bios Update</a></li>
                    <li><a href="guides/random.html">Random</a></li>
                </ul>
            </li>
            <li><a href="cdkeys.html">Buy CDKeys</a></li>
        </ul>
    </nav>
</header>
`;

// This a a Footer section //

footer.innerHTML = `
<footer>
    <h1 class="footer">Ramnuda &copy; 2022  |  All rights reserved</h1>
</footer>
<a href="" title="Go up" class="to-top"><i class="fa-solid fa-chevron-up"></i></a>
`;
