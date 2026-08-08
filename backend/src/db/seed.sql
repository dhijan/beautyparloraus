INSERT INTO client_reviews (
  client_name,
  service_name,
  location,
  rating,
  review_text,
  avatar_letter,
  is_featured,
  display_order
)
VALUES
(
  'Sophia Anderson',
  'Brow Lamination',
  'Roselands',
  5,
  'I have been coming to Brow Beauty Hub for over a year and the results are always flawless. My brow lamination lasts so long and the team really takes the time to shape them perfectly for my face.',
  'S',
  TRUE,
  1
),
(
  'Emily Chen',
  'Lash Extensions',
  'Hurstville',
  5,
  'I had my lash extensions done at the Hurstville branch and I am obsessed. They looked so natural yet full, exactly what I asked for.',
  'E',
  TRUE,
  2
),
(
  'Rachel Patel',
  'Facial',
  'Hornsby',
  5,
  'The deep cleanse facial at Brow Beauty Hub is incredible. My skin was glowing for weeks and the staff were very knowledgeable.',
  'R',
  TRUE,
  3
);

INSERT INTO homepage_stats (
  stat_value,
  stat_suffix,
  stat_label,
  display_order,
  is_active
)
VALUES
('5000', '+', 'Happy Clients', 1, TRUE),
('3', '', 'Locations in Sydney', 2, TRUE),
('10', '+', 'Specialist Therapists', 3, TRUE),
('20', '+', 'Beauty Treatments', 4, TRUE)
ON CONFLICT DO NOTHING;
