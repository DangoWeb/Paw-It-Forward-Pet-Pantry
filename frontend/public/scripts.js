document.querySelector('#footerMods').innerHTML = `main {
    margin-bottom: ${document.querySelector('footer').clientHeight}px;
}`;

function load() {
    document.querySelector('title').innerHTML = document.querySelector('page-title').innerHTML;
};

document.addEventListener("DOMContentLoaded", function () {
    load();
    pjax = new Pjax({
        selectors: [".links", "main"],
        switches: {
            ".links": Pjax.switches.outerHTML,
            "main": Pjax.switches.outerHTML
        },
        cacheBust: false,
    });
});

document.addEventListener('pjax:send', (a) => {
    if (a.triggerElement.href.includes('admin')) window.open(a.triggerElement.href, '_blank');
});

document.addEventListener('pjax:complete', load);