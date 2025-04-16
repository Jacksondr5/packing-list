-- Custom SQL migration file, put your code below! ---- Seed data for predefined tags
-- These tags are used for rule-based logic in the packing list generation

-- Trip Type Tags
INSERT INTO "packing-list_tag" ("id", "name") VALUES
(1, 'Trip Type: Business'),
(2, 'Trip Type: Personal');

-- Weather Condition Tags
INSERT INTO "packing-list_tag" ("id", "name") VALUES
(3, 'Weather: Warm'),
(4, 'Weather: Cold'),
(5, 'Weather: Rain'),
(6, 'Weather: Any');

-- Duration Tags
INSERT INTO "packing-list_tag" ("id", "name") VALUES
(7, 'Duration: Base'),
(8, 'Duration: Per Day');

-- Travel Mode Tags
INSERT INTO "packing-list_tag" ("id", "name") VALUES
(9, 'Travel Mode: Carry-on'),
(10, 'Travel Mode: Checked Bag'),
(11, 'Travel Mode: Car'),
(12, 'Travel Mode: Train');

-- Add some common clothing categories (optional)
INSERT INTO "packing-list_category" ("id", "name") VALUES
(1, 'Clothing'),
(2, 'Toiletries'),
(3, 'Electronics'),
(4, 'Documents');