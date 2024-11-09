CREATE TABLE interfaces (
    id VARCHAR(64) PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    eim_interface_id VARCHAR(20),
    interface_name VARCHAR(255) NOT NULL,
    send_app_id VARCHAR(50) NOT NULL,
    send_app_name VARCHAR(255) NOT NULL,
    received_app_id VARCHAR(50) NOT NULL,
    received_app_name VARCHAR(255) NOT NULL,
    transfer_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    technology VARCHAR(100),
    pattern VARCHAR(100),
    sla VARCHAR(20) DEFAULT 'TBD',
    priority VARCHAR(20) DEFAULT 'Low',
    interface_status VARCHAR(20) DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_send_app ON interfaces(send_app_id);
CREATE INDEX idx_received_app ON interfaces(received_app_id);
CREATE INDEX idx_interface_status ON interfaces(interface_status);