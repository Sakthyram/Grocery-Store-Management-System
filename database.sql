
CREATE DATABASE IF NOT EXISTS gs;

USE gs;


-- 1. Units of Measurement
CREATE TABLE uom (
    uom_id INT NOT NULL AUTO_INCREMENT,
    uom_name VARCHAR(45) NOT NULL,
    PRIMARY KEY (uom_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Insert default units
INSERT INTO uom (uom_id, uom_name)
VALUES
(1, 'Each'),
(2, 'Kg');


-- 2. Products
CREATE TABLE products (
    product_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    uom_id INT NOT NULL,
    price_per_unit DOUBLE NOT NULL,
    PRIMARY KEY (product_id),
    KEY fk_uom_id_idx (uom_id),
    CONSTRAINT fk_uom_id
        FOREIGN KEY (uom_id)
        REFERENCES uom (uom_id)
        ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. Orders
CREATE TABLE orders (
    orders_id INT NOT NULL AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    total DOUBLE NOT NULL,
    `datetime` DATETIME NOT NULL,
    PRIMARY KEY (orders_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 4. Order Details
CREATE TABLE order_details (
    order_detail_id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DOUBLE NOT NULL,
    total_price DOUBLE NOT NULL,
    PRIMARY KEY (order_detail_id),
    KEY fk_product_id_idx (product_id),
    KEY fk_order_id (order_id),
    CONSTRAINT fk_order_id
        FOREIGN KEY (order_id)
        REFERENCES orders (orders_id)
        ON UPDATE RESTRICT,
    CONSTRAINT fk_product_id
        FOREIGN KEY (product_id)
        REFERENCES products (product_id)
        ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
