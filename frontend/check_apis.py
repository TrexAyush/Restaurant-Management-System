import urllib.request, json

req = urllib.request.Request('http://localhost:3001/api/auth/login',
    data=json.dumps({'username':'admin_test','password':'password123'}).encode(),
    headers={'Content-Type':'application/json'})
with urllib.request.urlopen(req) as r:
    token = json.loads(r.read())['data']['token']

for ep in ['tables','inventory','menu/items','menu/categories','auth/users','orders','billing/bills']:
    try:
        req = urllib.request.Request('http://localhost:3001/api/'+ep,
            headers={'Authorization':'Bearer '+token})
        with urllib.request.urlopen(req) as r:
            d = json.loads(r.read())
            data = d['data']
            if isinstance(data, dict):
                print(ep+': PAGINATED keys='+str(list(data.keys())))
            elif isinstance(data, list):
                print(ep+': ARRAY len='+str(len(data)))
            else:
                print(ep+': '+type(data).__name__)
    except Exception as e:
        print(ep+': ERROR '+str(e))
