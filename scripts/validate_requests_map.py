from pathlib import Path
import re

root = Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP/postman/collections/UG Clinic API")
for p in sorted(root.rglob('*.request.yaml')):
    text = p.read_text(encoding='utf-8')
    method = re.search(r'^method:\s*(\w+)', text, re.M)
    url = re.search(r"^url:\s*['\"]?(.*?)['\"]?$", text, re.M)
    print(f"{p}|{method.group(1) if method else 'UNKNOWN'}|{url.group(1) if url else 'UNKNOWN'}")
