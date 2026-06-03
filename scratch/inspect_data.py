import urllib.request
import json

def fetch_data():
    for endpoint in ['distribution', 'returns', 'villages']:
        try:
            url = f'http://localhost:3001/api/{endpoint}'
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                print(f"=== {endpoint} ===")
                print(json.dumps(data, indent=2)[:2000]) # Print first 2000 chars
        except Exception as e:
            print(f"Error fetching {endpoint}: {e}")

if __name__ == '__main__':
    fetch_data()
