#!/bin/bash

# Admin Panel Database Setup Script

echo "🔧 Setting up Admin Panel Database..."

# Check if database exists
DB_NAME="postgres"
if [ ! -z "$1" ]; then
    DB_NAME="$1"
fi

echo "📊 Using database: $DB_NAME"

# Run the schema setup
echo "📝 Creating admin panel tables..."
psql -d $DB_NAME -f admin_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Navigate to http://localhost:3003/admin"
    echo "2. Go to 'Card Configuration' tab"
    echo "3. Configure your first Inspector Gadget card"
    echo "4. Use 'Mint Cards' tab to mint cards to users"
    echo ""
    echo "📋 Available card types include:"
    echo "   - Brella, Mallet, Laser, Copter, Skates"
    echo "   - Arms, Legs, Hands, Ears, Eyes"
    echo "   - And 150+ more Inspector Gadget items!"
else
    echo "❌ Database setup failed!"
    echo "Please check your database connection and try again."
fi

