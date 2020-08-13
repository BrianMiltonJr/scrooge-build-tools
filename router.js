module.exports = function(app) {
    app.get('/lines', async function(req, res) {
        let server = req.app.server;
        let lines = server.output();

        if(server.isRunning)
            lines = server.output();
        else
            lines = "Server is not running";

        res.send(JSON.stringify({
            hello: 'world',
            lines: lines
        }));

        res.end();
    });
}