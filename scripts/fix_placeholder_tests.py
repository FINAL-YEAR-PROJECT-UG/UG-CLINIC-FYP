from pathlib import Path

files = [
    Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP/postman/collections/UG Clinic API/admin/Admin Dashboard Placeholder.request.yaml"),
    Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP/postman/collections/UG Clinic API/notifications/Notification Placeholder.request.yaml"),
]
for p in files:
    t = p.read_text(encoding='utf-8').replace('\r\n', '\n')
    t = t.replace("pm.expect(pm.response.code).to.be.oneOf([200, 401, 403, 501, 500]);", "pm.expect(pm.response.code).to.be.oneOf([200, 501, 500]);")
    p.write_text(t, encoding='utf-8', newline='\n')
    print(f'updated {p.name}')
