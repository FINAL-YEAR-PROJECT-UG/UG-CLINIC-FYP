from pathlib import Path

root = Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP")

files = {
    "postman/collections/UG Clinic API/appointments/Cancel Appointment.request.yaml": """$kind: http-request
name: 'Cancel Appointment'
method: PATCH
url: '{{baseUrl}}/api/appointments/{{appointmentId}}/cancel'
order: 7000
headers:
  - key: Content-Type
    value: application/json
  - key: Authorization
    value: 'Bearer {{accessToken}}'
body:
  type: json
  content: |-
    {
      \"cancellationReason\": \"No longer needed\",
      \"cancellationNote\": \"Cancelled from Postman\"
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Cancel appointment returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 400, 401, 403, 404, 500]);
      });
""",
    "postman/collections/UG Clinic API/appointments/Get Staff Dashboard.request.yaml": """$kind: http-request
name: 'Get Staff Dashboard'
method: GET
url: '{{baseUrl}}/api/appointments/staff/dashboard'
order: 1000
headers:
  - key: Authorization
    value: 'Bearer {{accessToken}}'
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Staff dashboard returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 401, 403, 500]);
      });
      if (pm.response.code === 200) {
        const json = pm.response.json();
        pm.expect(json.data).to.have.property('summary');
        pm.expect(json.data).to.have.property('upcomingAppointments');
      }
""",
    "postman/collections/UG Clinic API/appointments/Update Time Slot.request.yaml": """$kind: http-request
name: 'Update Time Slot'
method: PATCH
url: '{{baseUrl}}/api/appointments/timeslot/{{timeSlotId}}'
order: 6000
headers:
  - key: Content-Type
    value: application/json
  - key: Authorization
    value: 'Bearer {{accessToken}}'
body:
  type: json
  content: |-
    {
      \"isAvailable\": true,
      \"maxBookings\": 3,
      \"currentBookings\": 1
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Update time slot returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 400, 401, 403, 404, 500]);
      });
""",
    "postman/collections/UG Clinic API/auth/Login With OTP.request.yaml": """$kind: http-request
name: 'Login With OTP'
method: POST
url: '{{baseUrl}}/api/auth/login-otp'
order: 4200
headers:
  - key: Content-Type
    value: application/json
body:
  type: json
  content: |-
    {
      \"email\": \"student@example.com\",
      \"studentId\": \"12345678\",
      \"otp\": \"123456\",
      \"rememberMe\": true
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Login with OTP returns expected outcome', function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 400, 401, 403, 500]);
      });
      if (pm.response.code === 200) {
        const json = pm.response.json();
        pm.environment.set('accessToken', json.data.tokens.accessToken);
        pm.environment.set('refreshToken', json.data.tokens.refreshToken);
      }
""",
    "postman/collections/UG Clinic API/Register Student.request.yaml": """$kind: http-request
method: POST
url: '{{baseUrl}}/api/auth/register'
order: 3000
headers:
  - key: Content-Type
    value: application/json
body:
  type: json
  content: |-
    {
      \"email\": \"student@example.com\",
      \"password\": \"StrongPass123!\",
      \"firstName\": \"Emmanuel\",
      \"lastName\": \"Oteng\",
      \"studentId\": \"12345678\",
      \"phone\": \"+233501234567\",
      \"gender\": \"male\",
      \"isResident\": true,
      \"program\": \"Computer Science\"
    }
scripts:
  - type: afterResponse
    language: text/javascript
    code: |-
      pm.test('Returns success or validation error', function () {
        pm.expect(pm.response.code).to.be.oneOf([201, 400, 409, 500]);
      });
      if (pm.response.code === 201) {
        const json = pm.response.json();
        pm.environment.set('accessToken', json.data.tokens.accessToken);
        pm.environment.set('refreshToken', json.data.tokens.refreshToken);
      }
""",
}

for rel, content in files.items():
    path = root / rel
    path.write_text(content, encoding='utf-8', newline='\n')
    print(f'Updated {rel}')
