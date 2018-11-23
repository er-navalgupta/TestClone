let {
    request,
    expect,
    browserAccept,
    url,
    httpClient,
    forbiddenText,
    methodNotAllowedMsg,
    badRequestMsg,
    removeSpaceAndNewLine
} = require('./common');

describe("/file test", () => {
    
    it('/contents', (done) => {
        request.get('/contents/index.html').accept(browserAccept).end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res).to.have.header('content-type', 'text/html');
            done();
        });
    });

    it('invalid file', (done) => {
        request.get('/fc.txt').end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(404);
            expect(res).to.have.header('content-type', 'text/html');
            done();
        });
    });

});