CREATE TABLE interfaces (
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
    sla VARCHAR(20) NOT NULL,
    impact VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sender_app ON interfaces(sender_app_id, sender_app_name);
CREATE INDEX idx_receiver_app ON interfaces(receiver_app_id, receiver_app_name);
CREATE INDEX idx_status ON interfaces(status);