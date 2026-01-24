import { 
  MenuItem, 
  MenuCategory, 
  CreateMenuItemRequest, 
  UpdateMenuItemRequest,
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest,
  IngredientUsage
} from '../models/MenuItem';
import { PaginationParams, PaginatedResponse } from '../models';
import knex from '../config/database';

export interface MenuItemWithCategory extends MenuItem {
  category: MenuCategory;
}

export interface MenuItemSearchFilters {
  categoryId?: string;
  isAvailable?: boolean;
  priceMin?: number;
  priceMax?: number;
  searchTerm?: string;
}

export class MenuRepository {
  private readonly menuItemsTable = 'menu_items';
  private readonly categoriesTable = 'menu_categories';
  private readonly ingredientsTable = 'menu_item_ingredients';

  // Menu Category Methods
  
  /**
   * Find category by ID
   */
  async findCategoryById(id: string): Promise<MenuCategory | null> {
    const category = await knex(this.categoriesTable)
      .where({ id })
      .first();

    return category ? this.mapDbCategoryToModel(category) : null;
  }

  /**
   * Find all active categories
   */
  async findAllCategories(activeOnly: boolean = true): Promise<MenuCategory[]> {
    let query = knex(this.categoriesTable);
    
    if (activeOnly) {
      query = query.where({ is_active: true });
    }
    
    const categories = await query
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');

    return categories.map(this.mapDbCategoryToModel);
  }

  /**
   * Create a new menu category
   */
  async createCategory(categoryData: CreateMenuCategoryRequest): Promise<MenuCategory> {
    try {
      const [category] = await knex(this.categoriesTable)
        .insert({
          name: categoryData.name,
          description: categoryData.description,
          sort_order: categoryData.sortOrder || 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return this.mapDbCategoryToModel(category);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Category name already exists');
      }
      throw error;
    }
  }

  /**
   * Update menu category
   */
  async updateCategory(id: string, updateData: UpdateMenuCategoryRequest): Promise<MenuCategory | null> {
    try {
      const updateFields: any = {
        updated_at: new Date()
      };

      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.sortOrder !== undefined) updateFields.sort_order = updateData.sortOrder;
      if (updateData.isActive !== undefined) updateFields.is_active = updateData.isActive;

      const [category] = await knex(this.categoriesTable)
        .where({ id })
        .update(updateFields)
        .returning('*');

      return category ? this.mapDbCategoryToModel(category) : null;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Category name already exists');
      }
      throw error;
    }
  }

  /**
   * Delete category (soft delete by setting isActive to false)
   */
  async deleteCategory(id: string): Promise<void> {
    await knex(this.categoriesTable)
      .where({ id })
      .update({
        is_active: false,
        updated_at: new Date()
      });
  }

  /**
   * Check if category name exists
   */
  async categoryNameExists(name: string, excludeId?: string): Promise<boolean> {
    let query = knex(this.categoriesTable)
      .where({ name });

    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }

    const category = await query.first();
    return !!category;
  }

  // Menu Item Methods

  /**
   * Find menu item by ID
   */
  async findMenuItemById(id: string): Promise<MenuItem | null> {
    const item = await knex(this.menuItemsTable)
      .where({ id })
      .first();

    if (!item) return null;

    const ingredients = await this.getMenuItemIngredients(id);
    return this.mapDbMenuItemToModel(item, ingredients);
  }

  /**
   * Find menu item with category by ID
   */
  async findMenuItemWithCategoryById(id: string): Promise<MenuItemWithCategory | null> {
    const result = await knex(this.menuItemsTable)
      .leftJoin(this.categoriesTable, `${this.menuItemsTable}.category_id`, `${this.categoriesTable}.id`)
      .where(`${this.menuItemsTable}.id`, id)
      .select(
        `${this.menuItemsTable}.*`,
        `${this.categoriesTable}.id as category_id`,
        `${this.categoriesTable}.name as category_name`,
        `${this.categoriesTable}.description as category_description`,
        `${this.categoriesTable}.sort_order as category_sort_order`,
        `${this.categoriesTable}.is_active as category_is_active`,
        `${this.categoriesTable}.created_at as category_created_at`,
        `${this.categoriesTable}.updated_at as category_updated_at`
      )
      .first();

    if (!result) return null;

    const ingredients = await this.getMenuItemIngredients(id);
    const menuItem = this.mapDbMenuItemToModel(result, ingredients);
    const category = this.mapDbCategoryToModel({
      id: result.category_id,
      name: result.category_name,
      description: result.category_description,
      sort_order: result.category_sort_order,
      is_active: result.category_is_active,
      created_at: result.category_created_at,
      updated_at: result.category_updated_at
    });

    return { ...menuItem, category };
  }

  /**
   * Find all menu items with optional filters and pagination
   */
  async findMenuItems(
    filters: MenuItemSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<MenuItemWithCategory>> {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const offset = (page - 1) * limit;
    const menuItemsTable = this.menuItemsTable;
    const categoriesTable = this.categoriesTable;

    let query = knex(menuItemsTable)
      .leftJoin(categoriesTable, `${menuItemsTable}.category_id`, `${categoriesTable}.id`)
      .select(
        `${menuItemsTable}.*`,
        `${categoriesTable}.id as category_id`,
        `${categoriesTable}.name as category_name`,
        `${categoriesTable}.description as category_description`,
        `${categoriesTable}.sort_order as category_sort_order`,
        `${categoriesTable}.is_active as category_is_active`,
        `${categoriesTable}.created_at as category_created_at`,
        `${categoriesTable}.updated_at as category_updated_at`
      );

    // Apply filters
    if (filters.categoryId) {
      query = query.where(`${menuItemsTable}.category_id`, filters.categoryId);
    }

    if (filters.isAvailable !== undefined) {
      query = query.where(`${menuItemsTable}.is_available`, filters.isAvailable);
    }

    if (filters.priceMin !== undefined) {
      query = query.where(`${menuItemsTable}.price`, '>=', filters.priceMin);
    }

    if (filters.priceMax !== undefined) {
      query = query.where(`${menuItemsTable}.price`, '<=', filters.priceMax);
    }

    if (filters.searchTerm) {
      query = query.where(function() {
        this.where(`${menuItemsTable}.name`, 'ilike', `%${filters.searchTerm}%`)
          .orWhere(`${menuItemsTable}.description`, 'ilike', `%${filters.searchTerm}%`);
      });
    }

    // Get total count
    const countQuery = query.clone().clearSelect().count('* as count');
    const countResult = await countQuery;
    const total = parseInt((countResult[0] as any).count as string);

    // Apply sorting and pagination
    const validSortFields = ['name', 'price', 'created_at', 'category_name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const actualSortField = sortField === 'category_name' ? `${categoriesTable}.name` : `${menuItemsTable}.${sortField}`;

    const items = await query
      .orderBy(actualSortField, sortOrder)
      .limit(limit)
      .offset(offset);

    // Get ingredients for all items
    const itemsWithIngredients = await Promise.all(
      items.map(async (item) => {
        const ingredients = await this.getMenuItemIngredients(item.id);
        const menuItem = this.mapDbMenuItemToModel(item, ingredients);
        const category = this.mapDbCategoryToModel({
          id: item.category_id,
          name: item.category_name,
          description: item.category_description,
          sort_order: item.category_sort_order,
          is_active: item.category_is_active,
          created_at: item.category_created_at,
          updated_at: item.category_updated_at
        });

        return { ...menuItem, category };
      })
    );

    return {
      data: itemsWithIngredients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new menu item
   */
  async createMenuItem(itemData: CreateMenuItemRequest): Promise<MenuItem> {
    try {
      return await knex.transaction(async (trx) => {
        // Insert menu item
        const [item] = await trx(this.menuItemsTable)
          .insert({
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            category_id: itemData.categoryId,
            is_available: true,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('*');

        // Insert ingredients if provided
        if (itemData.ingredients && itemData.ingredients.length > 0) {
          const ingredientInserts = itemData.ingredients.map(ingredient => ({
            menu_item_id: item.id,
            inventory_item_id: ingredient.inventoryItemId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            created_at: new Date(),
            updated_at: new Date()
          }));

          await trx(this.ingredientsTable).insert(ingredientInserts);
        }

        const ingredients = itemData.ingredients || [];
        return this.mapDbMenuItemToModel(item, ingredients);
      });
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Invalid category ID or inventory item ID');
      }
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Menu item with this name already exists in the category');
      }
      throw error;
    }
  }

  /**
   * Update menu item
   */
  async updateMenuItem(id: string, updateData: UpdateMenuItemRequest): Promise<MenuItem | null> {
    try {
      return await knex.transaction(async (trx) => {
        const updateFields: any = {
          updated_at: new Date()
        };

        if (updateData.name !== undefined) updateFields.name = updateData.name;
        if (updateData.description !== undefined) updateFields.description = updateData.description;
        if (updateData.price !== undefined) updateFields.price = updateData.price;
        if (updateData.categoryId !== undefined) updateFields.category_id = updateData.categoryId;
        if (updateData.isAvailable !== undefined) updateFields.is_available = updateData.isAvailable;

        const [item] = await trx(this.menuItemsTable)
          .where({ id })
          .update(updateFields)
          .returning('*');

        if (!item) return null;

        // Update ingredients if provided
        if (updateData.ingredients !== undefined) {
          // Delete existing ingredients
          await trx(this.ingredientsTable)
            .where({ menu_item_id: id })
            .del();

          // Insert new ingredients
          if (updateData.ingredients.length > 0) {
            const ingredientInserts = updateData.ingredients.map(ingredient => ({
              menu_item_id: id,
              inventory_item_id: ingredient.inventoryItemId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              created_at: new Date(),
              updated_at: new Date()
            }));

            await trx(this.ingredientsTable).insert(ingredientInserts);
          }
        }

        const ingredients = await this.getMenuItemIngredients(id, trx);
        return this.mapDbMenuItemToModel(item, ingredients);
      });
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Invalid category ID or inventory item ID');
      }
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Duplicate ingredient entry for menu item');
      }
      throw error;
    }
  }

  /**
   * Toggle menu item availability
   */
  async toggleAvailability(id: string, isAvailable: boolean): Promise<MenuItem | null> {
    const [item] = await knex(this.menuItemsTable)
      .where({ id })
      .update({
        is_available: isAvailable,
        updated_at: new Date()
      })
      .returning('*');

    if (!item) return null;

    const ingredients = await this.getMenuItemIngredients(id);
    return this.mapDbMenuItemToModel(item, ingredients);
  }

  /**
   * Delete menu item (soft delete by setting isAvailable to false)
   */
  async deleteMenuItem(id: string): Promise<void> {
    await knex(this.menuItemsTable)
      .where({ id })
      .update({
        is_available: false,
        updated_at: new Date()
      });
  }

  /**
   * Hard delete menu item (permanent deletion)
   */
  async hardDeleteMenuItem(id: string): Promise<void> {
    try {
      await knex.transaction(async (trx) => {
        // Check if item is referenced in any orders
        const orderReferences = await trx('order_items')
          .where({ menu_item_id: id })
          .first();

        if (orderReferences) {
          throw new Error('Cannot permanently delete menu item that is referenced in orders');
        }

        // Delete ingredients first
        await trx(this.ingredientsTable)
          .where({ menu_item_id: id })
          .del();

        // Delete menu item
        const deletedRows = await trx(this.menuItemsTable)
          .where({ id })
          .del();

        if (deletedRows === 0) {
          throw new Error('Menu item not found');
        }
      });
    } catch (error: any) {
      if (error.message && error.message.includes('Cannot permanently delete')) {
        throw error;
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Cannot delete menu item that is referenced in other records');
      }
      throw error;
    }
  }

  /**
   * Get menu items by category
   */
  async findMenuItemsByCategory(categoryId: string, availableOnly: boolean = true): Promise<MenuItem[]> {
    let query = knex(this.menuItemsTable)
      .where({ category_id: categoryId });

    if (availableOnly) {
      query = query.where({ is_available: true });
    }

    const items = await query.orderBy('name', 'asc');

    return Promise.all(
      items.map(async (item) => {
        const ingredients = await this.getMenuItemIngredients(item.id);
        return this.mapDbMenuItemToModel(item, ingredients);
      })
    );
  }

  /**
   * Get menu item ingredients
   */
  private async getMenuItemIngredients(menuItemId: string, trx?: any): Promise<IngredientUsage[]> {
    const query = (trx || knex)(this.ingredientsTable)
      .where({ menu_item_id: menuItemId })
      .select('inventory_item_id', 'quantity', 'unit');

    const ingredients = await query;

    return ingredients.map((ingredient: any) => ({
      inventoryItemId: ingredient.inventory_item_id,
      quantity: parseFloat(ingredient.quantity),
      unit: ingredient.unit
    }));
  }

  /**
   * Map database category object to model
   */
  private mapDbCategoryToModel(dbCategory: any): MenuCategory {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      description: dbCategory.description,
      sortOrder: dbCategory.sort_order,
      isActive: dbCategory.is_active,
      createdAt: new Date(dbCategory.created_at),
      updatedAt: new Date(dbCategory.updated_at)
    };
  }

  /**
   * Map database menu item object to model
   */
  private mapDbMenuItemToModel(dbItem: any, ingredients: IngredientUsage[]): MenuItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      description: dbItem.description,
      price: parseFloat(dbItem.price),
      categoryId: dbItem.category_id,
      isAvailable: dbItem.is_available,
      ingredients,
      createdAt: new Date(dbItem.created_at),
      updatedAt: new Date(dbItem.updated_at)
    };
  }
}

// Export singleton instance
export const menuRepository = new MenuRepository();