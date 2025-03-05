-- Lookup Tables
CREATE TABLE lookup_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- order_status, provider_status, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lookup_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    orders INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add after other lookup tables
CREATE TABLE lookup_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    desc_en TEXT,
    desc_ar TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name_en (name_en),
    INDEX idx_name_ar (name_ar)
);

-- Core Tables
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255),
    device_token VARCHAR(255),
    provider_id INT,
    role ENUM('user', 'provider','staff', 'admin') DEFAULT 'user',
    rating DECIMAL(2,1) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    language VARCHAR(10) DEFAULT 'en',
    is_active TINYINT(1) DEFAULT 1,
    gender ENUM('male', 'female', 'other') DEFAULT 'other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT(1) DEFAULT 0,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_gender (gender),
    INDEX idx_rating (rating),
    INDEX idx_provider_id (provider_id),
    INDEX idx_total_ratings (total_ratings),
    INDEX idx_is_active (is_active),
    INDEX idx_deleted (deleted)
);

CREATE TABLE user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL, -- home, work, etc.
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_addresses (user_id),
    INDEX idx_is_default (is_default),
);

CREATE TABLE providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    completed_bookings INT DEFAULT 0,
    open_time TIME,
    close_time TIME,
    has_products TINYINT(1) DEFAULT 0,
    has_services TINYINT(1) DEFAULT 0,
    number_of_products INT DEFAULT 0,
    status_id INT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT(1) DEFAULT 0,

    INDEX idx_rating (rating),
    INDEX idx_status (status_id),
    INDEX idx_has_products (has_products),
    INDEX idx_has_services (has_services),
    INDEX idx_name (name),
    INDEX idx_deleted (deleted),
    SPATIAL INDEX idx_location (latitude, longitude)
);

CREATE TABLE provider_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_provider_cat (provider_id, category_id)
);

CREATE TABLE provider_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    service_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration INT, -- in minutes
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INT,
    INDEX idx_provider_services (provider_id, service_id),
    INDEX idx_is_active (is_active),
    INDEX idx_provider_id (provider_id)
);

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INT, -- in minutes
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_provider_services (provider_id)
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    category_id INT NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    badge VARCHAR(20), -- Popular, New, etc.
    stock INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    provider_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT(1) DEFAULT 0,
    deleted_by_user_id INT,
    INDEX idx_category (category_id),
    INDEX idx_title (title),
    INDEX idx_rating (rating),
    INDEX idx_is_active (is_active),
    INDEX idx_deleted (deleted),
    INDEX idx_provider_id (provider_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    status_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    address_id INT NOT NULL,
    scheduled_at DATETIME,
    payment_method VARCHAR(20),
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    order_type ENUM('product', 'service') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled TINYINT(1) DEFAULT 0,
    cancelled_at TIMESTAMP,
    INDEX idx_user_orders (user_id),
    INDEX idx_provider_orders (provider_id),
    INDEX idx_order_status (status_id),
    INDEX idx_order_type (order_type),
    INDEX idx_cancelled (cancelled),
    INDEX idx_cancelled_at (cancelled_at)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    service_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_items (order_id)
);

CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    provider_id INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_ratings (user_id),
    INDEX idx_provider_ratings (provider_id)
);

-- Sample data for lookup_status
INSERT INTO lookup_status (code, name, type) VALUES
('PENDING', 'Pending', 'order_status'),
('CONFIRMED', 'Confirmed', 'order_status'),
('IN_PROGRESS', 'In Progress', 'order_status'),
('COMPLETED', 'Completed', 'order_status'),
('CANCELLED', 'Cancelled', 'order_status'),
('OPEN', 'Open', 'provider_status'),
('CLOSED', 'Closed', 'provider_status'),
('BUSY', 'Busy', 'provider_status');

-- Sample data for lookup_categories
INSERT INTO lookup_categories (name, description, icon, orders) VALUES
('Grooming', 'Professional pet grooming services including bathing, haircuts, and styling', 'cut-outline', 0),
('Veterinary', 'Medical care and health services for your pets', 'medical-outline', 0),
('Training', 'Professional pet training and behavior modification services', 'school-outline', 0),
('Daycare', 'Safe and fun daycare services for your pets', 'home-outline', 0),
('Food', 'High-quality pet food and nutritional products', 'nutrition-outline', 0),
('Accessories', 'Pet accessories, toys, and equipment', 'paw-outline', 0);

-- Insert sample services data
INSERT INTO lookup_services (name_en, name_ar, desc_en, desc_ar) VALUES
-- Grooming Services
('Full Grooming', 'تنظيف شامل', 'Complete grooming package including bath, haircut, nail trimming, and ear cleaning', 'حزمة تنظيف كاملة تشمل الاستحمام وقص الشعر وتقليم الأظافر وتنظيف الأذن'),
('Bath & Brush', 'استحمام وتمشيط', 'Basic bath service with brushing and blow dry', 'خدمة استحمام أساسية مع التمشيط والتجفيف'),
('Nail Trimming', 'تقليم الأظافر', 'Professional nail trimming service', 'خدمة تقليم الأظافر الاحترافية'),
('Teeth Cleaning', 'تنظيف الأسنان', 'Dental hygiene service for pets', 'خدمة نظافة الأسنان للحيوانات الأليفة'),
('Spa Package', 'باقة السبا', 'Luxury grooming package with special treatments', 'باقة تنظيف فاخرة مع علاجات خاصة'),

-- Veterinary Services
('General Checkup', 'فحص عام', 'Routine health examination and assessment', 'فحص صحي روتيني وتقييم'),
('Vaccination', 'تطعيم', 'Essential pet vaccinations and immunizations', 'التطعيمات الأساسية والتحصينات للحيوانات الأليفة'),
('Dental Care', 'رعاية الأسنان', 'Professional dental examination and treatment', 'فحص وعلاج الأسنان الاحترافي'),
('Surgery', 'جراحة', 'Various surgical procedures for pets', 'إجراءات جراحية متنوعة للحيوانات الأليفة'),
('Emergency Care', 'رعاية طارئة', '24/7 emergency veterinary services', 'خدمات بيطرية طارئة على مدار الساعة'),

-- Training Services
('Basic Training', 'تدريب أساسي', 'Essential obedience and behavior training', 'تدريب أساسي على الطاعة والسلوك'),
('Advanced Training', 'تدريب متقدم', 'Advanced behavior modification and tricks', 'تعديل السلوك المتقدم والحيل'),
('Puppy Training', 'تدريب الجراء', 'Early development training for puppies', 'تدريب التطور المبكر للجراء'),
('Agility Training', 'تدريب الرشاقة', 'Physical activity and obstacle course training', 'تدريب النشاط البدني واجتياز العقبات'),
('Behavioral Therapy', 'علاج سلوكي', 'Professional behavior modification therapy', 'علاج تعديل السلوك الاحترافي'),

-- Daycare Services
('Full Day Care', 'رعاية يوم كامل', 'Full day supervision and activities', 'إشراف وأنشطة ليوم كامل'),
('Half Day Care', 'رعاية نصف يوم', 'Half day supervision and activities', 'إشراف وأنشطة لنصف يوم'),
('Overnight Boarding', 'مبيت ليلي', 'Overnight pet boarding and care', 'مبيت ورعاية ليلية للحيوانات الأليفة'),
('Weekend Package', 'باقة نهاية الأسبوع', 'Weekend boarding with special activities', 'مبيت نهاية الأسبوع مع أنشطة خاصة'),
('Play Group', 'مجموعة اللعب', 'Supervised group play sessions', 'جلسات لعب جماعية تحت الإشراف'),

-- Additional Services
('Pet Taxi', 'تاكسي الحيوانات', 'Pet pickup and delivery service', 'خدمة توصيل واستلام الحيوانات الأليفة'),
('Pet Photography', 'تصوير الحيوانات', 'Professional pet photography sessions', 'جلسات تصوير احترافية للحيوانات الأليفة'),
('Microchipping', 'زرع شريحة', 'Pet identification microchipping service', 'خدمة زرع شريحة تعريف للحيوانات الأليفة'),
('Nutrition Consultation', 'استشارة تغذية', 'Professional pet nutrition consultation', 'استشارة تغذية احترافية للحيوانات الأليفة'),
('Health Insurance', 'تأمين صحي', 'Pet health insurance services', 'خدمات التأمين الصحي للحيوانات الأليفة');

-- Dog Vaccinations
INSERT INTO lookup_services (name_en, name_ar, desc_en, desc_ar) VALUES
('Puppy Core Vaccines', 'تطعيمات الجراء الأساسية', 'Essential vaccines for puppies (6-8 weeks): Distemper, Parvovirus, Adenovirus', 'التطعيمات الأساسية للجراء (6-8 أسابيع): داء الكلب، بارفو، أدينو فيروس'),
('Puppy Booster Shots', 'تطعيمات الجراء المعززة', 'Booster shots for puppies (10-12 weeks): DHPP, Rabies', 'جرعات معززة للجراء (10-12 أسبوعًا): دي إتش بي بي، داء الكلب'),
('Adult Dog Annual Vaccines', 'تطعيمات الكلاب السنوية', 'Annual vaccinations for adult dogs: DHPP, Rabies, Bordetella', 'التطعيمات السنوية للكلاب البالغة: دي إتش بي بي، داء الكلب، بورديتيلا'),
('Dog Lifestyle Vaccines', 'تطعيمات نمط حياة الكلاب', 'Optional vaccines based on lifestyle: Lyme, Leptospirosis, Influenza', 'تطعيمات اختيارية حسب نمط الحياة: لايم، ليبتوسبيروسيس، إنفلونزا'),

-- Cat Vaccinations
('Kitten Core Vaccines', 'تطعيمات القطط الأساسية', 'Essential vaccines for kittens (6-8 weeks): FVRCP (Rhinotracheitis, Calicivirus, Panleukopenia)', 'التطعيمات الأساسية للقطط (6-8 أسابيع): إف في آر سي بي'),
('Kitten Booster Shots', 'تطعيمات القطط المعززة', 'Booster shots for kittens (10-12 weeks): FVRCP, FeLV', 'جرعات معززة للقطط (10-12 أسبوعًا): إف في آر سي بي، فيلف'),
('Adult Cat Annual Vaccines', 'تطعيمات القطط السنوية', 'Annual vaccinations for adult cats: FVRCP, Rabies', 'التطعيمات السنوية للقطط البالغة: إف في آر سي بي، داء الكلب'),
('Indoor Cat Vaccines', 'تطعيمات القطط المنزلية', 'Core vaccines for indoor cats: FVRCP, Rabies', 'التطعيمات الأساسية للقطط المنزلية: إف في آر سي بي، داء الكلب'),
('Outdoor Cat Vaccines', 'تطعيمات القطط الخارجية', 'Additional vaccines for outdoor cats: FeLV, FIV', 'تطعيمات إضافية للقطط الخارجية: فيلف، فيف');

-- Add a new lookup table for vaccination schedules
CREATE TABLE lookup_vaccination_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    pet_type ENUM('dog', 'cat') NOT NULL,
    age_range VARCHAR(50) NOT NULL,
    vaccine_name_en VARCHAR(100) NOT NULL,
    vaccine_name_ar VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    notes_en TEXT,
    notes_ar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_id (service_id),
    INDEX idx_pet_type (pet_type)
);

-- Insert vaccination schedules
INSERT INTO lookup_vaccination_schedules (service_id, pet_type, age_range, vaccine_name_en, vaccine_name_ar, frequency, notes_en, notes_ar) VALUES
-- Dog Vaccination Schedule
(1, 'dog', '6-8 weeks', 'Distemper + Parvovirus', 'داء الكلب + بارفو', 'First dose', 'Core vaccine for all puppies', 'تطعيم أساسي لجميع الجراء'),
(1, 'dog', '10-12 weeks', 'DHPP', 'دي إتش بي بي', 'Second dose', 'Combined vaccine including Distemper, Hepatitis, Parainfluenza, Parvovirus', 'لقاح مركب يشمل داء الكلب والتهاب الكبد وبارافلونزا وبارفو'),
(1, 'dog', '14-16 weeks', 'Rabies', 'داء الكلب', 'Single dose', 'Required by law in most areas', 'مطلوب قانونياً في معظم المناطق'),
(1, 'dog', '1 year', 'DHPP + Rabies', 'دي إتش بي بي + داء الكلب', 'Booster', 'First annual booster', 'التعزيز السنوي الأول'),

-- Cat Vaccination Schedule
(5, 'cat', '6-8 weeks', 'FVRCP', 'إف في آر سي بي', 'First dose', 'Core vaccine for all kittens', 'تطعيم أساسي لجميع القطط الصغيرة'),
(5, 'cat', '10-12 weeks', 'FVRCP + FeLV', 'إف في آر سي بي + فيلف', 'Second dose', 'Combined vaccine plus Feline Leukemia for at-risk cats', 'لقاح مركب بالإضافة إلى لوكيميا القطط للقطط المعرضة للخطر'),
(5, 'cat', '14-16 weeks', 'Rabies', 'داء الكلب', 'Single dose', 'Required by law in most areas', 'مطلوب قانونياً في معظم المناطق'),
(5, 'cat', '1 year', 'FVRCP + Rabies', 'إف في آر سي بي + داء الكلب', 'Booster', 'First annual booster', 'التعزيز السنوي الأول'); 