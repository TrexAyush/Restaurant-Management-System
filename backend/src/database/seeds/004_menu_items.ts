import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const categories = await knex('menu_categories').select('id', 'name');
  const categoryMap = categories.reduce((acc: any, cat: any) => {
    acc[cat.name] = cat.id;
    return acc;
  }, {});

  await knex('menu_items').insert([
    // Starters
    { id: uuidv4(), name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled in tandoor with bell peppers and onions', price: 299, category_id: categoryMap['Starters'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Samosa (2 pcs)', description: 'Crispy pastry filled with spiced potatoes and peas, served with chutney', price: 129, category_id: categoryMap['Starters'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Chicken 65', description: 'Spicy deep-fried chicken bites marinated in red chillies and curry leaves', price: 329, category_id: categoryMap['Starters'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Aloo Tikki Chaat', description: 'Crispy potato patties topped with yoghurt, chutneys and fresh coriander', price: 179, category_id: categoryMap['Starters'], is_available: true, created_at: new Date(), updated_at: new Date() },

    // Tandoor & Kebabs
    { id: uuidv4(), name: 'Tandoori Chicken (Half)', description: 'Half chicken marinated in yoghurt and spices, cooked in clay oven', price: 349, category_id: categoryMap['Tandoor & Kebabs'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Seekh Kebab', description: 'Minced mutton kebabs with fresh herbs and spices, grilled on skewers', price: 399, category_id: categoryMap['Tandoor & Kebabs'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Malai Tikka', description: 'Creamy chicken tikka marinated in cheese, cream and mild spices', price: 379, category_id: categoryMap['Tandoor & Kebabs'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Tandoori Prawns', description: 'Jumbo prawns marinated in tandoori masala and grilled in clay oven', price: 549, category_id: categoryMap['Tandoor & Kebabs'], is_available: true, created_at: new Date(), updated_at: new Date() },

    // Main Course - Veg
    { id: uuidv4(), name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in rich tomato-butter gravy', price: 319, category_id: categoryMap['Main Course - Veg'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Dal Makhani', description: 'Slow-cooked black lentils in creamy butter gravy', price: 279, category_id: categoryMap['Main Course - Veg'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Palak Paneer', description: 'Fresh spinach puree with cottage cheese cubes', price: 299, category_id: categoryMap['Main Course - Veg'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Aloo Gobi', description: 'Potato and cauliflower cooked with cumin, turmeric and spices', price: 229, category_id: categoryMap['Main Course - Veg'], is_available: true, created_at: new Date(), updated_at: new Date() },

    // Main Course - Non Veg
    { id: uuidv4(), name: 'Butter Chicken', description: 'Tandoori chicken pieces in rich, creamy tomato-butter sauce', price: 379, category_id: categoryMap['Main Course - Non Veg'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Mutton Rogan Josh', description: 'Tender mutton slow-cooked in aromatic Kashmiri spices', price: 449, category_id: categoryMap['Main Course - Non Veg'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Chicken Kadhai', description: 'Chicken cooked with capsicum, tomatoes and kadhai masala', price: 349, category_id: categoryMap['Main Course - Non Veg'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Prawn Masala', description: 'Succulent prawns in a spicy onion-tomato gravy', price: 499, category_id: categoryMap['Main Course - Non Veg'], is_available: true, created_at: new Date(), updated_at: new Date() },

    // Biryani & Rice
    { id: uuidv4(), name: 'Hyderabadi Chicken Biryani', description: 'Fragrant basmati rice layered with spiced chicken and saffron', price: 349, category_id: categoryMap['Biryani & Rice'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Mutton Biryani', description: 'Aromatic basmati rice with tender mutton pieces and whole spices', price: 449, category_id: categoryMap['Biryani & Rice'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Veg Biryani', description: 'Fragrant basmati rice with mixed vegetables and aromatic spices', price: 269, category_id: categoryMap['Biryani & Rice'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Jeera Rice', description: 'Steamed basmati rice tempered with cumin seeds and ghee', price: 169, category_id: categoryMap['Biryani & Rice'], is_available: true, created_at: new Date(), updated_at: new Date() },

    // Breads
    { id: uuidv4(), name: 'Butter Naan', description: 'Soft leavened bread baked in tandoor, brushed with butter', price: 69, category_id: categoryMap['Breads'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Garlic Naan', description: 'Naan bread topped with garlic and fresh coriander', price: 79, category_id: categoryMap['Breads'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Tandoori Roti', description: 'Whole wheat bread baked in clay oven', price: 49, category_id: categoryMap['Breads'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Laccha Paratha', description: 'Layered whole wheat bread with ghee', price: 79, category_id: categoryMap['Breads'], is_available: true, created_at: new Date(), updated_at: new Date() },

    // Desserts
    { id: uuidv4(), name: 'Gulab Jamun (2 pcs)', description: 'Deep-fried milk dumplings soaked in rose-flavored sugar syrup', price: 129, category_id: categoryMap['Desserts'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Rasmalai', description: 'Soft cottage cheese patties in sweetened, saffron-flavored milk', price: 149, category_id: categoryMap['Desserts'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Gajar Ka Halwa', description: 'Grated carrot pudding cooked with milk, ghee and dry fruits', price: 169, category_id: categoryMap['Desserts'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Kulfi', description: 'Traditional Indian ice cream with pistachios and cardamom', price: 119, category_id: categoryMap['Desserts'], is_available: true, created_at: new Date(), updated_at: new Date() },

    // Beverages
    { id: uuidv4(), name: 'Masala Chai', description: 'Traditional Indian spiced tea with milk', price: 49, category_id: categoryMap['Beverages'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Mango Lassi', description: 'Refreshing mango yoghurt drink', price: 129, category_id: categoryMap['Beverages'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Sweet Lassi', description: 'Traditional sweetened yoghurt drink', price: 99, category_id: categoryMap['Beverages'], is_available: true, created_at: new Date(), updated_at: new Date() },
    { id: uuidv4(), name: 'Fresh Lime Soda', description: 'Fresh lime juice with soda water, sweet or salted', price: 79, category_id: categoryMap['Beverages'], is_available: true, created_at: new Date(), updated_at: new Date() }
  ]);
}