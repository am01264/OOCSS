module.exports = {
    "shrinks to container width": (testDom, cb) => {

        const TEST_ID = 'test-embed';

        testDom.innerHTML = `<div style="width:100px; margin: 0; padding: 0">
            <img id="${TEST_ID}" class="embed" src="about:blank" width="200px" height="200px" />
        </div>`;

        setTimeout(() => {

            const dimensions = testDom.getElementById(TEST_ID)
                .getBoundingClientRect();

            if (dimensions.width === 100 
                && dimensions.height === 100) 
            {
                cb();
            } else {
                cb(new Error("Expected reduced dimensions, got something different."))
            }

        }, 0);
    }
}