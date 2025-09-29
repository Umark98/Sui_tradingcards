# 🚀 Deployment Guide for Inspector Gadget Trading Cards

This guide covers deploying the Inspector Gadget Trading Cards platform to various hosting services.

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Sui CLI installed (for contract operations)

## 🔧 Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Database Configuration
PGSQL_HOST=your_database_host
PGSQL_PORT=5432
PGSQL_DATABASE=tradingdb
PGSQL_USER=your_database_user
PGSQL_PASSWORD=your_database_password

# NextAuth Configuration (if using authentication)
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=https://your-domain.com

# Contract Addresses (automatically updated after publishing contracts)
PACKAGE_ID=
ADMIN_CAP_ID=

# Sui CLI Path (for production deployments)
SUI_CLI_PATH=/usr/local/bin/sui

# Network Configuration
SUI_NETWORK=testnet
```

## 🌐 Vercel Deployment

### 1. Prepare for Vercel

1. **Install Sui CLI on Vercel**:
   - Add a build command to install Sui CLI
   - Set `SUI_CLI_PATH=/usr/local/bin/sui` in environment variables

2. **Database Setup**:
   - Use a cloud PostgreSQL service (Neon, Supabase, etc.)
   - Update database connection variables

3. **Environment Variables**:
   ```bash
   PGSQL_HOST=your-cloud-db-host
   PGSQL_PORT=5432
   PGSQL_DATABASE=tradingdb
   PGSQL_USER=your-db-user
   PGSQL_PASSWORD=your-db-password
   SUI_CLI_PATH=/usr/local/bin/sui
   NEXTAUTH_URL=https://your-vercel-app.vercel.app
   ```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add PGSQL_HOST
vercel env add PGSQL_DATABASE
# ... add all required variables
```

## 🌊 Netlify Deployment

### 1. Prepare for Netlify

1. **Build Command**:
   ```bash
   npm run build
   ```

2. **Publish Directory**:
   ```
   .next
   ```

3. **Environment Variables**:
   ```bash
   PGSQL_HOST=your-cloud-db-host
   PGSQL_PORT=5432
   PGSQL_DATABASE=tradingdb
   PGSQL_USER=your-db-user
   PGSQL_PASSWORD=your-db-password
   SUI_CLI_PATH=/opt/buildhome/.cargo/bin/sui
   NEXTAUTH_URL=https://your-netlify-app.netlify.app
   ```

### 2. Deploy to Netlify

1. Connect your GitHub repository
2. Set build settings and environment variables
3. Deploy

## 🐳 Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

# Install Sui CLI
RUN apk add --no-cache curl
RUN curl -fLJO https://github.com/MystenLabs/sui/releases/latest/download/sui-ubuntu-x86_64.tgz
RUN tar -xzf sui-ubuntu-x86_64.tgz -C /usr/local/bin/

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Deploy with Docker

```bash
# Build image
docker build -t inspector-gadget-cards .

# Run container
docker run -p 3000:3000 \
  -e PGSQL_HOST=your-db-host \
  -e PGSQL_DATABASE=tradingdb \
  -e PGSQL_USER=your-db-user \
  -e PGSQL_PASSWORD=your-db-password \
  inspector-gadget-cards
```

## 🔄 Automated Contract Updates

The system automatically handles contract address updates when publishing new contracts:

1. **Contract Publication**: Updates all JSON files with new package IDs
2. **Metadata Updates**: Preserves existing metadata and updates package IDs
3. **Documentation Updates**: Automatically updates hardcoded IDs in docs
4. **Environment Updates**: Updates `.env.local` with new contract addresses

## 🗄️ Database Setup

### 1. Create Database

```sql
CREATE DATABASE tradingdb;
```

### 2. Run Schema

```bash
# Run the admin schema setup
psql -h your-host -U your-user -d tradingdb -f setup/admin_schema.sql
```

## 🔍 Troubleshooting

### Common Issues

1. **Sui CLI Not Found**:
   - Ensure `SUI_CLI_PATH` is correctly set
   - Install Sui CLI in the deployment environment

2. **Database Connection Issues**:
   - Verify database credentials
   - Check network connectivity
   - Ensure database exists

3. **Contract Publication Fails**:
   - Check Sui CLI installation
   - Verify blockchain contracts directory exists
   - Ensure proper permissions

### Environment-Specific Notes

- **Vercel**: Sui CLI must be installed during build
- **Netlify**: Use Netlify's build environment for Sui CLI
- **Docker**: Include Sui CLI in the Docker image
- **Local**: Use system PATH for Sui CLI

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Sui CLI Documentation](https://docs.sui.io/build/cli)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🆘 Support

If you encounter issues during deployment:

1. Check the deployment logs
2. Verify all environment variables are set
3. Ensure database connectivity
4. Check Sui CLI installation and permissions
