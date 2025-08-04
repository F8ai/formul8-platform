-- Cannabis formulation ingredients database
-- Comprehensive ingredient list with density and manufacturer data

-- Cannabinoid extracts
INSERT INTO ingredients (name, category, subcategory, potency, unit, cost_per_unit, supplier, density, manufacturers, description) VALUES
('CBD Isolate', 'cannabinoid', 'isolate', 99.0, 'g', 12.50, 'Extract Labs', 0.95, '["Extract Labs", "Isolate Direct", "Pure Extract", "CBD Foundry"]', 'Pure CBD crystalline isolate, 99%+ purity'),
('THC Distillate', 'cannabinoid', 'distillate', 85.0, 'g', 18.75, 'Clear Concentrates', 0.98, '["Clear Concentrates", "Pure Vape", "Distillate Direct", "Golden State Extracts"]', 'High-purity THC distillate for precise dosing'),
('Full Spectrum Extract', 'cannabinoid', 'full-spectrum', 75.0, 'g', 25.00, 'Whole Plant Labs', 0.92, '["Whole Plant Labs", "Full Spectrum Co", "Entourage Extracts", "Natural Cannabis"]', 'Full-spectrum cannabis extract with natural terpene profile'),
('CBG Isolate', 'cannabinoid', 'isolate', 98.0, 'g', 35.00, 'Rare Cannabinoid Co', 0.94, '["Rare Cannabinoid Co", "CBG Labs", "Minor Cannabinoids Inc"]', 'Pure CBG isolate for focus and alertness'),
('CBN Isolate', 'cannabinoid', 'isolate', 97.0, 'g', 45.00, 'Sleep Labs', 0.96, '["Sleep Labs", "CBN Direct", "Rare Cannabinoid Co"]', 'Pure CBN isolate for sleep and relaxation'),

-- Carrier oils
INSERT INTO ingredients (name, category, subcategory, potency, unit, cost_per_unit, supplier, density, manufacturers, description) VALUES
('MCT Oil (C8/C10)', 'carrier', 'oil', 95.0, 'ml', 0.25, 'Bulk Apothecary', 0.915, '["Bulk Apothecary", "NOW Foods", "Sports Research", "Perfect Keto"]', 'Medium-chain triglyceride oil, optimal for bioavailability'),
('Olive Oil (Extra Virgin)', 'carrier', 'oil', 90.0, 'ml', 0.18, 'Spectrum Organics', 0.915, '["Spectrum Organics", "California Olive Ranch", "Cobram Estate"]', 'High-quality extra virgin olive oil'),
('Coconut Oil (Fractionated)', 'carrier', 'oil', 92.0, 'ml', 0.22, 'Majestic Pure', 0.925, '["Majestic Pure", "NOW Foods", "Sky Organics", "Viva Naturals"]', 'Fractionated coconut oil, liquid at room temperature'),
('Sesame Oil', 'carrier', 'oil', 88.0, 'ml', 0.35, 'Kadoya', 0.92, '["Kadoya", "Spectrum Organics", "La Tourangelle"]', 'Traditional carrier oil with mild nutty flavor'),
('Grapeseed Oil', 'carrier', 'oil', 85.0, 'ml', 0.28, 'La Tourangelle', 0.92, '["La Tourangelle", "Spectrum Organics", "NOW Foods"]', 'Light, neutral-tasting carrier oil'),

-- Terpenes
INSERT INTO ingredients (name, category, subcategory, potency, unit, cost_per_unit, supplier, density, manufacturers, description) VALUES
('Myrcene', 'terpene', 'monoterpene', 95.0, 'ml', 45.00, 'True Terpenes', 0.841, '["True Terpenes", "Abstrax", "Floraplex", "Peak Supply Co"]', 'Sedating terpene found in mangoes and cannabis'),
('Limonene', 'terpene', 'monoterpene', 92.0, 'ml', 38.00, 'True Terpenes', 0.841, '["True Terpenes", "Abstrax", "Floraplex", "Peak Supply Co"]', 'Uplifting citrus terpene for mood enhancement'),
('Pinene (Alpha)', 'terpene', 'monoterpene', 90.0, 'ml', 42.00, 'Abstrax', 0.858, '["Abstrax", "True Terpenes", "Floraplex", "Peak Supply Co"]', 'Pine-scented terpene for alertness and memory'),
('Linalool', 'terpene', 'monoterpene', 88.0, 'ml', 55.00, 'Floraplex', 0.862, '["Floraplex", "True Terpenes", "Abstrax", "Peak Supply Co"]', 'Floral terpene with calming lavender aroma'),
('Caryophyllene (Beta)', 'terpene', 'sesquiterpene', 85.0, 'ml', 48.00, 'Peak Supply Co', 0.905, '["Peak Supply Co", "True Terpenes", "Abstrax", "Floraplex"]', 'Spicy terpene that binds to CB2 receptors'),
('Humulene', 'terpene', 'sesquiterpene', 82.0, 'ml', 52.00, 'True Terpenes', 0.889, '["True Terpenes", "Abstrax", "Floraplex", "Peak Supply Co"]', 'Earthy hops terpene with anti-inflammatory properties'),

-- Natural flavorings
INSERT INTO ingredients (name, category, subcategory, potency, unit, cost_per_unit, supplier, density, manufacturers, description) VALUES
('Orange Essential Oil', 'flavoring', 'natural', 85.0, 'ml', 2.25, 'doTERRA', 0.842, '["doTERRA", "Young Living", "Plant Therapy", "Rocky Mountain Oils"]', 'Natural orange flavoring from citrus peels'),
('Vanilla Extract (Natural)', 'flavoring', 'natural', 35.0, 'ml', 3.50, 'Nielsen-Massey', 1.05, '["Nielsen-Massey", "Simply Organic", "Frontier Co-op"]', 'Pure vanilla extract for sweet formulations'),
('Peppermint Essential Oil', 'flavoring', 'natural', 80.0, 'ml', 2.80, 'Plant Therapy', 0.9, '["Plant Therapy", "doTERRA", "Young Living", "Rocky Mountain Oils"]', 'Cooling peppermint for topicals and edibles'),
('Lemon Essential Oil', 'flavoring', 'natural', 90.0, 'ml', 2.15, 'Rocky Mountain Oils', 0.85, '["Rocky Mountain Oils", "Plant Therapy", "doTERRA", "Young Living"]', 'Bright citrus flavoring'),
('Cinnamon Bark Oil', 'flavoring', 'natural', 75.0, 'ml', 4.20, 'Young Living', 1.01, '["Young Living", "doTERRA", "Plant Therapy", "Rocky Mountain Oils"]', 'Warm spice flavoring for winter formulations'),

-- Emulsifiers and stabilizers  
INSERT INTO ingredients (name, category, subcategory, potency, unit, cost_per_unit, supplier, density, manufacturers, description) VALUES
('Lecithin (Sunflower)', 'emulsifier', 'natural', 95.0, 'g', 0.85, 'NOW Foods', 0.98, '["NOW Foods", "Bulk Supplements", "Swanson", "Nature''s Way"]', 'Natural emulsifier for water-oil stability'),
('Polysorbate 80', 'emulsifier', 'synthetic', 98.0, 'ml', 1.25, 'Making Cosmetics', 1.06, '["Making Cosmetics", "Lotioncrafter", "Essential Depot"]', 'Food-grade emulsifier for nano-emulsions'),
('Vegetable Glycerin', 'stabilizer', 'natural', 99.5, 'ml', 0.45, 'Essential Depot', 1.26, '["Essential Depot", "Bulk Apothecary", "NOW Foods", "Sky Organics"]', 'Natural humectant and sweetener'),

-- Preservatives (natural)
INSERT INTO ingredients (name, category, subcategory, potency, unit, cost_per_unit, supplier, density, manufacturers, description) VALUES
('Vitamin E Oil (Tocopherol)', 'preservative', 'natural', 70.0, 'ml', 1.80, 'NOW Foods', 0.95, '["NOW Foods", "Bulk Supplements", "Heritage Store", "Life-flo"]', 'Natural antioxidant to prevent rancidity'),
('Rosemary Extract', 'preservative', 'natural', 20.0, 'ml', 3.25, 'Kemin Industries', 0.92, '["Kemin Industries", "Naturex", "Kalsec"]', 'Natural preservative with antioxidant properties');