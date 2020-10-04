const http = require('http')
const routes = {get: {}, post: {}}
const server = http.createServer(function(req, res) {
    request.invokeMethod(req, res)
})

const methods = {
    unhandled: function(req, res){
        const url = req.url
        const method = req.method.toLowerCase()
        res.end(`cannot ${method} ${url}`)
    },

    setParams: function(path, routeObject){
        const rsplit = path.split('/')

        if(rsplit.length > 1){
            const match = path.match(/(\/:[a-z]+)/g)
            const params = match && match.reduce(function(params, item){
                const param = item.replace('/:', '')
                params.push(param)
                return params
            }, [])

            if(params && params.length) routeObject.params = params

            const matcher = rsplit.reduce(function (rx, value){
                if(/^:/.test(value)){
                    rx += '/(\\w+)'
                }else if(value){
                    rx += '/' + value
                }

                return rx
            }, '') || '/'
            const matcherExp = new RegExp(`^${matcher}$`)
            routeObject.exp = matcherExp
        }
    },

    matchRoute: function(url, method){
        const routesObjects = routes[method]

        for(let route in routesObjects){
            const obj = routesObjects[route]
            if(obj.exp.test(url)){
                if(obj.params){
                    const params = methods.buildParams(url, obj)
                    return {
                        ...obj,
                        params
                    }
                }
                return obj;
            }
        }
    },

    buildParams: function(url, routeObject){
        const match = url.match(routeObject.exp)
        if(match){
            const groups = match.slice(1)
            return routeObject.params.reduce(function(params, param, ind){
                params[param] = groups[ind]
                return params
            }, {})
        }
    },

    setRouteObject: function(routeObject, route){
        this.setParams(route, routeObject)
    }
}

const request = {
    port: function(port){
        server.listen(port, function(error){
            if(!error){
                console.log('Requester is running at http://localhost:' + port)
            }else{
                console.log('Error in creating Request server!', error)
            }
        })
    },

    get: function(route, callback){
        const routeObject = { callback }
        routes.get[route] = routeObject
        methods.setRouteObject(routeObject, route)
    },
    
    post: function(route, callback){
        const routeObject = { callback }
        routes.post[route] = routeObject
        methods.setRouteObject(routeObject, route)
    },

    invokeMethod(req, res){
        const url = req.url
        const method = req.method.toLowerCase()
        const route = methods.matchRoute(url, method)

        if(route){
            if(method !== 'get'){
                let payload = ''
                req.on('data', function(data){
                    payload += data
                })

                req.on('end', function(){
                    payload = payload.toString()
                    route.callback(req, res, {
                        params: route.params,
                        payload
                    })
                })
            }else{
                route.callback(req, res, {
                    params: route.params
                })
            }
        } else methods.unhandled(req, res)
    },
}

module.exports = request