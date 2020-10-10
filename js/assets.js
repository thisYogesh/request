const path = require('path')
const mime = require('./mime')
const URL = require('url')
const fs = require('fs')

module.exports = {
    init(root){
        this.appRoot = root
    },
    serve(req, res){
        const rx = /.\w+$/
        const url = URL.parse(req.url)
        const pathname = url.pathname
        const method = req.method.toLowerCase()
        
        if(rx.test(pathname)){
            const assetPath = path.join(this.appRoot + pathname)
            const ext = pathname.match(rx)[0]
            const contentType = mime[ext] || mime.default
            
            try{
                const data = fs.readFileSync(assetPath)
                res.writeHead(200, {
                    'Content-Type': contentType
                })
                res.end(data)
            }catch(e){
                res.writeHead(404, {
                    'Content-Type': mime.default
                })
                res.end(`cannot ${method} ${pathname}`)
            }
        }else{
            res.writeHead(404, {
                'Content-Type': mime.default
            })
            res.end(`cannot ${method} ${pathname}`)
        }

    }
}