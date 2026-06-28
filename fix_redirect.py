import re
with open('src/app/jiying/launch/page-client.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old = "window.location.href = `/jiying/daily-content?niche=${encodeURIComponent(final)}`"
new = "document.location.replace('/jiying/daily-content')"

c = c.replace(old, new)

# Also ensure localStorage write happens
old2 = "sessionStorage.setItem('jiying_niche_redirect_ts', Date.now().toString())"
new2 = "localStorage.setItem('jiying_niche_redirect', final)"

c = c.replace(old2, new2)

with open('src/app/jiying/launch/page-client.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('DONE')
