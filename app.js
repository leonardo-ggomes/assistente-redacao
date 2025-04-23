const express = require('express');
const multer = require('multer');
const WordExtractor = require('word-extractor');
const path = require('path');
const IA = require('./IA');
const App = express();

const extractor = new WordExtractor();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); 
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname); 
        const baseName = path.basename(file.originalname, ext);
        const timestamp = Date.now();
        cb(null, `${baseName}-${timestamp}${ext}`); 
    }
});
const upload = multer({ storage }); 

const configServer = () => 
{    
    App.use(express.urlencoded({ extended: true }));
    App.use(express.json());
    App.use(express.static("./views/public"))
    
    App.set('view engine', 'ejs');
    App.set('views', 'views');
}

const routes = () => 
{
    App.get('/', async (req, res) => {
        res.render('index', {chat: ''});
    });
    
    App.post('/', upload.single('doc'), (req, res) => {
        if (!req.file) {
            return res.status(400).send('Nenhum arquivo enviado.');
        }
    
        const filePath = path.join(__dirname, req.file.path);
    
        extractor.extract(filePath)
            .then(async doc => {
                let saida = await IA.executar(doc.getBody())
                let chatComBold = saida.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                res.render('index', { chat: chatComBold});
            })
            .catch(err => {
                console.error('Erro ao extrair o documento:', err);
                res.render('index', { chat: 'Erro ao extrair o documento! :('});
            });
    });
}

App.listen(80, () => {console.log('Servidor rodando em http://localhost')});
configServer()
routes()



