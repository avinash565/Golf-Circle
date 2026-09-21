# Golf Circle

### A Full-Stack Golf Rewards & Charity Platform

Golf Circle is a full-stack web application developed as part of the **Digital Heroes** project. The platform combines golf score management, user subscriptions, charity contributions, monthly reward draws, winner management, and an administrative dashboard into a single web application.

---

## Project Links

| Resource | Link |
|---|---|
| 🚀 Live Website | https://golf-circle.vercel.app |
| 💻 GitHub Repository | https://github.com/avinash565/Golf-Circle |

---

## About The Project

Golf Circle is designed around a golf-based rewards experience.

Users can create an account, subscribe to a plan, select a charity, enter their latest golf scores, and participate in monthly reward draws.

The platform also provides an **Admin Dashboard** through which administrators can manage users, charities, draws, and winners.

The application uses **Supabase** for authentication and PostgreSQL database services, while **Razorpay** is used for subscription payments.

---

# Features

## User Features

- User registration
- User login and authentication
- Secure session management
- Personal user dashboard
- Subscription status
- Monthly subscription plan
- Yearly subscription plan
- Charity selection
- Charity contribution percentage
- Stableford score management
- Latest 5 golf scores
- Monthly reward draw participation
- Winnings overview
- Payment status
- Responsive user interface

---

## Golf Score Management

Users can maintain their latest golf scores using the Stableford scoring system.

### Score Rules

- Stableford score range: **1–45**
- Score date is required
- Only one score can be entered for a particular date
- The latest 5 scores are maintained
- Scores can be added and managed from the user dashboard
- Scores are displayed in reverse chronological order

---

# Monthly Reward Draw

Golf Circle includes a monthly reward draw system with three matching categories.

| Match Type | Prize Pool Allocation |
|---|---:|
| 🏆 5-Number Match | 40% |
| 🥈 4-Number Match | 35% |
| 🥉 3-Number Match | 25% |

### Draw Rules

- Draws are conducted monthly.
- Users with the required participation criteria can be considered for the draw.
- Multiple winners in the same tier share that tier's prize equally.
- The 5-number jackpot can roll over when there is no winner.
- Draw records are stored in the database.
- Winners are stored separately for verification and payout management.

---

# Subscription & Payment System

The application supports recurring subscription plans.

### Available Plans

- Monthly Plan
- Yearly Plan

### Payment Gateway

**Razorpay** is integrated for subscription payments.

The payment flow includes:

1. User selects a subscription plan.
2. Application creates a Razorpay subscription.
3. Razorpay checkout is opened.
4. Payment is completed by the user.
5. Payment signature is verified on the server.
6. Subscription information is stored in Supabase.
7. User subscription status is updated.

> 🔐 Razorpay secret credentials are stored using environment variables and are not included in the source code.

---

# Charity Management

Users can select a charity and configure their contribution percentage.

The Admin Dashboard allows administrators to manage charity records.

Each charity can contain:

- Charity name
- Description
- Website
- Active / inactive status

---

# Admin Dashboard

Golf Circle includes a dedicated Admin Dashboard.

Administrators can manage and monitor:

### Users

- User records
- User roles
- Subscription information

### Charities

- Add/manage charities
- Charity descriptions
- Charity websites
- Active/inactive status

### Draws

- Create monthly draws
- View draw records
- Configure draw method
- Manage prize pool
- Review draw results

### Winners

- View winners
- Match category
- Prize amount
- Proof submission
- Payment status

---

# Database

The application uses **Supabase PostgreSQL** as its primary database.

## Main Tables

```text
profiles
subscriptions
charities
scores
draws
winners
