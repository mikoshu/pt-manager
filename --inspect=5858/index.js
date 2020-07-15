const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fileUpload = require('express-fileupload')

const app = express();
const port = 8088
const base = 'http://localhost:' + port + '/temp/'


app.use(express.static('src/'))
app.use(fileUpload())

app.use('/rate-api', createProxyMiddleware({
  target: 'https://api.exchangerate-api.com',
  changeOrigin: true,
  pathRewrite: {
    '^/rate-api': ''
  }
}));


app.use('/temp', express.static('temp/', { // 图片资源托管 允许跨域
  setHeaders: function (res, path, stat) {
    res.header('Access-Control-Allow-Origin', '*'); //当允许携带cookies此处的白名单不能写’*’
    res.header('Access-Control-Allow-Headers', 'content-type,Content-Length, Authorization,Origin,Accept,X-Requested-With'); //允许的请求头
    res.header('Access-Control-Allow-Methods', 'GET'); //允许的请求方法
    //res.header('Access-Control-Allow-Credentials', true);  //允许携带cookies
  }
}))

app.post('/upload', function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.file;
  // Use the mv() method to place the file somewhere on your server
  let name = new Date().getTime() + '.' + sampleFile.name.split('.')[1]
  sampleFile.mv('./temp/' + name, function (err) {
    if (err) {
      console.log(err)
      return res.status(500).send(err);
    }
    res.status(200).send({
      code: 1,
      data: base + name
    });
  });
});


app.listen(port, function (err) {
  console.log('rate-api listening on :'+ port)
});
