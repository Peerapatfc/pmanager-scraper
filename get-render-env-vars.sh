#!/bin/bash

echo "=========================================="
echo "Render Environment Variables"
echo "=========================================="
echo ""
echo "Copy these values to Render Dashboard → Environment tab"
echo ""

if [ -f .env ]; then
    echo "From .env file:"
    echo "----------------------------------------"
    grep -E "^TEST_USERNAME=" .env
    grep -E "^TEST_PASSWORD=" .env
    grep -E "^GOOGLE_SPREADSHEET_ID=" .env
    echo ""
else
    echo "⚠️  .env file not found!"
    echo ""
fi

if [ -f service-account.json ]; then
    echo "From service-account.json:"
    echo "----------------------------------------"
    echo "GOOGLE_SERVICE_ACCOUNT_EMAIL=$(cat service-account.json | grep -o '"client_email": "[^"]*' | cut -d'"' -f4)"
    echo ""
    echo "GOOGLE_PRIVATE_KEY (copy the entire value below):"
    echo "----------------------------------------"
    cat service-account.json | grep -o '"private_key": "[^"]*' | cut -d'"' -f4
    echo ""
else
    echo "⚠️  service-account.json file not found!"
    echo ""
fi

echo "=========================================="
echo "Next Steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Select your service"
echo "3. Go to Environment tab"
echo "4. Add each variable above"
echo "=========================================="
