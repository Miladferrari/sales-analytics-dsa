-- Sample seed data for testing
-- This will create sample sales reps for your team

INSERT INTO sales_reps (name, email, telegram_id, qualification_status) VALUES
    ('John Smith', 'john.smith@example.com', NULL, 'qualified'),
    ('Sarah Johnson', 'sarah.johnson@example.com', NULL, 'qualified'),
    ('Michael Chen', 'michael.chen@example.com', NULL, 'qualified'),
    ('Emily Davis', 'emily.davis@example.com', NULL, 'qualified'),
    ('David Martinez', 'david.martinez@example.com', NULL, 'qualified'),
    ('Jessica Brown', 'jessica.brown@example.com', NULL, 'qualified'),
    ('Robert Wilson', 'robert.wilson@example.com', NULL, 'qualified'),
    ('Amanda Taylor', 'amanda.taylor@example.com', NULL, 'qualified'),
    ('Chris Anderson', 'chris.anderson@example.com', NULL, 'unqualified'),
    ('Lauren Thomas', 'lauren.thomas@example.com', NULL, 'unqualified'),
    ('Kevin Jackson', 'kevin.jackson@example.com', NULL, 'unqualified'),
    ('Nicole White', 'nicole.white@example.com', NULL, 'unqualified'),
    ('Daniel Harris', 'daniel.harris@example.com', NULL, 'unqualified'),
    ('Rachel Martin', 'rachel.martin@example.com', NULL, 'unqualified'),
    ('Brandon Lee', 'brandon.lee@example.com', NULL, 'unqualified'),
    ('Melissa Thompson', 'melissa.thompson@example.com', NULL, 'unqualified')
ON CONFLICT (email) DO NOTHING;

-- Note: Call data will be automatically populated when webhooks are received from Fathom.ai
