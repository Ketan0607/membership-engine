CREATE DATABASE IF NOT EXISTS membership_engine;
USE membership_engine;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','member') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL,
  tier_level INT NOT NULL,
  description TEXT
);

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active','expired','cancelled') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE protected_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  description TEXT,
  required_tier INT NOT NULL
);

-- Default Admin (password: Admin@123)
INSERT INTO users (full_name,email,password,role)
VALUES ('Super Admin','admin@site.com',
'$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin');

-- Sample Plans
INSERT INTO plans (name,price,duration_days,tier_level,description) VALUES
('Basic', 499, 30, 1, 'Access to basic content'),
('Pro', 999, 30, 2, 'Access to pro content'),
('Premium', 1999, 30, 3, 'Access to all content');

-- Sample Content
INSERT INTO protected_content (title,description,required_tier) VALUES
('Basic Course','Introductory material about our platform.',1),
('Intermediate Tutorials','Deeper dive into topics.',1),
('Pro Course','Advanced lessons and techniques.',2),
('1-on-1 Mentoring VODs','Recorded mentoring sessions.',2),
('Premium Masterclass','Exclusive content and secret strategies.',3),
('Live Event Archives','Access to all past live webinar recordings.',3);
