# FixHub - AI Context File

> **Note for AI:** This document is intended to provide complete project context for FixHub. Use this as your baseline structure and feature reference when assisting with coding, refactoring, or generating tests for the FixHub platform.

## Project Overview
**FixHub** is a comprehensive, full-stack service directory and booking system built using the MERN stack (MongoDB, Express.js, React, Node.js). The platform connects standard users with service providers, allowing users to browse, cart, book, and pay for services, while providing an admin interface for system management. Features also include premium user subscriptions and automated receipt generation.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router DOM
- **State Management:** React Context API (`CartContext`, `ThemeContext`)
- **Animations/UI:** GSAP, Framer Motion, Lenis (smooth scrolling), Three.js
- **Icons & Graphics:** FontAwesome, Lucide React, React Icons
- **PDF Generation (Client-side):** html2pdf.js

### Backend
- **Framework:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose modeling)
- **Authentication:** Clerk Express integration combined with traditional JWT & bcrypt. 
- **File Uploads:** Multer
- **Emails:** Nodemailer
- **PDF Generation (Server-side):** PDFKit
- **CORS & Environment:** cors, dotenv

---

## 🏗️ Architectural Layout

### Backend Structure (`./backend`)
- **`server.js`**: Application entry point, Express configuration, middleware setup.
- **Controllers (`/controllers`)**:
  - `authController.js`: Registration, Login, User data, roles.
  - `adminController.js`: User stats, platform management.
  - `serviceController.js`: CRUD for service catalog.
  - `bookingController.js`: Logic for placing and tracking bookings.
  - `cartController.js`: API-based cart interactions.
  - `paymentController.js`: Payment intent and checkout execution.
  - `subscriptionController.js`: Upgrades, tier management.
  - `contactController.js` & `newsletterController.js`: User engagement ops.
- **Models (`/models`)**: Mongoose schemas for User, Service, Booking, Payment, Subscription.
- **Routes / Middleware (`/routes`, `/middleware`)**: Routing definitions and standard auth/role-check middleware.
- **Scripts (`/scripts`)**: Database seed files and utilities (`seed_services.js`, `makeAdmin.js`, etc.)

### Frontend Structure (`./frontend`)
- **Component Directory (`/src/components`)**:
  - **Core Application**: `Home`, `Header`, `Footer`, `Dashboard`.
  - **Auth Flows**: `Login`, `Register`, `Auth.css`, `CompleteProfile`, `ForgotPassword`.
  - **Service & Discovery**: `Services`, `ServiceDetail`, `CardNav`, `ProviderProfile`.
  - **Booking & Checkout**: `BookingModal`, `Cart` (with Context), `Checkout`, `Payment`.
  - **User & Subscriptions**: `AccountSettings`, `Pricing`, `PlanUpgradeModal`, `Subscription`.
  - **Admin & General**: `Admin`, `AssetVault`, `ContactInquiry`, `Newsletter`.
  - **UI/UX Details**: Smooth animated components like `SplashCursor`, `SplitText`, `InfiniteLoop`, `SkeletonLoader`.

---

## 🧩 Core Modules

### 1. User & Authentication Module
Manages multi-tier user access paths (Standard User, Provider, Admin). Handled mainly by Clerk (or JWT variants). Includes profile picture cropping (`ImageCropper`) and password recovery.

### 2. Services Module
Catalog system rendering service cards. Includes detailed views and robust filtering. Corresponds to `serviceController.js` on the backend.

### 3. Booking & Cart Flow
Similar to an e-commerce platform but tailored for time-based services. Users can add multiple services to a `Cart`, configure dates/times via `BookingModal`, and check out their cart at once.

### 4. Payments System
Handles actual financial transactions. `Checkout` initiates the sequence, `Payment` confirms. Valid payments trigger automated PDF receipt compilation (`receiptTemplate.js`, `pdfkit`) available for user download (`downloadReceipt`).

### 5. Subscription & Premium Tiers
Users can upgrade plans via `PlanUpgradeModal` & `Pricing`. Upgrading grants access to premium modules or discounts mapped inside `subscriptionController.js`.

### 6. Admin Control Panel
The `Admin` dashboard visualizes platform data (bookings, user metrics, revenues). Interacts closely with `adminController.js` to moderate the platform's content and personnel.

---

## ⚙️ How to use this context
If extending features, please ensure:
1. You keep API calls structured around the existing MongoDB controller setup.
2. Ensure React components align with standard context usage (`ThemeContext`, `CartContext`) and import their corresponding CSS modules.
3. Follow the UI animation standards utilizing GSAP / Framer Motion where complex transitions are needed.
