//Donelfantastic

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});


async function handleRequest(request) {
  // Modify the referer header to match the allowed localhost IP
  let modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.set("Referer", "https://donelfantastic.github.io");
  modifiedHeaders.set("Origin", "https://donelfantastic.github.io");
  modifiedHeaders.set("Access-Control-Allow-Origin", "*");
  modifiedHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  modifiedHeaders.set("Access-Control-Allow-Headers", "Content-Type");
  modifiedHeaders.set("User-Agent", "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1");

  let baseUrl = new URL(request.url).origin;
  let proxyUrl = new URL(request.url).href.replaceAll(`${baseUrl}/`,"")
  
  // Check if the path is empty
  if (!proxyUrl) {
    let htmlResponse = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>CORS Proxy</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                :root {
                    color-scheme: dark;
                }
        
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: "JetBrains Mono", monospace;
                }
        
                body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1rem;
                }
        
                .status-code {
                    width: 100%;
                    height: 5rem;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    padding: 0.75rem;
                    background-color: #50bb50;
                }
        
                .status-code h2 {
                    font-size: 2.5rem;
                    color: #202020;
                    line-height: 2.5rem;
                }
        
                .text {
                    width: 100%;
                    height: 3rem;
                    display: flex;
                    align-items: center;
                    font-weight: 500;
                    padding: 0 0.125rem;
                    color: #bbbbbb;
                }
            </style>
        </head>
        
        <body>
            <div class="status-code">
                <h2>
                    Status: 200 OK
                </h2>
            </div>
            <div class="text" style="display: none;">
                The CORS Proxy is working perfectly!
            </div>
            <div class="text" style="display: none;">
                Usage: ${baseUrl}/{YourApiUrl}
            </div>
        </body>
        </html>`;

    let defaultResponse = new Response(htmlResponse, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
    return defaultResponse;
  }

  // Proxy the request to the specified URL
  let modifiedRequest = new Request(proxyUrl, {
    method: request.method,
    headers: modifiedHeaders,
    body: request.body,
    redirect: "manual", // Prevent following redirects
  });

  let response = await fetch(modifiedRequest);

  // Support for redirected response
  if ([301, 302].includes(response.status)) {
    const redirectedUrl = response.headers.get('location')
    if (redirectedUrl) {
      const newModifiedRequest = new Request(`${baseUrl}/${redirectedUrl}`, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.body,
        redirect: "manual", // Prevent following redirects
      });
      return handleRequest(newModifiedRequest)
    }
  }

  let newResponseHeaders = new Headers(response.headers);
  newResponseHeaders.set("Access-Control-Allow-Origin", "*");
  newResponseHeaders.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE"
  );
  newResponseHeaders.set("Access-Control-Allow-Headers", "Content-Type");

  let newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newResponseHeaders,
  });
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: newResponseHeaders,
    });
  }
  return newResponse;
}
