from pathlib import Path

root = Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP")

replacements = {
    "postman/collections/UG Clinic API/appointments/Get Staff Dashboard.request.yaml": [
        ("/api/appointments/staff'", "/api/appointments/staff/dashboard'"),
    ],
    "postman/collections/UG Clinic API/staff/Get Active Sessions.request.yaml": [
        ("\n  - key: X-Session-Token\n    value: '{{sessionToken}}'", ""),
        ("/api/staff/sessions", "/api/staff/students"),
        ("Get active sessions returns expected outcome", "List students returns expected outcome"),
        ("json.data).to.have.property('sessions')", "json.data).to.have.property('students')"),
        ("json.data.sessions", "json.data.students"),
    ],
    "postman/collections/UG Clinic API/staff/Revoke All Sessions.request.yaml": [
        ("\n  - key: X-Session-Token\n    value: '{{sessionToken}}'", ""),
    ],
    "postman/collections/UG Clinic API/staff/Revoke Session.request.yaml": [
        ("\n  - key: X-Session-Token\n    value: '{{sessionToken}}'", ""),
    ],
    "postman/collections/UG Clinic API/staff/Toggle 2FA.request.yaml": [
        ("\n  - key: X-Session-Token\n    value: '{{sessionToken}}'", ""),
    ],
    "postman/collections/UG Clinic API/staff/Update Session Activity.request.yaml": [
        ("\n  - key: X-Session-Token\n    value: '{{sessionToken}}'", ""),
    ],
    "postman/collections/UG Clinic API/staff/Get Student.request.yaml": [
        ("\n  - key: X-Session-Token\n    value: '{{sessionToken}}'", ""),
    ],
    "postman/collections/UG Clinic API/staff/List Students.request.yaml": [
        ("\n  - key: X-Session-Token\n    value: '{{sessionToken}}'", ""),
    ],
    "postman/collections/UG Clinic API/staff/Update Student.request.yaml": [
        ("\n  - key: X-Session-Token\n    value: '{{sessionToken}}'", ""),
    ],
}

for rel, pairs in replacements.items():
    path = root / rel
    text = path.read_text(encoding='utf-8').replace('\r\n', '\n')
    original = text
    for old, new in pairs:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding='utf-8', newline='\n')
        print(f'Updated {rel}')
    else:
        print(f'No change {rel}')
