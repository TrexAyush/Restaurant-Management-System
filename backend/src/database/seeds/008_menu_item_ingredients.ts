import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const menuItems = await knex('menu_items').select('id', 'name');
  const inventoryItems = await knex('inventory_items').select('id', 'name');

  if (menuItems.length === 0 || inventoryItems.length === 0) {
    console.log('Skipping menu item ingredients seed - missing required data');
    return;
  }

  const inventoryMap = inventoryItems.reduce((acc: any, item: any) => {
    acc[item.name.toLowerCase()] = item.id;
    return acc;
  }, {});

  const ingredients: any[] = [];

  const menuItemIngredients: { [key: string]: Array<{ ingredient: string; quantity: number; unit: string }> } = {
    'Paneer Tikka': [
      { ingredient: 'paneer', quantity: 0.25, unit: 'kg' },
      { ingredient: 'capsicum', quantity: 0.1, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.1, unit: 'kg' },
      { ingredient: 'curd / yoghurt', quantity: 0.05, unit: 'kg' },
      { ingredient: 'red chilli powder', quantity: 0.005, unit: 'kg' }
    ],
    'Chicken 65': [
      { ingredient: 'chicken', quantity: 0.25, unit: 'kg' },
      { ingredient: 'red chilli powder', quantity: 0.01, unit: 'kg' },
      { ingredient: 'cooking oil', quantity: 0.1, unit: 'liters' }
    ],
    'Samosa (2 pcs)': [
      { ingredient: 'potatoes', quantity: 0.15, unit: 'kg' },
      { ingredient: 'maida (refined flour)', quantity: 0.1, unit: 'kg' },
      { ingredient: 'cooking oil', quantity: 0.05, unit: 'liters' }
    ],
    'Aloo Tikki Chaat': [
      { ingredient: 'potatoes', quantity: 0.2, unit: 'kg' },
      { ingredient: 'curd / yoghurt', quantity: 0.05, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.05, unit: 'kg' }
    ],
    'Tandoori Chicken (Half)': [
      { ingredient: 'chicken', quantity: 0.5, unit: 'kg' },
      { ingredient: 'curd / yoghurt', quantity: 0.1, unit: 'kg' },
      { ingredient: 'red chilli powder', quantity: 0.01, unit: 'kg' },
      { ingredient: 'garam masala', quantity: 0.005, unit: 'kg' }
    ],
    'Seekh Kebab': [
      { ingredient: 'mutton', quantity: 0.3, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.1, unit: 'kg' },
      { ingredient: 'green chillies', quantity: 0.01, unit: 'kg' },
      { ingredient: 'garam masala', quantity: 0.005, unit: 'kg' }
    ],
    'Malai Tikka': [
      { ingredient: 'chicken', quantity: 0.3, unit: 'kg' },
      { ingredient: 'cream', quantity: 0.05, unit: 'liters' },
      { ingredient: 'garam masala', quantity: 0.005, unit: 'kg' }
    ],
    'Tandoori Prawns': [
      { ingredient: 'prawns', quantity: 0.25, unit: 'kg' },
      { ingredient: 'curd / yoghurt', quantity: 0.05, unit: 'kg' },
      { ingredient: 'red chilli powder', quantity: 0.005, unit: 'kg' }
    ],
    'Paneer Butter Masala': [
      { ingredient: 'paneer', quantity: 0.25, unit: 'kg' },
      { ingredient: 'tomatoes', quantity: 0.2, unit: 'kg' },
      { ingredient: 'cream', quantity: 0.05, unit: 'liters' },
      { ingredient: 'ghee', quantity: 0.03, unit: 'kg' }
    ],
    'Dal Makhani': [
      { ingredient: 'cream', quantity: 0.05, unit: 'liters' },
      { ingredient: 'ghee', quantity: 0.03, unit: 'kg' },
      { ingredient: 'tomatoes', quantity: 0.1, unit: 'kg' },
      { ingredient: 'garam masala', quantity: 0.005, unit: 'kg' }
    ],
    'Palak Paneer': [
      { ingredient: 'paneer', quantity: 0.2, unit: 'kg' },
      { ingredient: 'cream', quantity: 0.03, unit: 'liters' },
      { ingredient: 'onions', quantity: 0.05, unit: 'kg' }
    ],
    'Aloo Gobi': [
      { ingredient: 'potatoes', quantity: 0.2, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.1, unit: 'kg' },
      { ingredient: 'turmeric powder', quantity: 0.005, unit: 'kg' },
      { ingredient: 'cooking oil', quantity: 0.03, unit: 'liters' }
    ],
    'Butter Chicken': [
      { ingredient: 'chicken', quantity: 0.3, unit: 'kg' },
      { ingredient: 'tomatoes', quantity: 0.2, unit: 'kg' },
      { ingredient: 'cream', quantity: 0.05, unit: 'liters' },
      { ingredient: 'ghee', quantity: 0.03, unit: 'kg' },
      { ingredient: 'garam masala', quantity: 0.005, unit: 'kg' }
    ],
    'Mutton Rogan Josh': [
      { ingredient: 'mutton', quantity: 0.35, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.15, unit: 'kg' },
      { ingredient: 'curd / yoghurt', quantity: 0.05, unit: 'kg' },
      { ingredient: 'red chilli powder', quantity: 0.01, unit: 'kg' },
      { ingredient: 'garam masala', quantity: 0.005, unit: 'kg' }
    ],
    'Chicken Kadhai': [
      { ingredient: 'chicken', quantity: 0.3, unit: 'kg' },
      { ingredient: 'capsicum', quantity: 0.1, unit: 'kg' },
      { ingredient: 'tomatoes', quantity: 0.15, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.1, unit: 'kg' }
    ],
    'Prawn Masala': [
      { ingredient: 'prawns', quantity: 0.25, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.1, unit: 'kg' },
      { ingredient: 'tomatoes', quantity: 0.15, unit: 'kg' },
      { ingredient: 'cooking oil', quantity: 0.03, unit: 'liters' }
    ],
    'Hyderabadi Chicken Biryani': [
      { ingredient: 'chicken', quantity: 0.3, unit: 'kg' },
      { ingredient: 'basmati rice', quantity: 0.25, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.15, unit: 'kg' },
      { ingredient: 'curd / yoghurt', quantity: 0.05, unit: 'kg' },
      { ingredient: 'ghee', quantity: 0.03, unit: 'kg' },
      { ingredient: 'saffron', quantity: 0.0005, unit: 'kg' }
    ],
    'Mutton Biryani': [
      { ingredient: 'mutton', quantity: 0.3, unit: 'kg' },
      { ingredient: 'basmati rice', quantity: 0.25, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.15, unit: 'kg' },
      { ingredient: 'ghee', quantity: 0.03, unit: 'kg' }
    ],
    'Veg Biryani': [
      { ingredient: 'basmati rice', quantity: 0.25, unit: 'kg' },
      { ingredient: 'onions', quantity: 0.1, unit: 'kg' },
      { ingredient: 'capsicum', quantity: 0.05, unit: 'kg' },
      { ingredient: 'ghee', quantity: 0.02, unit: 'kg' }
    ],
    'Jeera Rice': [
      { ingredient: 'basmati rice', quantity: 0.2, unit: 'kg' },
      { ingredient: 'ghee', quantity: 0.02, unit: 'kg' }
    ],
    'Butter Naan': [
      { ingredient: 'maida (refined flour)', quantity: 0.1, unit: 'kg' },
      { ingredient: 'ghee', quantity: 0.01, unit: 'kg' }
    ],
    'Garlic Naan': [
      { ingredient: 'maida (refined flour)', quantity: 0.1, unit: 'kg' },
      { ingredient: 'ghee', quantity: 0.01, unit: 'kg' }
    ],
    'Tandoori Roti': [
      { ingredient: 'atta (wheat flour)', quantity: 0.08, unit: 'kg' }
    ],
    'Laccha Paratha': [
      { ingredient: 'atta (wheat flour)', quantity: 0.1, unit: 'kg' },
      { ingredient: 'ghee', quantity: 0.02, unit: 'kg' }
    ],
    'Gulab Jamun (2 pcs)': [
      { ingredient: 'milk', quantity: 0.1, unit: 'liters' },
      { ingredient: 'sugar', quantity: 0.05, unit: 'kg' },
      { ingredient: 'ghee', quantity: 0.02, unit: 'kg' }
    ],
    'Rasmalai': [
      { ingredient: 'milk', quantity: 0.2, unit: 'liters' },
      { ingredient: 'sugar', quantity: 0.05, unit: 'kg' },
      { ingredient: 'saffron', quantity: 0.0002, unit: 'kg' }
    ],
    'Gajar Ka Halwa': [
      { ingredient: 'milk', quantity: 0.15, unit: 'liters' },
      { ingredient: 'ghee', quantity: 0.03, unit: 'kg' },
      { ingredient: 'sugar', quantity: 0.05, unit: 'kg' }
    ],
    'Kulfi': [
      { ingredient: 'milk', quantity: 0.2, unit: 'liters' },
      { ingredient: 'sugar', quantity: 0.03, unit: 'kg' }
    ],
    'Masala Chai': [
      { ingredient: 'tea leaves', quantity: 0.005, unit: 'kg' },
      { ingredient: 'milk', quantity: 0.1, unit: 'liters' },
      { ingredient: 'sugar', quantity: 0.01, unit: 'kg' }
    ],
    'Mango Lassi': [
      { ingredient: 'curd / yoghurt', quantity: 0.15, unit: 'kg' },
      { ingredient: 'sugar', quantity: 0.02, unit: 'kg' }
    ],
    'Sweet Lassi': [
      { ingredient: 'curd / yoghurt', quantity: 0.15, unit: 'kg' },
      { ingredient: 'sugar', quantity: 0.02, unit: 'kg' }
    ]
  };

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

  if (ingredients.length > 0) {
    await knex('menu_item_ingredients').insert(ingredients);
  }
}