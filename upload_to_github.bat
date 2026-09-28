@echo off
title Supreme Casino - 1-Click GitHub Uploader
color 0b
echo ========================================================
echo         SUPREME CASINO - 1-CLICK GITHUB UPLOADER
echo ========================================================
echo.
echo Target repository: https://github.com/crowicgts/SupremeCsn
echo.
set /p REPO_URL="Enter your GitHub Repository URL (or press ENTER to use default): "

if "%REPO_URL%"=="" (
    set REPO_URL=https://github.com/crowicgts/SupremeCsn.git
)

echo.
echo [1/3] Setting up Git branches...
git branch -M main

echo [2/3] Connecting to your repository: %REPO_URL%
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo [3/3] Uploading all files to GitHub...
echo (A browser window will pop up - please click "Sign in with your browser" to authorize your crowicgts account)
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [ERROR] Upload failed. Please make sure the URL is correct
    echo and that you are signed in to GitHub as crowicgts.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo [SUCCESS] ALL FILES UPLOADED TO GITHUB SUCCESSFULLY!
    echo.
    echo Now go to dashboard.render.com, click "New +", choose
    echo "Web Service", connect crowicgts/SupremeCsn, and click Deploy!
    echo ========================================================
)

echo.
pause
