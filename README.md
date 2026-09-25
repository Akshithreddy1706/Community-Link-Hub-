# 🌐 Community Link Hub

### Connecting People with Community Services

## 📌 About the Project

Community Link Hub is a full-stack web application designed to provide a centralized platform for discovering and managing community services.

In many communities, information about services such as healthcare, education, food assistance, senior care, volunteering, and other local resources can be scattered across different sources. This project brings this information together in one platform, making it easier for users to find relevant services and learn more about them.

Users can browse available services, search for specific services, view detailed information such as location, contact details, timings, and descriptions, and share their experience through reviews and ratings. Users can also submit new community services to expand the platform.

The application also includes an administrative system through which authorized administrators can manage service information, update listings, and remove outdated services.

---

## 🎯 Project Objective

The main objective of Community Link Hub is to create a simple and centralized platform that:

- Makes community services easier to discover
- Provides useful information about available services
- Allows users to share reviews and ratings
- Makes it easier to add and maintain service listings
- Provides administrators with secure service management

---

## ✨ Key Features

### 👥 User Features

- 🔍 Search and filter community services
- 📋 View detailed service information
- ⭐ Add and view reviews and ratings
- ➕ Add new community services
- 🖼️ Upload images for service listings
- 📱 Responsive and user-friendly interface

### 🔐 Admin Features

- Secure administrator login
- Manage community service listings
- Add, update, and delete services
- Manage service information and images
- Protected administrative operations

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Web page structure |
| **CSS3** | Styling and responsive design |
| **JavaScript** | Frontend functionality |
| **Node.js** | Backend runtime |
| **Express.js** | REST API development |
| **MongoDB** | Data storage |
| **Mongoose** | MongoDB interaction |
| **JWT** | Admin authentication |
| **bcrypt** | Password hashing |
| **Multer** | Image uploads |
| **Render** | Application deployment |
| **MongoDB Atlas** | Cloud database |

---

## 🔄 How the Application Works

The application follows a client-server architecture.

```text
             👤 User
                ↓
        💻 Web Interface
                ↓
          🔗 REST APIs
                ↓
       ⚙️ Node.js + Express
                ↓
           🧩 Mongoose
                ↓
        🍃 MongoDB Atlas
