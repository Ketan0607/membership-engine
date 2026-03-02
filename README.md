# Membership Engine 🚀

A modern, high-performance **Subscription-Based Membership Engine** built with Node.js, Express, and MySQL. It features tiered access logic, automated expiration, and a premium Glassmorphism-inspired UI.

![Project Preview](https://via.placeholder.com/800x450/0f172a/f8fafc?text=Membership+Engine+Dashboard)

## 🌟 Key Features
- **Tiered Content Access**: Dynamic locking of materials based on user subscription levels (Basic, Pro, Premium).
- **Premium UI/UX**: Stunning dark-mode interface with Glassmorphism, smooth animations, and responsive design.
- **Subscription Management**: Full lifecycle handling including active status, start/end dates, and history.
- **Account Settings**: Dedicated profile management for users.
- **Hybrid Sandbox Mode**: Fully functional demo mode using LocalStorage when the backend is offline.

## 🛠️ Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), Modern CSS (Gradients, Glassmorphism, Flex/Grid).
- **Backend**: Node.js, Express.js.
- **Database**: MySQL with Connection Pooling.
- **Authentication**: Custom Session-based auth with `express-session` and `bcryptjs`.

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MySQL](https://www.mysql.com/)

### 2. Database Setup
Import the provided schema to initialize your database:
```bash
mysql -u root -p < database/schema.sql
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=membership_engine
SESSION_SECRET=your_secret_key
```

### 4. Installation & Run
```bash
npm install
npm start
```

Visit `http://localhost:3000` to see the app in action!

## 🧪 Default Admin Credentials
- **Email**: `admin@site.com`
- **Password**: `Admin@123`

---
Developed with ❤️ by [Ketan0607](https://github.com/Ketan0607)
