var $ = require('../index');
describe('jqlite', () => {

    beforeEach(() => {
        document.body.innerHTML = `
        <div id="scrollview" style="width: 200px; height: 200px; overflow: auto; background: #ccc;">
            <div style="padding: 400px; ">
                <p id="el" style="width:50px; height: 50px; margin:0; padding: 0; background:#000; color: #FFF;">
                    test
                </p>
            <div>
        </div>
        `
    })

    it("scrollIntoView", () => {
        var $html = $('#scrollview');
        console.log($html.html('<div>123</div>'));
    })


})
