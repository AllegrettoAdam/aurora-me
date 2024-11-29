-- Insert dummy users with bcrypt hashed passwords
INSERT INTO users (img, username, email, password) VALUES
-- test user, username: test pass: 123456
('https://example.com/avatar3.jpg', 'test', 'test@email.com', '$2a$10$8PHnwkKe486Uf0cbGTUTpOQertJMpznWTs2m1RaGMNH3b7kf63PjC'),

('https://example.com/avatar1.jpg', 'aurora_hunter', 'hunter@email.com', '$2a$10$6KqJe9pOhkd0TyEjguaK8eOHzwOuBxYgMQpYsKaVOG7bHI31eYgEW'),
('https://example.com/avatar2.jpg', 'night_sky', 'sky@email.com', '$2a$10$6KqJe9pOhkd0TyEjguaK8eOHzwOuBxYgMQpYsKaVOG7bHI31eYgEW'),
('https://example.com/avatar3.jpg', 'polar_lights', 'lights@email.com', '$2a$10$6KqJe9pOhkd0TyEjguaK8eOHzwOuBxYgMQpYsKaVOG7bHI31eYgEW');

-- Insert dummy posts
INSERT INTO posts (img, text, user_id) VALUES
('https://sevennaturalwonders.org/wp-content/uploads/2023/11/Aurora-Borealis-with-snow.jpg', 'Amazing aurora display tonight!',1),
('https://cdn.mos.cms.futurecdn.net/6RUWb9NLBGA8v4oQtDgbAL.jpg', 'Green lights dancing in the sky', 1),
('https://images.axios.com/FqNtFyt24VdZ25W6-aylShIcv9U=/332x0:4231x3899/1600x1600/2024/05/11/1715421775198.jpg', 'First time seeing the northern lights!', 2),
('https://www.sunset.com/wp-content/uploads/northern-lights-solar-max-aurora-over-trees-unsplash-1023-1200x600.jpg', 'Perfect conditions for aurora viewing', 3),
('https://th-thumbnailer.cdn-si-edu.com/ovA_2gUEh4HQVaHpGSDQ0CI-u8U=/fit-in/1200x0/filters:focal(360x240:361x241)/https://tf-cmsv2-smithsonianmag-media.s3.amazonaws.com/filer_public/47/ed/47ed2f31-f77b-4c3f-a20a-574bc1a8c214/sinha2_aurorasaurus_pho_20240411.jpg', 'Another beautiful night under the lights', 2);