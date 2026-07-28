from pathlib import Path
p = Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP/postman/collections/UG Clinic API/.resources/definition.fixed.yaml")
if p.exists():
    p.unlink()
    print(f"deleted {p}")
else:
    print("not found")
