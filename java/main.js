class MyHeader extends HTMLElement {
    connectedCallBack() {
        this.innerHTML = `
        <header>
            <a href="home.html" class="">
                <img src="#">
            </a>
            <nav>
                <ul>
                    <li><a href="home.html">Home</a></li>
                    <li><a href="2.html">Downloads</a></li>
                    <li><a href="3.html">Guides</a></li>
                </ul>
            </nav>
        </header>
    `
    }
}

customElements.define('my-header', MyHeader)

class MyFooter extends HTMLElement {
    connectedCallBack() {
        this.innerHTML = `
        <footer>
        &copy; 2022 | Ramnuda
        </footer>
    `
    }
}

customElements.define('my-footer', MyFooter)
