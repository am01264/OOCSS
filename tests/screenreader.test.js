module.exports = {
    "shows on focus": (testDom, cb) => {

        testDom.innerHTML = `<span id="test-container">
            <a id="test-sr" href="#" class="screenreader">Hello</a>
            <a href="#">World</a>
        </span>`;

        setTimeout(() => {
            const firstDimensions = testDom
                .getElementById('test-container')
                .getBoundingClientRect();
            
            const dChanges = testDom.getElementById('test-changes');
            dChanges.focus();

            setTimeout(() => {
                const secondDimensions = dChanges.getBoundingClientRect();

                if (firstDimensions.width < secondDimensions.width) {
                    cb();
                } else {
                    cb(new Error("Link did not show as expected"))
                }
            })
        }, 0)

    },

    "defaults to hidden": (testDom, cb) => {
        testDom.innerHTML = `<span id="test-container">
            <a id="test-sr" href="#" class="screenreader">Hello</a>
            <a id="test-fixed" href="#">World</a>
        </span>`;

        setTimeout(() => {
            const srDimensions = testDom.getElementById('test-sr');
            const fixedDimensions = testDom.getElementById('test-fixed');
            const containDimensions = testDom.getElementById('test-container');

            if (containDimensions.width <= fixedDimensions.width) {
                cb(new Error('Test Case error, container should be larger than always shown element due to inline spacing'));
            }

            if (containDimensions.width >= srDimensions.width + fixedDimensions.width) {
                cb(new Error('Container exceeded size expected. Most likely the link is not hidden.'))
            } else {
                cb();
            }

        })

    }
}