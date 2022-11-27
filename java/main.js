class MyHeader extends HTMLElement {
    connectedCallBack() {
        this.innerHTML = `
        <header>
            <a href="index.html" class="">
                <img src="#">
            </a>
            <nav>
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="downloads.html">Downloads</a></li>
                    <li><a href="guides.html">Guides</a></li>
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
