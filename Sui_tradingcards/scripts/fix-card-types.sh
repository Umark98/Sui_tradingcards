#!/bin/bash

# Fix card types in the database
echo "🔧 Fixing card types in the database..."

# Check if database exists
DB_NAME="tradingdb"
if [ ! -z "$1" ]; then
    DB_NAME="$1"
fi

echo "📊 Using database: $DB_NAME"

# Run the SQL fix
echo "📝 Updating card types..."
psql -d $DB_NAME -f fix-card-types.sql

if [ $? -eq 0 ]; then
    echo "✅ Card types fixed successfully!"
    echo ""
    echo "🎯 Changes made:"
    echo "   - Genesis Commemorative Cards #1-4 → 'Collector's Edition' type"
    echo "   - Mission cards → 'Mission' type"
    echo ""
    echo "📋 Next steps:"
    echo "1. Restart your application"
    echo "2. Check the portal to see the corrected card types"
    echo "3. Verify Genesis and Mission cards are properly categorized"
else
    echo "❌ Failed to fix card types!"
    echo "Please check your database connection and try again."
fi
