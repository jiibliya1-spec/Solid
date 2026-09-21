import type { FoodItem } from '@/types';

export const QUICK_FOODS: FoodItem[] = [
  // -- General staples --
  { name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, serving: '100g', category: 'Protein' },
  { name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, serving: '100g', category: 'Carbs' },
  { name: 'Scrambled Eggs (2)', calories: 180, protein: 12, carbs: 2, fat: 14, fiber: 0, serving: '2 eggs', category: 'Protein' },
  { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, serving: '100g', category: 'Protein' },
  { name: 'Greek Yogurt 0%', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, serving: '100g', category: 'Dairy' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, serving: '1 medium', category: 'Fruits' },
  { name: 'Oats', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, fiber: 10.6, serving: '100g', category: 'Carbs' },
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, serving: '100g', category: 'Vegetables' },
  { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, serving: '100g', category: 'Carbs' },
  { name: 'Whey Protein (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0, serving: '30g', category: 'Protein' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, serving: '100g', category: 'Vegetables' },
  { name: 'Air Fryer Potatoes', calories: 120, protein: 2.5, carbs: 22, fat: 2.5, fiber: 2, serving: '100g', category: 'Carbs' },

  // -- German staples: meat & protein --
  { name: 'Bratwurst (gegrillt)', calories: 297, protein: 13, carbs: 1, fat: 27, fiber: 0, serving: '100g', category: 'Protein' },
  { name: 'Currywurst mit Soße', calories: 250, protein: 11, carbs: 8, fat: 20, fiber: 0.5, serving: '100g', category: 'Protein' },
  { name: 'Döner Kebab', calories: 550, protein: 28, carbs: 45, fat: 28, fiber: 4, serving: '1 ganz', category: 'Protein' },
  { name: 'Schweineschnitzel paniert', calories: 260, protein: 20, carbs: 12, fat: 15, fiber: 0.5, serving: '100g', category: 'Protein' },
  { name: 'Leberkäse', calories: 280, protein: 13, carbs: 2, fat: 25, fiber: 0, serving: '100g', category: 'Protein' },
  { name: 'Frankfurter Würstchen', calories: 280, protein: 11, carbs: 1, fat: 26, fiber: 0, serving: '2 Stück (100g)', category: 'Protein' },
  { name: 'Weißwurst', calories: 210, protein: 8, carbs: 1, fat: 19, fiber: 0, serving: '1 Stück (80g)', category: 'Protein' },
  { name: 'Rinderhackfleisch gebraten', calories: 250, protein: 26, carbs: 0, fat: 17, fiber: 0, serving: '100g', category: 'Protein' },
  { name: 'Räucherlachs', calories: 180, protein: 22, carbs: 0, fat: 10, fiber: 0, serving: '100g', category: 'Protein' },
  { name: 'Linsen (gekocht)', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8, serving: '100g', category: 'Protein' },
  { name: 'Tofu', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, serving: '100g', category: 'Protein' },

  // -- German staples: bread, potatoes & carbs --
  { name: 'Brötchen', calories: 135, protein: 4, carbs: 27, fat: 1, fiber: 1.5, serving: '1 Stück (50g)', category: 'Carbs' },
  { name: 'Vollkornbrot', calories: 120, protein: 4.5, carbs: 20, fat: 1.5, fiber: 4, serving: '1 Scheibe (50g)', category: 'Carbs' },
  { name: 'Schwarzbrot / Pumpernickel', calories: 105, protein: 3, carbs: 20, fat: 0.5, fiber: 4, serving: '1 Scheibe (50g)', category: 'Carbs' },
  { name: 'Brezel', calories: 260, protein: 7, carbs: 50, fat: 2, fiber: 2, serving: '1 Stück (80g)', category: 'Carbs' },
  { name: 'Spätzle (gekocht)', calories: 150, protein: 5.5, carbs: 28, fat: 2, fiber: 1.5, serving: '100g', category: 'Carbs' },
  { name: 'Kartoffeln (gekocht)', calories: 87, protein: 2, carbs: 20, fat: 0.1, fiber: 1.8, serving: '100g', category: 'Carbs' },
  { name: 'Pommes Frites', calories: 312, protein: 3.4, carbs: 41, fat: 15, fiber: 3.6, serving: '100g', category: 'Carbs' },
  { name: 'Nudeln (gekocht)', calories: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8, serving: '100g', category: 'Carbs' },
  { name: 'Knäckebrot', calories: 37, protein: 1, carbs: 7, fat: 0.2, fiber: 1.4, serving: '1 Scheibe (10g)', category: 'Carbs' },
  { name: 'Müsli (ungezuckert)', calories: 360, protein: 10, carbs: 60, fat: 7, fiber: 8, serving: '100g', category: 'Carbs' },
  { name: 'Nutella', calories: 539, protein: 6, carbs: 57, fat: 31, fiber: 3, serving: '100g', category: 'Carbs' },
  { name: 'Haribo Goldbären', calories: 343, protein: 6.9, carbs: 77, fat: 0.5, fiber: 0, serving: '100g', category: 'Carbs' },

  // -- German staples: vegetables --
  { name: 'Sauerkraut', calories: 19, protein: 1, carbs: 4, fat: 0.2, fiber: 2.9, serving: '100g', category: 'Vegetables' },
  { name: 'Spargel (weiß, gekocht)', calories: 18, protein: 2, carbs: 2, fat: 0.2, fiber: 1.8, serving: '100g', category: 'Vegetables' },
  { name: 'Rotkohl (gekocht)', calories: 39, protein: 1.4, carbs: 7, fat: 0.2, fiber: 2.5, serving: '100g', category: 'Vegetables' },
  { name: 'Gurkensalat', calories: 20, protein: 0.7, carbs: 3, fat: 0.5, fiber: 0.7, serving: '100g', category: 'Vegetables' },
  { name: 'Karotten (roh)', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, serving: '100g', category: 'Vegetables' },
  { name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, serving: '100g', category: 'Vegetables' },

  // -- German staples: fruit --
  { name: 'Apfel', calories: 78, protein: 0.4, carbs: 21, fat: 0.3, fiber: 3.6, serving: '1 mittel (150g)', category: 'Fruits' },
  { name: 'Weintrauben', calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, serving: '100g', category: 'Fruits' },
  { name: 'Erdbeeren', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, serving: '100g', category: 'Fruits' },
  { name: 'Birne', calories: 85, protein: 0.6, carbs: 22, fat: 0.2, fiber: 4.3, serving: '1 mittel (150g)', category: 'Fruits' },

  // -- German staples: dairy --
  { name: 'Quark (Magerstufe)', calories: 67, protein: 12, carbs: 4, fat: 0.2, fiber: 0, serving: '100g', category: 'Dairy' },
  { name: 'Buttermilch', calories: 35, protein: 3.3, carbs: 4, fat: 0.5, fiber: 0, serving: '100g', category: 'Dairy' },
  { name: 'Gouda', calories: 356, protein: 25, carbs: 2, fat: 28, fiber: 0, serving: '100g', category: 'Dairy' },
  { name: 'Emmentaler', calories: 380, protein: 28, carbs: 1, fat: 30, fiber: 0, serving: '100g', category: 'Dairy' },
  { name: 'Frischkäse (Doppelrahmstufe)', calories: 300, protein: 6, carbs: 3, fat: 30, fiber: 0, serving: '100g', category: 'Dairy' },
  { name: 'Vollmilch 3,5%', calories: 64, protein: 3.3, carbs: 4.8, fat: 3.5, fiber: 0, serving: '100ml', category: 'Dairy' },
  { name: 'Skyr', calories: 63, protein: 11, carbs: 4, fat: 0.2, fiber: 0, serving: '100g', category: 'Dairy' },
  { name: 'Butter', calories: 72, protein: 0.1, carbs: 0.1, fat: 8, fiber: 0, serving: '1 EL (10g)', category: 'Dairy' },
];
