module.exports = {
    
    "host has no margin or padding": (testDom, cb) => {

        const HOST = 'test-host';
        testDom.innerHTML = `<ul class="menu">
            <li class="menu-item">one</li>
        </ul>`;

        setTimeout(() => {

            const elHost = document.getElementById(HOST);
            const firstChild = elHost.firstElementChild;

            const boxHost = elHost.getBoundingClientRect();
            const boxFirstChild = firstChild.getBoundingClientRect();

            if (boxHost.left !== boxFirstChild.left) {
                return cb(new Error("Unexpected left margin/padding"))
            }

            if (boxHost.top !== boxFirstChild.top) {
                return cb(new Error("Unexpected top margin/padding"))
            }

            cb();

        }, 0);

    },

    "defaults to inline-block": (testDom, cb) => {
        
        const HOST = 'test-host';

        testDom.innerHTML = `<div class="container">
            <ul id="${HOST}" class="menu">
                <li class="menu-item">one</li>
                <li class="menu-item">two</li>
            </ul>
        </div>`;

        setTimeout(() => {

            const elHost = document.getElementById(HOST);
            const firstChild = elHost.firstElementChild;
            const nextChild = firstChild.nextElementSibling;

            const boxHost = elHost.getBoundingClientRect();
            const boxFirstChild = firstChild.getBoundingClientRect();
            const boxNextChild = nextChild.getBoundingClientRect();

            if (firstChild.style.display !== "inline-block") {
                return cb(new Error(".menu-item element was not set as `display: inline-block`"))
            }

            // Test for side effects

            if (boxFirstChild.right >= boxNextChild.left) {
                return cb(new Error("Expected spacing between elements"))
            }

            cb();

        }, 0);

    },

    "correctly floats menu": (testDom, cb) => {

        const HOST = 'test-host';

        testDom.innerHTML = `<ul id="${HOST}" class="menu-float">
            <li class="menu-item">one</li>
            <li class="menu-item">two</li>
        </ul>`;

        setTimeout(() => {

            const elHost = document.getElementById(HOST);
            const firstChild = elHost.firstElementChild;
            const nextChild = firstChild.nextElementSibling;

            const boxHost = elHost.getBoundingClientRect();
            const boxFirstChild = firstChild.getBoundingClientRect();
            const boxNextChild = nextChild.getBoundingClientRect();

            if (firstChild.style.cssFloat !== "left") {
                return cb(new Error(".menu-item was not set as `float: left`"));
            }

            // Host auto-sizes to contains elements
            if (! (boxHost.top === boxFirstChild.top 
                && boxHost.bottom === boxNextChild.bottom)) 
            {
                return cb(new Error("Expected `.menu` to contain all elements without overflow."))    
            }

            // items align without spacing
            if (boxFirstChild.right !== boxNextChild.left) {
                return cb(new Error("Expected `.menu-items` to have no spacing between them."))
            }

            cb();

        }, 0);

    },

    "correctly displays vertical menu": (testDom, cb) => {

        const HOST = 'test-host';

        testDom.innerHTML = `<ul id="${HOST}" class="menu-vertical">
            <li class="menu-item">one</li>
            <li class="menu-item">two</li>
        </ul>`;

        setTimeout(() => {
            
            const elHost = document.getElementById(HOST);
            const firstChild = elHost.firstElementChild;
            const nextChild = firstChild.nextElementSibling;

            const boxHost = elHost.getBoundingClientRect();
            const boxFirstChild = firstChild.getBoundingClientRect();
            const boxNextChild = nextChild.getBoundingClientRect();

            if (boxFirstChild.bottom !== boxNextChild.top) {
                return cb(new Error("`.menu-item` should stack on top of another without spacing"))
            }

            if (boxHost.left !== boxNextChild.left) {
                return cb(new Error("`.menu-item` should all be left-aligned against the container without spacing"))
            };

            cb();

        }, 0);

    }
}