from pathlib import Path
import re

root = Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP")
postman_root = root / "postman/collections/UG Clinic API"
backend_routes = root / "backend/src/routes"

route_patterns = []
for route_file in backend_routes.glob("*.ts"):
    text = route_file.read_text(encoding="utf-8")
    for m in re.finditer(r"router\.(get|post|patch|put|delete)\(\s*['\"]([^'\"]+)['\"]", text):
        method = m.group(1).upper()
        path = m.group(2)
        base = route_file.stem.replace('.routes','')
        if base == 'appointment':
            prefix = '/api/appointments'
        elif base == 'auth':
            prefix = '/api/auth'
        elif base == 'service':
            prefix = '/api/services'
        elif base == 'resource':
            prefix = '/api/resources'
        elif base == 'staff':
            prefix = '/api/staff'
        elif base == 'admin':
            prefix = '/api/admin'
        elif base == 'notification':
            prefix = '/api/notifications'
        elif base == 'news':
            prefix = '/api/news'
        else:
            prefix = '/api/' + base
        full = prefix if path == '/' else prefix + path
        route_patterns.append((method, full, route_file.name))

for method, full, src in sorted(route_patterns):
    print(f"ROUTE {method} {full} [{src}]")

print("\nREQUEST FILES\n")
for p in sorted(postman_root.rglob('*.request.yaml')):
    text = p.read_text(encoding='utf-8')
    mm = re.search(r'^method:\s*(\w+)', text, re.M)
    mu = re.search(r"^url:\s*['\"]?\{\{baseUrl\}\}([^'\"\n]+)['\"]?", text, re.M)
    method = mm.group(1).upper() if mm else 'UNKNOWN'
    url = mu.group(1) if mu else 'UNKNOWN'
    print(f"REQUEST {method} {url} [{p.relative_to(postman_root)}]")
