from pathlib import Path

root = Path(r"C:/Users/Oteng/Desktop/Github/UG-CLINIC-FYP")
def_path = root / "postman/collections/UG Clinic API/.resources/definition.yaml"
fixed_path = root / "postman/collections/UG Clinic API/.resources/definition.fixed.yaml"

def main():
    fixed = fixed_path.read_text(encoding="utf-8")
    def_path.write_text(fixed, encoding="utf-8", newline="\n")
    print(f"Repaired {def_path}")

if __name__ == "__main__":
    main()
