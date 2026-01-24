# Restaurant Management System - Mock Data

This document describes the comprehensive mock data generated for the Restaurant Management System, including how to use it and what data is available for testing.

## 🚀 Quick Start

### Running the Seeds

**Option 1: Using the JavaScript script**
```bash
node scripts/seed-database.js
```

**Option 2: Using the TypeScript script**
```bash
npx ts-node scripts/seed-database.ts
```

**Option 3: Using Knex CLI**
```bash
npx knex seed:run --specific=000_run_all_seeds.ts
```

## 📊 Mock Data Overview

### 👥 Users (5 records)
- **Admin User**: `admin_test` / `password123`
- **Manager**: `manager_test` / `password123`
- **Waiter**: `waiter_test` / `password123`
- **Kitchen Staff**: `kitchen_test` / `password123`
- **Cashier**: `cashier_test` / `password123`

All users are active and ready for testing different role-based functionalities.

### 📂 Menu Categories (8 categories)
1. **Appetizers** - Start your meal with our delicious appetizers
2. **Soups & Salads** - Fresh soups and crisp salads
3. **Main Courses** - Hearty main dishes to satisfy your appetite
4. **Pasta & Pizza** - Italian classics made fresh daily
5. **Seafood** - Fresh catch of the day and seafood specialties
6. **Desserts** - Sweet endings to your perfect meal
7. **Beverages** - Refreshing drinks and specialty beverages
8. **Kids Menu** - Special dishes for our younger guests

### 🍽️ Menu Items (32 items)
Comprehensive menu with realistic pricing ($2.99 - $32.99):

**Appetizers:**
- Buffalo Wings ($12.99)
- Mozzarella Sticks ($9.99)
- Loaded Nachos ($11.99)
- Calamari Rings ($13.99)

**Soups & Salads:**
- Caesar Salad ($10.99)
- Garden Salad ($8.99)
- Tomato Basil Soup ($7.99)
- Chicken Noodle Soup ($8.99)

**Main Courses:**
- Grilled Ribeye Steak ($28.99)
- BBQ Ribs ($24.99)
- Grilled Chicken Breast ($18.99)
- Beef Burger Deluxe ($15.99)

**Pasta & Pizza:**
- Spaghetti Carbonara ($16.99)
- Margherita Pizza ($14.99)
- Pepperoni Pizza ($16.99)
- Fettuccine Alfredo ($15.99)

**Seafood:**
- Grilled Salmon ($22.99)
- Shrimp Scampi ($19.99)
- Fish and Chips ($17.99)
- Lobster Tail ($32.99)

**Desserts:**
- Chocolate Lava Cake ($8.99)
- New York Cheesecake ($7.99)
- Tiramisu ($8.99)
- Apple Pie ($6.99)

**Beverages:**
- Fresh Orange Juice ($4.99)
- Coffee ($2.99)
- Iced Tea ($2.99)
- Soft Drinks ($2.99)

**Kids Menu:**
- Kids Chicken Nuggets ($8.99)
- Kids Mac and Cheese ($7.99)
- Kids Mini Pizza ($8.99)
- Kids Grilled Cheese ($6.99)

### 📦 Inventory Items (21 items)
Realistic inventory with current stock, units, and cost tracking:

**Proteins:**
- Chicken Breast (50 lbs, $4.50/lb)
- Ground Beef (30 lbs, $6.00/lb)
- Salmon Fillet (25 lbs, $12.00/lb)
- Shrimp (15 lbs, $8.50/lb)

**Vegetables:**
- Tomatoes (20 lbs, $2.50/lb)
- Lettuce (15 heads, $1.50/head)
- Onions (25 lbs, $1.25/lb)
- Bell Peppers (12 lbs, $3.00/lb)

**Dairy & Eggs:**
- Mozzarella Cheese (10 lbs, $5.50/lb)
- Eggs (120 pieces, $0.25/piece)
- Heavy Cream (8 quarts, $3.50/quart)

**Grains & Pasta:**
- Pasta - Spaghetti (20 lbs, $1.50/lb)
- Rice (50 lbs, $1.00/lb)
- Flour (25 lbs, $0.75/lb)

**Seasonings & Oils:**
- Olive Oil (5 liters, $8.00/liter)
- Salt (10 lbs, $1.00/lb)
- Black Pepper (2 lbs, $12.00/lb)

**Beverages:**
- Coffee Beans (10 lbs, $8.50/lb)
- Orange Juice (12 liters, $4.00/liter)

**Dessert Ingredients:**
- Sugar (20 lbs, $1.50/lb)
- Vanilla Extract (2 liters, $25.00/liter)

### 🪑 Tables (16 tables)
Variety of table sizes and statuses:
- **Small tables (2 people)**: Tables 1-4
- **Medium tables (4 people)**: Tables 5-10
- **Large tables (6 people)**: Tables 11-13
- **Extra large tables (8 people)**: Tables 14-15
- **Out of service**: Table 16 (for testing maintenance scenarios)

**Current Status Distribution:**
- Available: 10 tables
- Occupied: 3 tables (with active orders)
- Reserved: 2 tables
- Out of Service: 1 table

### 📋 Orders (8 orders)
Mix of current and historical orders:

**Active Orders (3):**
- Table 3: Recently placed order (5 minutes ago)
- Table 6: Order being prepared (15 minutes ago)
- Table 10: Order ready for serving (25 minutes ago)

**Completed Orders (5):**
- Historical orders from the past 3 days
- Various combinations of menu items
- Different waiters and tables

### 💰 Bills (5 bills)
Generated for completed orders:
- 8% tax rate applied
- Mix of payment statuses (80% paid, 20% pending)
- Various payment methods (cash, card, digital)
- Realistic timing (generated 1 hour after order, paid 15 minutes later)

### 🥘 Menu Item Ingredients (50+ relationships)
Realistic ingredient mappings for menu items:
- Buffalo Wings: Chicken breast, flour, olive oil
- Caesar Salad: Lettuce, mozzarella cheese, olive oil
- Grilled Salmon: Salmon fillet, rice, olive oil, salt
- Spaghetti Carbonara: Pasta, eggs, mozzarella cheese, black pepper
- And many more...

## 🧪 Testing Scenarios

### User Role Testing
- **Admin**: Full system access, user management
- **Manager**: Menu management, reports, inventory
- **Waiter**: Order taking, table management
- **Kitchen Staff**: Order preparation, status updates
- **Cashier**: Bill processing, payments

### Order Flow Testing
1. **New Orders**: Use available tables to create new orders
2. **Order Processing**: Update status of placed orders (Table 3)
3. **Kitchen Operations**: Mark preparing orders as ready (Table 6)
4. **Service**: Serve ready orders (Table 10)

### Inventory Management
- **Low Stock Items**: Some items are near their low stock threshold
- **Stock Updates**: Test inventory adjustments and restocking
- **Cost Tracking**: Monitor ingredient costs and usage

### Table Management
- **Availability**: Test table status changes
- **Reservations**: Manage reserved tables (Tables 7, 13)
- **Maintenance**: Handle out-of-service table (Table 16)

### Billing & Payments
- **Pending Bills**: Process pending payments
- **Payment Methods**: Test different payment types
- **Tax Calculations**: Verify 8% tax calculations

## 🔄 Resetting Data

To reset and regenerate all mock data:

```bash
# Reset database and run migrations
npx knex migrate:rollback --all
npx knex migrate:latest

# Run seeds again
node scripts/seed-database.js
```

## 📝 Customization

### Modifying Mock Data
Each seed file can be customized:
- `001_initial_users.ts` - User accounts and roles
- `002_menu_categories.ts` - Menu categories
- `003_inventory_items.ts` - Inventory items and stock levels
- `004_menu_items.ts` - Menu items and pricing
- `005_tables.ts` - Table configuration
- `006_orders.ts` - Order scenarios
- `007_bills.ts` - Billing data
- `008_menu_item_ingredients.ts` - Ingredient relationships

### Adding New Data
1. Create new seed files following the naming convention
2. Update `000_run_all_seeds.ts` to include your new seeds
3. Ensure proper dependency order

## 🚨 Important Notes

- All passwords are hashed using bcrypt with salt rounds of 10
- UUIDs are used for all primary keys
- Foreign key relationships are properly maintained
- Timestamps are realistic and follow logical sequences
- Stock levels and pricing are realistic for restaurant operations
- Order statuses follow proper workflow progression

## 🎯 Next Steps

After seeding the database, you can:
1. Start the backend server and test API endpoints
2. Launch the frontend application and explore the UI
3. Test different user roles and permissions
4. Create new orders and process them through the system
5. Manage inventory and track stock levels
6. Generate reports and analytics

Happy testing! 🍽️