module.exports = {

    "adapts to 16:9 ratio by default": (testDom, cb) => {

        testDom.innerHTML = `<div id="test-default" class="aspect">
            <div class="adaptable">
                <img src="about:blank" width="100" height="100" />
            </div>
        </div>`;
        
        setTimeout(() => {

            const dimensions = testDom
                .getElementById('test-default')
                .getBoundingClientRect()

            const match = Math.floor(dimensions.width / 16) === Math.floor(dimensions.height / 9);

            if (!match) {
                cb(new Error("Dimensions did not match 16:9 ratio expected"))
            } else {
                cb();
            }
        }, 0);

    },

    "adapts to 4:3 ratio when chosen": (testDom, cb) => {

        const TEST_ID = 'test-4-3'

        testDom.innerHTML = `<div id="${TEST_ID}" class="aspect">
            <div class="adaptable">
                <img src="about:blank" width="100" height="100" />
            </div>
        </div>`;

        setTimeout(() => {

            const dimensions = testDom
                .getElementById(TEST_ID)
                .getBoundingClientRect();

            const match = Math.floor(dimensions.width / 4) === Math.floor(dimensions.height / 3);

            if (! match) {
                cb(new Error("Dimensions did not match 4:3 ratio expected"))
            } else {
                cb();
            }
        })

    }

};