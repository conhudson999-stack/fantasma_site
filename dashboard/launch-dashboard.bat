@echo off
title Fantasma Dashboard
cd /d "%~dp0.."
start "" http://localhost:3000
node dashboard/dashboard.cjs
