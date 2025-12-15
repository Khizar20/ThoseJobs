#!/usr/bin/env python3
"""
Test script for backend geocoding functionality
Run this to test if the Google Maps API geocoding works correctly
"""

import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8")

async def test_geocoding():
    """Test the geocoding functionality."""
    
    # Test addresses
    test_addresses = [
        "Rawalpindi, Gulshan Abad",
        "Islamabad, Pakistan",
        "Lahore, Punjab",
        "Karachi, Sindh",
        "Peshawar, KPK",
        "Faisalabad, Punjab",
        "Multan, Punjab",
        "Quetta, Balochistan"
    ]
    
    print("Testing Google Maps API Geocoding...")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        for address in test_addresses:
            print(f"\nTesting: {address}")
            
            try:
                # Test Google Maps API directly
                response = await client.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={
                        "address": f"{address}, Pakistan" if "Pakistan" not in address else address,
                        "key": GOOGLE_MAPS_API_KEY
                    }
                )
                
                data = response.json()
                
                if data.get("results") and len(data["results"]) > 0:
                    location = data["results"][0]["geometry"]["location"]
                    formatted_address = data["results"][0]["formatted_address"]
                    print(f"✅ SUCCESS: {formatted_address}")
                    print(f"   Coordinates: {location['lat']}, {location['lng']}")
                else:
                    print(f"❌ FAILED: No results found")
                    print(f"   Response: {data}")
                    
            except Exception as e:
                print(f"❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Testing complete!")

async def test_backend_endpoint():
    """Test the backend geocoding endpoint."""
    
    print("\nTesting Backend Geocoding Endpoint...")
    print("=" * 50)
    
    test_address = "Rawalpindi, Gulshan Abad"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/geocode/address",
                json={"address": test_address}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print(f"✅ Backend geocoding SUCCESS for: {test_address}")
                    print(f"   Coordinates: {data['latitude']}, {data['longitude']}")
                else:
                    print(f"❌ Backend geocoding FAILED: {data.get('message')}")
            else:
                print(f"❌ Backend endpoint error: {response.status_code}")
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Backend test error: {str(e)}")

if __name__ == "__main__":
    print("Google Maps API Geocoding Test")
    print("Make sure your backend server is running on localhost:8000")
    print("Make sure you have set GOOGLE_MAPS_API_KEY in your .env file")
    print()
    
    # Run tests
    asyncio.run(test_geocoding())
    asyncio.run(test_backend_endpoint()) 