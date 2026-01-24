import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Get category IDs first
  const categories = await knex('menu_categories').select('id', 'name');
  const categoryMap = categories.reduce((acc: any, cat: any) => {
    acc[cat.name] = cat.id;
    return acc;
  }, {});

  // Insert seed entries
  await knex('menu_items').insert([
    // Appetizers
    {
      id: uuidv4(),
      name: 'Buffalo Wings',
      description: 'Crispy chicken wings tossed in spicy buffalo sauce, served with celery and blue cheese dip',
      price: 12.99,
      category_id: categoryMap['Appetizers'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Mozzarella Sticks',
      description: 'Golden fried mozzarella cheese sticks served with marinara sauce',
      price: 9.99,
      category_id: categoryMap['Appetizers'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Loaded Nachos',
      description: 'Crispy tortilla chips topped with cheese, jalapeños, sour cream, and guacamole',
      price: 11.99,
      category_id: categoryMap['Appetizers'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Calamari Rings',
      description: 'Fresh squid rings lightly battered and fried, served with spicy marinara',
      price: 13.99,
      category_id: categoryMap['Appetizers'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Soups & Salads
    {
      id: uuidv4(),
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce, parmesan cheese, croutons, and Caesar dressing',
      price: 10.99,
      category_id: categoryMap['Soups & Salads'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Garden Salad',
      description: 'Mixed greens, tomatoes, cucumbers, onions, and your choice of dressing',
      price: 8.99,
      category_id: categoryMap['Soups & Salads'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Tomato Basil Soup',
      description: 'Creamy tomato soup with fresh basil, served with garlic bread',
      price: 7.99,
      category_id: categoryMap['Soups & Salads'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Chicken Noodle Soup',
      description: 'Classic comfort soup with tender chicken, vegetables, and egg noodles',
      price: 8.99,
      category_id: categoryMap['Soups & Salads'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Main Courses
    {
      id: uuidv4(),
      name: 'Grilled Ribeye Steak',
      description: '12oz prime ribeye steak grilled to perfection, served with mashed potatoes and vegetables',
      price: 28.99,
      category_id: categoryMap['Main Courses'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'BBQ Ribs',
      description: 'Fall-off-the-bone pork ribs with our signature BBQ sauce, served with coleslaw and fries',
      price: 24.99,
      category_id: categoryMap['Main Courses'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Grilled Chicken Breast',
      description: 'Herb-marinated chicken breast served with rice pilaf and steamed broccoli',
      price: 18.99,
      category_id: categoryMap['Main Courses'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Beef Burger Deluxe',
      description: 'Half-pound beef patty with lettuce, tomato, onion, cheese, and fries',
      price: 15.99,
      category_id: categoryMap['Main Courses'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Pasta & Pizza
    {
      id: uuidv4(),
      name: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta with eggs, cheese, pancetta, and black pepper',
      price: 16.99,
      category_id: categoryMap['Pasta & Pizza'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, tomato sauce, and basil on our homemade pizza dough',
      price: 14.99,
      category_id: categoryMap['Pasta & Pizza'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Pepperoni Pizza',
      description: 'Classic pizza with pepperoni and mozzarella cheese',
      price: 16.99,
      category_id: categoryMap['Pasta & Pizza'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Fettuccine Alfredo',
      description: 'Rich and creamy Alfredo sauce over fresh fettuccine pasta',
      price: 15.99,
      category_id: categoryMap['Pasta & Pizza'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Seafood
    {
      id: uuidv4(),
      name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon grilled with lemon herb butter, served with asparagus and rice',
      price: 22.99,
      category_id: categoryMap['Seafood'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Shrimp Scampi',
      description: 'Jumbo shrimp sautéed in garlic, white wine, and butter over linguine',
      price: 19.99,
      category_id: categoryMap['Seafood'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Fish and Chips',
      description: 'Beer-battered cod served with crispy fries and tartar sauce',
      price: 17.99,
      category_id: categoryMap['Seafood'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Lobster Tail',
      description: 'Broiled lobster tail with drawn butter, served with baked potato and vegetables',
      price: 32.99,
      category_id: categoryMap['Seafood'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Desserts
    {
      id: uuidv4(),
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
      price: 8.99,
      category_id: categoryMap['Desserts'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'New York Cheesecake',
      description: 'Classic creamy cheesecake with graham cracker crust and berry compote',
      price: 7.99,
      category_id: categoryMap['Desserts'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Tiramisu',
      description: 'Traditional Italian dessert with coffee-soaked ladyfingers and mascarpone',
      price: 8.99,
      category_id: categoryMap['Desserts'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Apple Pie',
      description: 'Homemade apple pie with cinnamon and served warm with vanilla ice cream',
      price: 6.99,
      category_id: categoryMap['Desserts'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Beverages
    {
      id: uuidv4(),
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 4.99,
      category_id: categoryMap['Beverages'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Coffee',
      description: 'Freshly brewed coffee, regular or decaf',
      price: 2.99,
      category_id: categoryMap['Beverages'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Iced Tea',
      description: 'Refreshing iced tea, sweetened or unsweetened',
      price: 2.99,
      category_id: categoryMap['Beverages'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Soft Drinks',
      description: 'Coca-Cola, Pepsi, Sprite, or other soft drinks',
      price: 2.99,
      category_id: categoryMap['Beverages'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },

    // Kids Menu
    {
      id: uuidv4(),
      name: 'Kids Chicken Nuggets',
      description: 'Crispy chicken nuggets served with fries and apple slices',
      price: 8.99,
      category_id: categoryMap['Kids Menu'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Kids Mac and Cheese',
      description: 'Creamy macaroni and cheese served with steamed broccoli',
      price: 7.99,
      category_id: categoryMap['Kids Menu'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Kids Mini Pizza',
      description: 'Personal-sized cheese pizza',
      price: 8.99,
      category_id: categoryMap['Kids Menu'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Kids Grilled Cheese',
      description: 'Classic grilled cheese sandwich served with tomato soup',
      price: 6.99,
      category_id: categoryMap['Kids Menu'],
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}