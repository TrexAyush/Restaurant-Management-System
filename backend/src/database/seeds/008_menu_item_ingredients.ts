import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Get menu items and inventory items
  const menuItems = await knex('menu_items').select('id', 'name');
  const inventoryItems = await knex('inventory_items').select('id', 'name');

  if (menuItems.length === 0 || inventoryItems.length === 0) {
    console.log('Skipping menu item ingredients seed - missing required data');
    return;
  }

  // Create a mapping of inventory items by name for easier lookup
  const inventoryMap = inventoryItems.reduce((acc: any, item: any) => {
    acc[item.name.toLowerCase()] = item.id;
    return acc;
  }, {});

  const ingredients: any[] = [];

  // Define ingredients for specific menu items
  const menuItemIngredients: { [key: string]: Array<{ ingredient: string; quantity: number; unit: string }> } = {
    'Buffalo Wings': [
      { ingredient: 'chicken breast', quantity: 0.5, unit: 'lbs' },
      { ingredient: 'flour', quantity: 0.1, unit: 'lbs' },
      { ingredient: 'olive oil', quantity: 0.05, unit: 'liters' }
    ],
    'Mozzarella Sticks': [
      { ingredient: 'mozzarella cheese', quantity: 0.25, unit: 'lbs' },
      { ingredient: 'flour', quantity: 0.1, unit: 'lbs' },
      { ingredient: 'eggs', quantity: 2, unit: 'pieces' }
    ],
    'Caesar Salad': [
      { ingredient: 'lettuce', quantity: 0.5, unit: 'heads' },
      { ingredient: 'mozzarella cheese', quantity: 0.1, unit: 'lbs' },
      { ingredient: 'olive oil', quantity: 0.02, unit: 'liters' }
    ],
    'Garden Salad': [
      { ingredient: 'lettuce', quantity: 0.5, unit: 'heads' },
      { ingredient: 'tomatoes', quantity: 0.25, unit: 'lbs' },
      { ingredient: 'onions', quantity: 0.1, unit: 'lbs' },
      { ingredient: 'bell peppers', quantity: 0.1, unit: 'lbs' }
    ],
    'Tomato Basil Soup': [
      { ingredient: 'tomatoes', quantity: 0.5, unit: 'lbs' },
      { ingredient: 'onions', quantity: 0.1, unit: 'lbs' },
      { ingredient: 'heavy cream', quantity: 0.25, unit: 'quarts' },
      { ingredient: 'olive oil', quantity: 0.02, unit: 'liters' }
    ],
    'Grilled Ribeye Steak': [
      { ingredient: 'ground beef', quantity: 0.75, unit: 'lbs' }, // Using ground beef as proxy for steak
      { ingredient: 'salt', quantity: 0.01, unit: 'lbs' },
      { ingredient: 'black pepper', quantity: 0.005, unit: 'lbs' },
      { ingredient: 'olive oil', quantity: 0.02, unit: 'liters' }
    ],
    'Grilled Chicken Breast': [
      { ingredient: 'chicken breast', quantity: 0.5, unit: 'lbs' },
      { ingredient: 'rice', quantity: 0.25, unit: 'lbs' },
      { ingredient: 'olive oil', quantity: 0.02, unit: 'liters' },
      { ingredient: 'salt', quantity: 0.01, unit: 'lbs' }
    ],
    'Beef Burger Deluxe': [
      { ingredient: 'ground beef', quantity: 0.5, unit: 'lbs' },
      { ingredient: 'lettuce', quantity: 0.1, unit: 'heads' },
      { ingredient: 'tomatoes', quantity: 0.1, unit: 'lbs' },
      { ingredient: 'onions', quantity: 0.05, unit: 'lbs' },
      { ingredient: 'mozzarella cheese', quantity: 0.1, unit: 'lbs' }
    ],
    'Spaghetti Carbonara': [
      { ingredient: 'pasta - spaghetti', quantity: 0.25, unit: 'lbs' },
      { ingredient: 'eggs', quantity: 2, unit: 'pieces' },
      { ingredient: 'mozzarella cheese', quantity: 0.15, unit: 'lbs' },
      { ingredient: 'black pepper', quantity: 0.005, unit: 'lbs' }
    ],
    'Margherita Pizza': [
      { ingredient: 'flour', quantity: 0.2, unit: 'lbs' },
      { ingredient: 'mozzarella cheese', quantity: 0.3, unit: 'lbs' },
      { ingredient: 'tomatoes', quantity: 0.2, unit: 'lbs' },
      { ingredient: 'olive oil', quantity: 0.02, unit: 'liters' }
    ],
    'Pepperoni Pizza': [
      { ingredient: 'flour', quantity: 0.2, unit: 'lbs' },
      { ingredient: 'mozzarella cheese', quantity: 0.3, unit: 'lbs' },
      { ingredient: 'tomatoes', quantity: 0.2, unit: 'lbs' },
      { ingredient: 'olive oil', quantity: 0.02, unit: 'liters' }
    ],
    'Fettuccine Alfredo': [
      { ingredient: 'pasta - spaghetti', quantity: 0.25, unit: 'lbs' }, // Using spaghetti as proxy
      { ingredient: 'heavy cream', quantity: 0.5, unit: 'quarts' },
      { ingredient: 'mozzarella cheese', quantity: 0.2, unit: 'lbs' }
    ],
    'Grilled Salmon': [
      { ingredient: 'salmon fillet', quantity: 0.5, unit: 'lbs' },
      { ingredient: 'rice', quantity: 0.25, unit: 'lbs' },
      { ingredient: 'olive oil', quantity: 0.02, unit: 'liters' },
      { ingredient: 'salt', quantity: 0.01, unit: 'lbs' }
    ],
    'Shrimp Scampi': [
      { ingredient: 'shrimp', quantity: 0.5, unit: 'lbs' },
      { ingredient: 'pasta - spaghetti', quantity: 0.25, unit: 'lbs' },
      { ingredient: 'olive oil', quantity: 0.03, unit: 'liters' },
      { ingredient: 'onions', quantity: 0.1, unit: 'lbs' }
    ],
    'Chocolate Lava Cake': [
      { ingredient: 'flour', quantity: 0.1, unit: 'lbs' },
      { ingredient: 'eggs', quantity: 2, unit: 'pieces' },
      { ingredient: 'sugar', quantity: 0.15, unit: 'lbs' },
      { ingredient: 'vanilla extract', quantity: 0.01, unit: 'liters' }
    ],
    'New York Cheesecake': [
      { ingredient: 'heavy cream', quantity: 0.5, unit: 'quarts' },
      { ingredient: 'eggs', quantity: 3, unit: 'pieces' },
      { ingredient: 'sugar', quantity: 0.2, unit: 'lbs' },
      { ingredient: 'vanilla extract', quantity: 0.01, unit: 'liters' }
    ],
    'Fresh Orange Juice': [
      { ingredient: 'orange juice', quantity: 0.3, unit: 'liters' }
    ],
    'Coffee': [
      { ingredient: 'coffee beans', quantity: 0.05, unit: 'lbs' }
    ],
    'Kids Chicken Nuggets': [
      { ingredient: 'chicken breast', quantity: 0.25, unit: 'lbs' },
      { ingredient: 'flour', quantity: 0.1, unit: 'lbs' },
      { ingredient: 'eggs', quantity: 1, unit: 'pieces' }
    ],
    'Kids Mac and Cheese': [
      { ingredient: 'pasta - spaghetti', quantity: 0.15, unit: 'lbs' }, // Using spaghetti as proxy
      { ingredient: 'mozzarella cheese', quantity: 0.2, unit: 'lbs' },
      { ingredient: 'heavy cream', quantity: 0.25, unit: 'quarts' }
    ]
  };

  // Create ingredients for menu items
  menuItems.forEach((menuItem: any) => {
    const itemIngredients = menuItemIngredients[menuItem.name];
    if (itemIngredients) {
      itemIngredients.forEach((ingredient) => {
        const inventoryItemId = inventoryMap[ingredient.ingredient.toLowerCase()];
        if (inventoryItemId) {
          ingredients.push({
            id: uuidv4(),
            menu_item_id: menuItem.id,
            inventory_item_id: inventoryItemId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      });
    }
  });

  // Insert ingredients
  if (ingredients.length > 0) {
    await knex('menu_item_ingredients').insert(ingredients);
  }
}