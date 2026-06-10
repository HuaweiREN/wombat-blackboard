@echo off
echo ============================================
echo   Wombat-Blackboard 打包脚本
echo ============================================
cd /d "%~dp0"

echo.
echo [1/5] Building frontend...
cd client
call npx vite build
cd ..

echo.
echo [2/5] Generating embedded assets + bundling server...
node build.mjs
if %errorlevel% neq 0 goto :error

echo.
echo [3/5] Creating SEA blob...
node --experimental-sea-config sea-config.json
if %errorlevel% neq 0 goto :error

echo.
echo [4/5] Injecting into exe...
copy /Y "C:\Program Files\nodejs\node.exe" portable\wombat-blackboard.exe
npx postject portable\wombat-blackboard.exe NODE_SEA_BLOB dist\sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
if %errorlevel% neq 0 goto :error

echo.
echo [5/5] Updating frontend dist...
if exist portable\client\dist rmdir /s /q portable\client\dist
xcopy /E /I client\dist portable\client\dist

echo.
echo ============================================
echo   Build complete! portable\wombat-blackboard.exe
echo ============================================
goto :done

:error
echo.
echo BUILD FAILED!
pause

:done
