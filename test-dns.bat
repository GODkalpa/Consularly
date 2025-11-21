@echo off
echo Testing DNS Configuration for consularly.com
echo ============================================
echo.

echo Testing root domain:
nslookup consularly.com
echo.

echo Testing www subdomain:
nslookup www.consularly.com
echo.

echo Testing wildcard subdomain (testorg):
nslookup testorg.consularly.com
echo.

echo Testing wildcard subdomain (demo):
nslookup demo.consularly.com
echo.

echo Testing wildcard subdomain (anything):
nslookup anything.consularly.com
echo.

echo ============================================
echo If you see "Non-existent domain" or no IP address,
echo DNS hasn't propagated yet. Wait and try again.
echo.
echo If you see Vercel IPs (76.76.21.21 or similar),
echo DNS is working!
echo ============================================
pause
