-- Seed Data for Dental Lab Management Platform

-- Note: Using hardcoded UUIDs for easy local testing and relation mapping.

-- Lab Profiles
INSERT INTO public.lab_profiles (id, name, rating, reviews_count, services, pricing, turnaround_time, contact_email, contact_phone) VALUES
('33333333-3333-3333-3333-333333333333', 'Advance Dental Export', 4.8, 124, '{"Crown & Bridge", "Implants", "Removables", "Orthodontics"}', '$$', '5-7 Business Days', 'info@precisiondental.com', '(555) 123-4567'),
('44444444-4444-4444-4444-444444444444', 'Kanpur Dental Lab', 4.9, 89, '{"High-End Ceramics", "Veneers", "Digital Smile Design"}', '$$$', '7-10 Business Days', 'hello@apexaesthetics.com', '(555) 987-6543'),
('55555555-5555-5555-5555-555555555555', 'Vaishali Dental Lab', 4.5, 210, '{"Zirconia Copings", "Custom Abutments", "Surgical Guides"}', '$', '2-3 Business Days', 'milling@swiftdental.com', '(555) 246-8101');

-- Users
INSERT INTO public.users (id, name, role, lab_id, avatar_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Dr. Maneesh Vishnoi', 'DENTIST', NULL, 'https://i.pravatar.cc/150?u=u1'),
('22222222-2222-2222-2222-222222222222', 'Advance Dental Export', 'LAB_ADMIN', '33333333-3333-3333-3333-333333333333', 'https://i.pravatar.cc/150?u=u2');

-- Cases
INSERT INTO public.cases (id, patient_name, dentist_id, lab_id, status, urgency, requested_treatment, material, created_at, due_date) VALUES
('66666666-6666-6666-6666-666666666661', 'Rahul Sharma', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'IN_PROGRESS', 'HIGH', 'Zirconia Crown (Tooth 14)', 'Zirconia HT', '2026-06-10T10:00:00Z', '2026-06-20T10:00:00Z'),
('66666666-6666-6666-6666-666666666662', 'Priya Singh', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'QUALITY_CHECK', 'NORMAL', 'Lower Arch Nightguard', 'Acrylic Resin', '2026-06-08T09:30:00Z', '2026-06-18T10:00:00Z'),
('66666666-6666-6666-6666-666666666663', 'Amit Patel', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'PENDING', 'URGENT', 'Porcelain Veneers (Teeth 8,9)', 'E.max CAD Shade A1', '2026-06-14T08:00:00Z', '2026-06-28T10:00:00Z'),
('66666666-6666-6666-6666-666666666664', 'Neha Gupta', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'DELIVERED', 'LOW', 'Implant Abutment (Tooth 30)', 'Titanium', '2026-05-25T14:20:00Z', '2026-06-05T10:00:00Z');

-- Timeline Events
INSERT INTO public.timeline_events (case_id, status_update, notes, "timestamp", visibility) VALUES
('66666666-6666-6666-6666-666666666661', 'Pending review', 'Case submitted with digital impressions', '2026-06-10T10:00:00Z', 'BOTH'),
('66666666-6666-6666-6666-666666666661', 'In Progress', 'Case accepted and is taking form.', '2026-06-11T14:30:00Z', 'EXTERNAL'),
('66666666-6666-6666-6666-666666666661', 'Milling Started', 'Assigned to Designer: John. Exocad design approved. Started milling.', '2026-06-11T14:30:00Z', 'INTERNAL'),
('66666666-6666-6666-6666-666666666662', 'Pending review', 'Case submitted', '2026-06-08T09:30:00Z', 'BOTH'),
('66666666-6666-6666-6666-666666666662', 'In Progress', 'Fabricating model and vacuforming nightguard.', '2026-06-09T11:00:00Z', 'BOTH'),
('66666666-6666-6666-6666-666666666662', 'QUALITY CHECK', 'Evaluating fit and margins on articulator.', '2026-06-13T16:15:00Z', 'INTERNAL'),
('66666666-6666-6666-6666-666666666664', 'PENDING', 'Case submitted with intraoral scans.', '2026-05-25T14:20:00Z', 'BOTH'),
('66666666-6666-6666-6666-666666666664', 'In Progress', 'Work has begun on the implant abutment.', '2026-05-27T09:15:00Z', 'EXTERNAL'),
('66666666-6666-6666-6666-666666666664', 'Ceramics Completed', 'Custom abutment design and milling complete. Ceramics applied.', '2026-05-27T09:15:00Z', 'INTERNAL'),
('66666666-6666-6666-6666-666666666664', 'Dispatched', 'Shipped via overnight courier. Tracking #123456789', '2026-06-03T16:45:00Z', 'BOTH'),
('66666666-6666-6666-6666-666666666664', 'Delivered', 'Case delivered to clinic and signed by receptionist.', '2026-06-04T10:30:00Z', 'BOTH'),
('66666666-6666-6666-6666-666666666663', 'PENDING', 'Case submitted with digital impressions', '2026-06-14T08:00:00Z', 'BOTH');

-- Inventory Items
INSERT INTO public.inventory_items (lab_id, name, category, quantity, threshold, unit) VALUES
('33333333-3333-3333-3333-333333333333', 'Zirconia HT Disc 98mm', 'Milling Discs', 15, 5, 'discs'),
('33333333-3333-3333-3333-333333333333', 'E.max CAD Shade A1', 'Blocks', 2, 10, 'blocks'),
('33333333-3333-3333-3333-333333333333', 'Clear Aligner Resin 1kg', '3D Printing', 8, 3, 'bottles'),
('33333333-3333-3333-3333-333333333333', 'Alginate Impression Material', 'Supplies', 24, 10, 'bags');
