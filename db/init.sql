CREATE TABLE IF NOT EXISTS interfaces (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sender_app_id VARCHAR(50) NOT NULL,
    sender_app_name VARCHAR(255) NOT NULL,
    receiver_app_id VARCHAR(50) NOT NULL,
    receiver_app_name VARCHAR(255) NOT NULL,
    transfer_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    sla VARCHAR(20) NOT NULL DEFAULT 'TBD',
    impact VARCHAR(20) NOT NULL DEFAULT 'Medium',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sender_app ON interfaces(sender_app_id, sender_app_name);
CREATE INDEX IF NOT EXISTS idx_receiver_app ON interfaces(receiver_app_id, receiver_app_name);
CREATE INDEX IF NOT EXISTS idx_status ON interfaces(status); 