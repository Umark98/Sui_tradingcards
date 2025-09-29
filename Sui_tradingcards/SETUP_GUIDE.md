# Admin Panel Setup Guide

## 🚀 Quick Setup

### 1. Database Configuration
The admin panel requires a PostgreSQL database. You need to set up your database connection:

```bash
# Copy the environment template
cp env.example .env.local

# Edit .env.local with your database credentials
nano .env.local
```

Update these values in `.env.local`:
```env
PGSQL_HOST=localhost
PGSQL_PORT=5432
PGSQL_DATABASE=postgres
PGSQL_USER=your_username
PGSQL_PASSWORD=your_password
```

### 2. Create Database Tables
```bash
# Run the setup script
./setup/setup_admin_db.sh

# Or manually run the SQL
psql -d your_database -f setup/admin_schema.sql
```

### 3. Start the Application
```bash
npm run dev
```

### 4. Access Admin Panel
Navigate to: http://localhost:3003/admin

## 🎯 First Steps

### 1. Configure Your First Card
1. Go to "Card Configuration" tab
2. Select "Brella" (pre-configured sample)
3. Review the existing configuration
4. Add more card types as needed

### 2. Test Minting
1. Go to "Mint Cards" tab
2. Connect your admin wallet
3. Select a card configuration
4. Choose level and recipient
5. Preview and mint

### 3. Monitor Activity
1. Check "Statistics" tab
2. View minting analytics
3. Monitor recent activity

## 🔧 Troubleshooting

### Database Connection Issues
- Verify your `.env.local` file has correct database credentials
- Ensure PostgreSQL is running
- Check if the database exists

### Admin Panel Not Loading
- Check browser console for errors
- Verify all API endpoints are responding
- Ensure database tables are created

### Minting Issues
- Verify wallet connection
- Check if you have admin capabilities
- Ensure sufficient gas for transactions

## 📊 Sample Data

The setup includes a sample "Brella" card configuration with 5 levels:
- Level 1: Common, Basic
- Level 2: Uncommon, Enhanced  
- Level 3: Rare, Advanced
- Level 4: Epic, Superior
- Level 5: Legendary, Legendary

## 🎨 Customization

### Adding New Card Types
1. Edit `CardConfigForm.tsx` to add new card types to `INSPECTOR_GADGET_CARDS`
2. Configure metadata in admin panel
3. Test minting

### Contract Integration
Update contract addresses in API routes if deploying to different networks:
- Package ID
- Admin Cap Object ID
- Counter Object ID

## 🚀 Production Deployment

1. Set up production database
2. Configure environment variables
3. Update contract addresses for mainnet
4. Implement proper authentication
5. Set up monitoring and logging

Your Inspector Gadget admin panel is ready to manage your trading card ecosystem! 🕵️✨

