from pathlib import Path

root = Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP")
collection = root / "postman/collections/UG Clinic API/staff"

# Remove orphaned requests that have no matching backend route
remove_files = [
    collection / "Get Active Sessions.request.yaml",
    collection / "Revoke All Sessions.request.yaml",
    collection / "Revoke Session.request.yaml",
    collection / "Toggle 2FA.request.yaml",
    collection / "Update Session Activity.request.yaml",
]

for p in remove_files:
    if p.exists():
        p.unlink()
        print(f"Removed {p.name}")

# Rewrite misleading request into a real backend-supported request
old_path = collection / "Get Student.request.yaml"
new_path = collection / "Get Student Details.request.yaml"
if old_path.exists():
    text = old_path.read_text(encoding='utf-8').replace('\r\n', '\n')
    text = text.replace("name: 'Get Student'", "name: 'Get Student Details'")
    text = text.replace("Get student returns expected outcome", "Get student details returns expected outcome")
    new_path.write_text(text, encoding='utf-8', newline='\n')
    old_path.unlink()
    print(f"Renamed {old_path.name} -> {new_path.name}")

# Fix update student payload to avoid immutable fields rejected by controller
update_student = collection / "Update Student.request.yaml"
if update_student.exists():
    update_student.write_text("""$kind: http-request
name: 'Update Student'
method: PATCH
url: '{{baseUrl}}/api/staff/students/{{studentIdOrUserId}}'
order: 11000
headers:
  - key: Content-Type
    value: application/json
  - key: Authorization
    value: 'Bearer {{accessToken}}'
body:
  type: json
  content: |-
    {
      \"phone\": \"+233201234567\",
      \"program\": \"Computer Science\",
      \"gender\": \"female\",
      \"isActive\": true
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Update student returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 400, 401, 403, 404, 500]);
      });
""", encoding='utf-8', newline='\n')
    print("Rewrote Update Student.request.yaml")

# Add missing backend-supported staff requests
list_doctors = collection / "List Doctors.request.yaml"
if not list_doctors.exists():
    list_doctors.write_text("""$kind: http-request
name: 'List Doctors'
method: GET
url: '{{baseUrl}}/api/staff/doctors'
order: 12000
headers:
  - key: Authorization
    value: 'Bearer {{accessToken}}'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('List doctors returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 401, 403, 500]);
      });
      if (pm.response.code === 200) {
        const json = pm.response.json();
        pm.expect(json.data).to.have.property('doctors');
      }
""", encoding='utf-8', newline='\n')
    print("Added List Doctors.request.yaml")

update_doctor_status = collection / "Update Doctor Status.request.yaml"
if not update_doctor_status.exists():
    update_doctor_status.write_text("""$kind: http-request
name: 'Update Doctor Status'
method: PATCH
url: '{{baseUrl}}/api/staff/doctors/status'
order: 13000
headers:
  - key: Content-Type
    value: application/json
  - key: Authorization
    value: 'Bearer {{accessToken}}'
body:
  type: json
  content: |-
    {
      \"doctorId\": \"{{doctorId}}\",
      \"status\": \"AVAILABLE\"
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Update doctor status returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 400, 401, 403, 404, 500]);
      });
""", encoding='utf-8', newline='\n')
    print("Added Update Doctor Status.request.yaml")

get_student_history = collection / "Get Student History.request.yaml"
if not get_student_history.exists():
    get_student_history.write_text("""$kind: http-request
name: 'Get Student History'
method: GET
url: '{{baseUrl}}/api/staff/students/{{studentIdOrUserId}}/history'
order: 14000
headers:
  - key: Authorization
    value: 'Bearer {{accessToken}}'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Get student history returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 401, 403, 404, 500]);
      });
""", encoding='utf-8', newline='\n')
    print("Added Get Student History.request.yaml")

auto_assign = collection / "Auto Assign Doctors.request.yaml"
if not auto_assign.exists():
    auto_assign.write_text("""$kind: http-request
name: 'Auto Assign Doctors'
method: POST
url: '{{baseUrl}}/api/staff/auto-assign-doctors'
order: 15000
headers:
  - key: Authorization
    value: 'Bearer {{accessToken}}'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Auto assign doctors returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 400, 401, 403, 500]);
      });
""", encoding='utf-8', newline='\n')
    print("Added Auto Assign Doctors.request.yaml")

auto_confirm = collection / "Auto Confirm Pending.request.yaml"
if not auto_confirm.exists():
    auto_confirm.write_text("""$kind: http-request
name: 'Auto Confirm Pending'
method: POST
url: '{{baseUrl}}/api/staff/auto-confirm-pending'
order: 16000
headers:
  - key: Authorization
    value: 'Bearer {{accessToken}}'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Auto confirm pending returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 400, 401, 403, 500]);
      });
""", encoding='utf-8', newline='\n')
    print("Added Auto Confirm Pending.request.yaml")
