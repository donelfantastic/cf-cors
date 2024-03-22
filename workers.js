/**
 * CORScloudflare
 * 2024 22 March
 * donelfantastic©2024
 */

addEventListener('fetch', event => {
    event.passThroughOnException()

    event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
    const { request } = event;

    let reqHeaders = new Headers(request.headers),
        outBody, outStatus = 200, outStatusText = 'OK', outCt = null, outHeaders = new Headers({
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": reqHeaders.get('Access-Control-Allow-Headers') || "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With, Token, x-access-token"
        });

    try {
       
        let url = request.url.substr(8);
        url = decodeURIComponent(url.substr(url.indexOf('/') + 1));

        
        if (request.method == "OPTIONS" || url.length < 3 || url.indexOf('.') == -1 || url == "favicon.ico" || url == "robots.txt") {
            
            outBody = JSON.stringify({
                code: 0,
                usage: 'Host/{URL}',
                source: 'https://github.com/donelfantastic/cf-cors'
            });
            outCt = "application/json";
        }
        
        else if (blocker.check(url)) {
            outBody = JSON.stringify({
                code: 415,
                msg: 'The keyword "' + blocker.keys.join(' , ') + '" was blacklisted by the operator of this proxy.'
            });
            outCt = "application/json";
        }
        else {
            
            if (url.indexOf("://") == -1) {
                url = "http://" + url;
            }

            // build fetch parameter
            let fp = {
                method: request.method,
                headers: {}
            }

            
            let he = reqHeaders.entries();
            for (let h of he) {
                if (!['content-length', 'content-type'].includes(h[0])) {
                    fp.headers[h[0]] = h[1];
                }
            }

            if (["POST", "PUT", "PATCH", "DELETE"].indexOf(request.method) >= 0) {
                const ct = (reqHeaders.get('content-type') || "").toLowerCase();
                if (ct.includes('application/json')) {
                    fp.body = JSON.stringify(await request.json());
                } else if (ct.includes('application/text') || ct.includes('text/html')) {
                    fp.body = await request.text();
                } else if (ct.includes('form')) {
                    fp.body = await request.formData();
                } else {
                    fp.body = await request.blob();
                }
            }

            let fr = (await fetch(url, fp));
            outCt = fr.headers.get('content-type');
            outStatus = fr.status;
            outStatusText = fr.statusText;
            outBody = fr.body;
        }
    } catch (err) {
        outCt = "application/json";
        outBody = JSON.stringify({
            code: -1,
            msg: JSON.stringify(err.stack) || err
        });
    }

    if (outCt && outCt != "") {
        outHeaders.set("content-type", outCt);
    }

    let response = new Response(outBody, {
        status: outStatus,
        statusText: outStatusText,
        headers: outHeaders
    })

    mrdnkl.add(event, request, response);

    return response;

    // return new Response('OK', { status: 200 })
}

const blocker = {
    keys: [".*"], //file type or site(eg:".txt","domain.com")
    check: function (url) {
        url = url.toLowerCase();
        let len = blocker.keys.filter(x => url.includes(x)).length;
        return len != 0;
    }
}

const mrdnkl = {

    api: "https://logsene-receiver.donelfantastic.pages.dev/00000000-0000-0000-0000-000000000000/example/",

    headersToObj: headers => {
        const obj = {}
        Array.from(headers).forEach(([key, value]) => {
            obj[key.replace(/-/g, "_")] = value
        })
        return obj
    },

   
    buildBody: (request, response) => {

        const hua = request.headers.get("user-agent")
        const hip = request.headers.get("cf-connecting-ip")
        const hrf = request.headers.get("referer")
        const url = new URL(request.url)

        const body = {
            method: request.method,
            statusCode: response.status,
            clientIp: hip,
            referer: hrf,
            userAgent: hua,
            host: url.host,
            path: url.pathname,
            proxyHost: null,
            proxyHeader: mrdnkl.headersToObj(request.headers),
            cf: request.cf
        }

        if (body.path.includes(".") && body.path != "/" && !body.path.includes("favicon.ico")) {
            try {
                let purl = decodeURIComponent(body.path.substr(1));
                if (purl.indexOf("://") == -1) {
                    purl = "http://" + purl;
                }
                body.path = purl;
                body.proxyHost = new URL(purl).host;
            } catch { }
        }

        return {
            method: "POST",
            body: JSON.stringify(body)
        }
    },

    
    add: (event, request, response) => {
        const body = mrdnkl.buildBody(request, response);
        event.waitUntil(fetch(mrdnkl.api, body))
    }
};
