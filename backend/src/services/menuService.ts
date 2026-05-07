import { 
  MenuItem, 
  MenuCategory, 
  CreateMenuItemRequest, 
  UpdateMenuItemRequest,
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest,
  validateCreateMenuItemRequest,
  validateCreateMenuCategoryRequest,
  validateUpdateMenuItemRequest,
  validateUpdateMenuCategoryRequest
} from '../models/MenuItem';
import { PaginationParams, PaginatedResponse } from '../models';
import { menuRepository, MenuItemWithCategory, MenuItemSearchFilters } from '../repositories/menuRepository';

export class MenuService {
  
  // Category Management Methods

  /**
   * Get all menu categories
   */
  async getCategories(activeOnly: boolean = true): Promise<MenuCategory[]> {
    return menuRepository.findAllCategories(activeOnly);
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<MenuCategory | null> {
    return menuRepository.findCategoryById(id);
  }

  /**
   * Create a new menu category
   */
  async createCategory(categoryData: CreateMenuCategoryRequest): Promise<MenuCategory> {
    // Validate request
    const validationErrors = validateCreateMenuCategoryRequest(categoryData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if category name already exists
    const nameExists = await menuRepository.categoryNameExists(categoryData.name);
    if (nameExists) {
      throw new Error('Category name already exists');
    }

    return menuRepository.createCategory(categoryData);
  }

  /**
   * Update menu category
   */
  async updateCategory(id: string, updateData: UpdateMenuCategoryRequest): Promise<MenuCategory> {
    // Validate request
    const validationErrors = validateUpdateMenuCategoryRequest(updateData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if category exists
    const existingCategory = await menuRepository.findCategoryById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if new name already exists (if name is being updated)
    if (updateData.name && updateData.name !== existingCategory.name) {
      const nameExists = await menuRepository.categoryNameExists(updateData.name, id);
      if (nameExists) {
        throw new Error('Category name already exists');
      }
    }

    const updatedCategory = await menuRepository.updateCategory(id, updateData);
    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }

    return updatedCategory;
  }

  /**
   * Delete menu category (hard delete with cascade)
   */
  async deleteCategory(id: string): Promise<void> {
    // Check if category exists
    const existingCategory = await menuRepository.findCategoryById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if any menu items in this category are referenced in orders
    const menuItems = await menuRepository.findMenuItemsByCategory(id, false);
    const itemsInOrders: string[] = [];
    for (const item of menuItems) {
      const hasOrders = await menuRepository.isMenuItemReferencedInOrders(item.id);
      if (hasOrders) {
        itemsInOrders.push(item.name);
      }
    }

    if (itemsInOrders.length > 0) {
      throw new Error(`Cannot delete category: menu items referenced in orders: ${itemsInOrders.join(', ')}`);
    }

    // Hard delete all menu items in this category, then the category itself
    await menuRepository.hardDeleteCategory(id);
  }

  // Menu Item Management Methods

  /**
   * Get menu items with optional filters and pagination
   */
  async getMenuItems(
    filters: MenuItemSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<MenuItemWithCategory>> {
    return menuRepository.findMenuItems(filters, pagination);
  }

  /**
   * Get menu item by ID
   */
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    return menuRepository.findMenuItemById(id);
  }

  /**
   * Get menu item with category by ID
   */
  async getMenuItemWithCategoryById(id: string): Promise<MenuItemWithCategory | null> {
    return menuRepository.findMenuItemWithCategoryById(id);
  }

  /**
   * Get menu items by category
   */
  async getMenuItemsByCategory(categoryId: string, availableOnly: boolean = true): Promise<MenuItem[]> {
    // Verify category exists
    const category = await menuRepository.findCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    return menuRepository.findMenuItemsByCategory(categoryId, availableOnly);
  }

  /**
   * Create a new menu item
   */
  async createMenuItem(itemData: CreateMenuItemRequest): Promise<MenuItem> {
    // Validate request
    const validationErrors = validateCreateMenuItemRequest(itemData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Verify category exists
    const category = await menuRepository.findCategoryById(itemData.categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Verify category is active
    if (!category.isActive) {
      throw new Error('Cannot add items to inactive category');
    }

    return menuRepository.createMenuItem(itemData);
  }

  /**
   * Update menu item
   */
  async updateMenuItem(id: string, updateData: UpdateMenuItemRequest): Promise<MenuItem> {
    // Validate request
    const validationErrors = validateUpdateMenuItemRequest(updateData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Check if menu item exists
    const existingItem = await menuRepository.findMenuItemById(id);
    if (!existingItem) {
      throw new Error('Menu item not found');
    }

    // Verify category exists if categoryId is being updated
    if (updateData.categoryId) {
      const category = await menuRepository.findCategoryById(updateData.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Verify category is active
      if (!category.isActive) {
        throw new Error('Cannot move item to inactive category');
      }
    }

    const updatedItem = await menuRepository.updateMenuItem(id, updateData);
    if (!updatedItem) {
      throw new Error('Failed to update menu item');
    }

    return updatedItem;
  }

  /**
   * Toggle menu item availability
   */
  async toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
    // Check if menu item exists
    const existingItem = await menuRepository.findMenuItemById(id);
    if (!existingItem) {
      throw new Error('Menu item not found');
    }

    const updatedItem = await menuRepository.toggleAvailability(id, isAvailable);
    if (!updatedItem) {
      throw new Error('Failed to update menu item availability');
    }

    return updatedItem;
  }

  /**
   * Delete menu item.
   * If the item is referenced in any orders, soft-delete it (mark unavailable)
   * so order history is preserved. Otherwise, hard-delete it from the database.
   */
  async deleteMenuItem(id: string): Promise<void> {
    // Check if menu item exists
    const existingItem = await menuRepository.findMenuItemById(id);
    if (!existingItem) {
      throw new Error('Menu item not found');
    }

    const referencedInOrders = await menuRepository.isMenuItemReferencedInOrders(id);
    if (referencedInOrders) {
      await menuRepository.deleteMenuItem(id); // soft delete (is_available = false)
    } else {
      await menuRepository.hardDeleteMenuItem(id);
    }
  }

  /**
   * Permanently delete menu item (hard delete)
   */
  async permanentlyDeleteMenuItem(id: string): Promise<void> {
    // Check if menu item exists
    const existingItem = await menuRepository.findMenuItemById(id);
    if (!existingItem) {
      throw new Error('Menu item not found');
    }

    // TODO: Check if item is referenced in any orders
    // This would require checking order_items table
    // For now, we'll allow hard deletion

    await menuRepository.hardDeleteMenuItem(id);
  }

  /**
   * Search menu items by name or description
   */
  async searchMenuItems(
    searchTerm: string, 
    filters: Omit<MenuItemSearchFilters, 'searchTerm'> = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<MenuItemWithCategory>> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    const searchFilters: MenuItemSearchFilters = {
      ...filters,
      searchTerm: searchTerm.trim()
    };

    return menuRepository.findMenuItems(searchFilters, pagination);
  }

  /**
   * Get menu organized by categories
   */
  async getMenuByCategories(availableOnly: boolean = true): Promise<Array<MenuCategory & { items: MenuItem[] }>> {
    const categories = await menuRepository.findAllCategories(true); // Only active categories
    
    const menuByCategories = await Promise.all(
      categories.map(async (category) => {
        const items = await menuRepository.findMenuItemsByCategory(category.id, availableOnly);
        return {
          ...category,
          items
        };
      })
    );

    // Filter out categories with no items if availableOnly is true
    if (availableOnly) {
      return menuByCategories.filter(category => category.items.length > 0);
    }

    return menuByCategories;
  }

  /**
   * Get menu statistics
   */
  async getMenuStatistics(): Promise<{
    totalCategories: number;
    activeCategories: number;
    totalMenuItems: number;
    availableMenuItems: number;
    unavailableMenuItems: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
  }> {
    const allCategories = await menuRepository.findAllCategories(false);
    const activeCategories = allCategories.filter(cat => cat.isActive);
    
    const allItems = await menuRepository.findMenuItems({}, { limit: 10000 }); // Get all items
    const availableItems = allItems.data.filter(item => item.isAvailable);
    const unavailableItems = allItems.data.filter(item => !item.isAvailable);
    
    const prices = allItems.data.map(item => item.price);
    const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      totalCategories: allCategories.length,
      activeCategories: activeCategories.length,
      totalMenuItems: allItems.data.length,
      availableMenuItems: availableItems.length,
      unavailableMenuItems: unavailableItems.length,
      averagePrice: Math.round(averagePrice * 100) / 100, // Round to 2 decimal places
      priceRange: {
        min: minPrice,
        max: maxPrice
      }
    };
  }

  /**
   * Activate menu category
   */
  async activateCategory(id: string): Promise<MenuCategory> {
    const category = await menuRepository.findCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    const updated = await menuRepository.updateCategory(id, { isActive: true });
    if (!updated) {
      throw new Error('Failed to activate category');
    }

    return updated;
  }

  /**
   * Deactivate menu category
   */
  async deactivateCategory(id: string): Promise<MenuCategory> {
    const category = await menuRepository.findCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    const updated = await menuRepository.updateCategory(id, { isActive: false });
    if (!updated) {
      throw new Error('Failed to deactivate category');
    }

    return updated;
  }

  /**
   * Activate menu item
   */
  async activateMenuItem(id: string): Promise<MenuItem> {
    const item = await menuRepository.findMenuItemById(id);
    if (!item) {
      throw new Error('Menu item not found');
    }

    const updated = await menuRepository.updateMenuItem(id, { isAvailable: true });
    if (!updated) {
      throw new Error('Failed to activate menu item');
    }

    return updated;
  }

  /**
   * Deactivate menu item
   */
  async deactivateMenuItem(id: string): Promise<MenuItem> {
    const item = await menuRepository.findMenuItemById(id);
    if (!item) {
      throw new Error('Menu item not found');
    }

    const updated = await menuRepository.updateMenuItem(id, { isAvailable: false });
    if (!updated) {
      throw new Error('Failed to deactivate menu item');
    }

    return updated;
  }
}

// Export singleton instance
export const menuService = new MenuService();