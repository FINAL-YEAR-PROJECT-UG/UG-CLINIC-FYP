from pathlib import Path

files = {
    Path('postman/collections/UG Clinic API/Get Availability.request.yaml'): (
        "  - key: date\n    value: '2026-07-01'\n  - key: serviceId\n    value: ''",
        "  - key: date\n    value: '{{appointmentDate}}'\n  - key: serviceId\n    value: '{{serviceId}}'",
    ),
    Path('postman/collections/UG Clinic API/Create Appointment.request.yaml'): (
        '''    {\n      \"serviceId\": \"replace-with-service-id\",\n      \"date\": \"2026-07-01T09:00:00.000Z\",\n      \"timeSlot\": \"09:00\",\n      \"reason\": \"Routine consultation\",\n      \"notes\": \"Created from Postman\"\n    }''',
        '''    {\n      \"serviceId\": \"{{serviceId}}\",\n      \"date\": \"{{appointmentDateTime}}\",\n      \"timeSlot\": \"{{timeSlot}}\",\n      \"reason\": \"{{appointmentReason}}\",\n      \"notes\": \"{{appointmentNotes}}\"\n    }''',
    ),
}

for path, (old, new) in files.items():
    text = path.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'Pattern not found in {path}')
    path.write_text(text.replace(old, new), encoding='utf-8')

print('Updated flow request templates successfully.')
