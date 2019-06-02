import * as express from 'express';

((): void => {
    const app = express();
    const port = 8080;

    app.use(express.static('docs'));

    app.listen(port, (): void => {
        console.log(`Documentation being served on ${port}`);
    });
})();
