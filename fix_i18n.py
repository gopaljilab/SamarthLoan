
with open('artifacts/schemesathi/src/i18n.tsx', 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()
for i in range(len(lines)):
    idx1 = lines[i].find('findApplication:')
    if idx1 != -1:
        idx2 = lines[i].find('findApplication:', idx1 + 1)
        if idx2 != -1:
            end_idx = lines[i].find(',', idx2)
            lines[i] = lines[i][:idx2] + lines[i][end_idx+1:]
with open('artifacts/schemesathi/src/i18n.tsx', 'w', encoding='utf-8-sig') as f:
    f.writelines(lines)
