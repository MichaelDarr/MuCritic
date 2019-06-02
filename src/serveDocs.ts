import * as express from 'express';

const app = express();
const port = 8080;

app.use(express.static('docs'));

app.listen(port, () => console.log(`Documentation being served on ${port}`));
