@echo off

REM Add environment variables from the .env file.
for /F "tokens=*" %%A in (.env) do set %%A

REM start the server.
set DEBUG=myapp & node .\bin\www