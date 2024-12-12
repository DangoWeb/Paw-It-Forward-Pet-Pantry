style = document.createElement('style');
style.innerHTML = `main {
        margin-bottom: ${document.querySelector('footer').clientHeight}px;
    }`;
document.head.appendChild(style);