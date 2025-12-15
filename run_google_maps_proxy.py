#!/usr/bin/env python3
"""
Simple script to run the Google Maps proxy server
"""

import uvicorn
from backend.google_maps_proxy import app

if __name__ == "__main__":
    print("Starting Google Maps Proxy Server on http://127.0.0.1:8000")
    print("This server will handle Google Maps API calls and avoid CORS issues.")
    print("Make sure your frontend is configured to use this proxy.")
    print("\nPress Ctrl+C to stop the server.")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    ) 