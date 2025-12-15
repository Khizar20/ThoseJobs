// CloudFront Function for SPA Routing
// This function ensures that:
// 1. Asset files (JS, CSS, images) are served correctly
// 2. Page routes are redirected to index.html for React Router

function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check if the request has a file extension (is an asset)
    // This includes: .js, .css, .png, .jpg, .svg, .woff, .mp3, etc.
    if (uri.match(/\.[a-zA-Z0-9]+$/)) {
        // It's a file request, return as-is
        return request;
    }
    
    // Check if it's a directory (ends with /)
    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
        return request;
    }
    
    // It's a route (no extension), serve index.html for React Router
    request.uri = '/index.html';
    return request;
}

