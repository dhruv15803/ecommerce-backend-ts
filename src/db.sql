CREATE TABLE users (
    userid BIGSERIAL PRIMARY KEY,
    username VARCHAR(155) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    firstname VARCHAR(90) NOT NULL,
    lastname VARCHAR(150) NOT NULL,
    address_field_1 TEXT,
    address_field_2 TEXT,
    address_field_3 TEXT,
    isAdmin BOOLEAN DEFAULT FALSE
);

CREATE TABLE productCategories (
    productCategoryId BIGSERIAL PRIMARY KEY,
    categoryName VARCHAR(155) UNIQUE NOT NULL
);

CREATE TABLE subCategories (
    subCategoryId BIGSERIAL PRIMARY KEY,
    subCategoryName VARCHAR(155) NOT NULL,
    productCategoryId BIGSERIAL NOT NULL,
    FOREIGN KEY(productCategoryId) REFERENCES productCategories(productCategoryId)
);

CREATE TABLE products (
    productId BIGSERIAL PRIMARY KEY,
    productName VARCHAR(455) NOT NULL,
    productDescription VARCHAR(855) NOT NULL,
    productPrice INTEGER NOT NULL,
    productStock SMALLINT NOT NULL,
    productCategoryId BIGSERIAL NOT NULL,
    subCategoryId BIGSERIAL,
    FOREIGN KEY(productCategoryId) REFERENCES productCategories(productCategoryId),
    FOREIGN KEY(subCategoryId)REFERENCES subCategories(subCategoryId)
);

CREATE TABLE cart (
    cartId BIGSERIAL PRIMARY KEY,
    productId BIGSERIAL NOT NULL,
    itemQty INTEGER DEFAULT 1,
    userid BIGSERIAL NOT NULL,
    FOREIGN KEY(productId) REFERENCES products(productId),
    FOREIGN KEY(userid) REFERENCES users(userid)
);
