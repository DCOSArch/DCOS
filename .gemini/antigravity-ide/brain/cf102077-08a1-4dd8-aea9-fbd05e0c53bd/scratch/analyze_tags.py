path = r"c:\Users\bentn\OneDrive\Desktop\DEs\src\components\dashboards\DentistDashboard.tsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Let's find the line numbers for each step:
# Step 0: from line 1020 to 1165
# Step 1: from line 1165 to 1285
# Step 2: from line 1285 to 1580
# Step 3: from line 1580 to 1805
# Step 4: from line 1805 to 1835

def analyze_range(start, end, label):
    content = "".join(lines[start-1:end])
    # Let's count open/close divs
    open_divs = content.count("<div")
    close_divs = content.count("</div")
    open_brackets = content.count("{")
    close_brackets = content.count("}")
    open_parens = content.count("(")
    close_parens = content.count(")")
    print(f"[{label}] Lines {start}-{end}:")
    print(f"  <div>: open={open_divs}, close={close_divs}, net={open_divs - close_divs}")
    print(f"  {{}}: open={open_brackets}, close={close_brackets}, net={open_brackets - close_brackets}")
    print(f"  (): open={open_parens}, close={close_parens}, net={open_parens - close_parens}")

# Let's scan the file for Step comments to identify boundaries
for idx, line in enumerate(lines):
    if "/* Step" in line or "Step 0:" in line or "Step 1:" in line or "Step 2:" in line or "Step 3:" in line or "Step 4:" in line:
        print(f"Line {idx+1}: {line.strip()}")

analyze_range(960, 1030, "Header & Sidebar")
analyze_range(1020, 1166, "Step 0 (Admin)")
analyze_range(1160, 1286, "Step 1 (Scan)")
analyze_range(1280, 1582, "Step 2 (Model)")
analyze_range(1575, 1808, "Step 3 (CAD)")
analyze_range(1800, 1836, "Step 4 (CAM)")
analyze_range(1830, 1885, "Footer & Dialog Content Close")
