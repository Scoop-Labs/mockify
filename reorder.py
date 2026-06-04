import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# We need to swap Tech Stack with Placement Mobile Grid
# Or more simply, cut the Mobile Grid and insert it before Tech Stack

tech_stack_start = '        <div className="pt-12 md:pt-16 space-y-6 md:space-y-8">'
tech_stack_end = '        </div>\n    </div>'

mobile_start = '    {/* Placement Photos Grid (Mobile View) - Moved to bottom */}'
mobile_end = '    {/* Wavy Bottom Background */}'

t_start_idx = content.find(tech_stack_start)
m_start_idx = content.find(mobile_start)
m_end_idx = content.find(mobile_end)

if t_start_idx != -1 and m_start_idx != -1 and m_end_idx != -1:
    mobile_grid = content[m_start_idx:m_end_idx]
    
    # Remove mobile grid from its current location
    new_content = content[:m_start_idx] + content[m_end_idx:]
    
    # Re-find tech stack start because indices shifted (wait, mobile is AFTER tech stack, so t_start_idx doesn't change)
    # Insert mobile grid BEFORE tech stack
    
    final_content = new_content[:t_start_idx] + mobile_grid + new_content[t_start_idx:]
    
    with open('src/App.tsx', 'w') as f:
        f.write(final_content)
    print("SUCCESS")
else:
    print("FAILED")
    print(t_start_idx, m_start_idx, m_end_idx)
