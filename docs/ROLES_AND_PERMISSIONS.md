# Roles & Permissions — Spice Garden Restaurant Management System

## User Roles

| Role | Code | Description |
|------|------|-------------|
| **Admin** | `admin` | Full system access. Manages users, settings, and all operations. |
| **Manager** | `manager` | Manages menu, tables, inventory, orders, billing, reports. |
| **Waiter** | `waiter` | Takes orders, manages tables, views billing. |
| **Kitchen Staff** | `kitchen_staff` | Views and updates order statuses in the kitchen display. |
| **Cashier** | `cashier` | Generates bills and processes payments. |

---

## Permission Matrix

### Authentication & Users

| Action | Admin | Manager | Waiter | Kitchen | Cashier |
|--------|:-----:|:-------:|:------:|:-------:|:-------:|
| Login / Logout | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ | ✅ | ✅ |
| List all users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update user | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ | ❌ | ❌ |
| Activate/Deactivate user | ✅ | ❌ | ❌ | ❌ | ❌ |

### Menu Management

| Action | Admin | Manager | Waiter | Kitchen | Cashier |
|--------|:-----:|:-------:|:------:|:-------:|:-------:|
| View categories | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit/Delete category | ✅ | ✅ | ❌ | ❌ | ❌ |
| View menu items | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit/Delete menu item | ✅ | ✅ | ❌ | ❌ | ❌ |
| Toggle item availability | ✅ | ✅ | ✅ | ❌ | ❌ |
| View menu statistics | ✅ | ✅ | ❌ | ❌ | ❌ |

### Table Management

| Action | Admin | Manager | Waiter | Kitchen | Cashier |
|--------|:-----:|:-------:|:------:|:-------:|:-------:|
| View all tables | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit/Delete table | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update table status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Seat/Clear/Reserve table | ✅ | ✅ | ✅ | ❌ | ❌ |
| Set out of service | ✅ | ✅ | ❌ | ❌ | ❌ |
| View table statistics | ✅ | ✅ | ❌ | ❌ | ❌ |

### Order Management

| Action | Admin | Manager | Waiter | Kitchen | Cashier |
|--------|:-----:|:-------:|:------:|:-------:|:-------:|
| View all orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create order | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update order (items) | ✅ | ✅ | ✅ | ❌ | ❌ |
| View orders by status | ✅ | ✅ | ✅ | ❌ | ✅ |
| Start preparing (→ PREPARING) | ✅ | ✅ | ❌ | ✅ | ❌ |
| Mark ready (→ READY) | ✅ | ✅ | ❌ | ✅ | ❌ |
| Mark served (→ SERVED) | ✅ | ✅ | ✅ | ❌ | ❌ |
| View kitchen orders | ✅ | ✅ | ❌ | ✅ | ❌ |
| View order statistics | ✅ | ✅ | ❌ | ❌ | ❌ |

### Billing & Payments

| Action | Admin | Manager | Waiter | Kitchen | Cashier |
|--------|:-----:|:-------:|:------:|:-------:|:-------:|
| View all bills | ✅ | ✅ | ❌ | ❌ | ✅ |
| Generate bill | ✅ | ✅ | ❌ | ❌ | ✅ |
| Process payment | ✅ | ✅ | ❌ | ❌ | ✅ |
| Cancel bill | ✅ | ✅ | ❌ | ❌ | ✅ |
| Reopen cancelled bill | ✅ | ✅ | ❌ | ❌ | ❌ |
| View/Download PDF invoice | ✅ | ✅ | ✅ | ❌ | ✅ |
| View revenue summary | ✅ | ✅ | ❌ | ❌ | ❌ |
| View/Update billing config | ✅ | ✅* | ❌ | ❌ | ❌ |
| Update restaurant info | ✅ | ❌ | ❌ | ❌ | ❌ |

*Manager can view but not update billing config.

### Inventory Management

| Action | Admin | Manager | Waiter | Kitchen | Cashier |
|--------|:-----:|:-------:|:------:|:-------:|:-------:|
| View inventory | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create/Edit/Delete item | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update stock | ✅ | ✅ | ❌ | ❌ | ❌ |
| View low stock alerts | ✅ | ✅ | ❌ | ✅ | ❌ |
| Check ingredient availability | ✅ | ✅ | ❌ | ✅ | ❌ |

### Reports & Analytics

| Action | Admin | Manager | Waiter | Kitchen | Cashier |
|--------|:-----:|:-------:|:------:|:-------:|:-------:|
| View daily/weekly sales | ✅ | ✅ | ❌ | ❌ | ❌ |
| View item popularity | ✅ | ✅ | ❌ | ❌ | ❌ |
| View revenue reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| View dashboard summary | ✅ | ✅ | ❌ | ❌ | ❌ |
| View recent orders | ✅ | ✅ | ✅ | ✅ | ✅ |
| View performance metrics | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ❌ | ❌ | ❌ |

### System Monitoring

| Action | Admin | Manager | Waiter | Kitchen | Cashier |
|--------|:-----:|:-------:|:------:|:-------:|:-------:|
| View system health | ✅ | ✅ | ❌ | ❌ | ❌ |
| View performance metrics | ✅ | ✅ | ❌ | ❌ | ❌ |
| View error logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Clear monitoring data | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Order Lifecycle

```
PLACED → PREPARING → READY → SERVED → Bill Generated → Payment Processed
```

| Transition | Who Can Do It | What Happens |
|-----------|---------------|--------------|
| Create order (→ PLACED) | Admin, Manager, Waiter | Table set to OCCUPIED |
| Start preparing (→ PREPARING) | Admin, Manager, Kitchen Staff | Inventory deducted for ingredients |
| Mark ready (→ READY) | Admin, Manager, Kitchen Staff | Kitchen notifies front-of-house |
| Mark served (→ SERVED) | Admin, Manager, Waiter | Table set to AVAILABLE |
| Generate bill | Admin, Manager, Cashier | Bill created with GST (5%) |
| Process payment | Admin, Manager, Cashier | Bill marked PAID |

---

## Frontend Page Access

| Page | Route | Roles with Access |
|------|-------|-------------------|
| Dashboard | `/dashboard` | All authenticated users |
| Menu Management | `/menu` | Admin, Manager |
| Table Management | `/tables` | Admin, Manager, Waiter |
| Order Management | `/orders` | Admin, Manager, Waiter |
| Kitchen Display | `/kitchen` | Admin, Manager, Kitchen Staff |
| Billing | `/billing` | Admin, Manager, Cashier |
| Inventory | `/inventory` | Admin, Manager |
| Reports | `/reports` | Admin, Manager |
| User Management | `/users` | Admin only |
| Settings | `/settings` | Admin only |
| Monitoring | `/monitoring` | Admin, Manager |

---

## Seed Users (Development)

| Username | Password | Role |
|----------|----------|------|
| `admin_test` | `password123` | Admin |
| `manager_test` | `password123` | Manager |
| `waiter_test` | `password123` | Waiter |
| `kitchen_test` | `password123` | Kitchen Staff |
| `cashier_test` | `password123` | Cashier |
