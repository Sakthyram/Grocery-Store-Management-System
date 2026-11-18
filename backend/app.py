from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import math
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

@app.route("/")
def home():
    return "GSMS Backend is running!"

@app.route("/api/products",methods=["GET"])
def get_products():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    query =  """
    SELECT
        products.product_id,
        products.name,
        products.uom_id,
        products.price_per_unit,
        uom.uom_name
    FROM products
    JOIN uom ON products.uom_id = uom.uom_id
"""
    cursor.execute(query)
    products = cursor.fetchall()
    cursor.close()
    connection.close()

    return jsonify(products)

@app.route("/api/products", methods=["POST"])
def add_product():
    data = request.get_json()

    name = data.get("name")
    uom_id = data.get("uom_id")
    price_per_unit = data.get("price_per_unit")

    if not name or uom_id is None or price_per_unit is None:
        return jsonify({"error": "All fields are required"}),400

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO products (name,uom_id,price_per_unit)
    VALUES (%s,%s,%s)
    """
    cursor.execute(query,(name,uom_id,price_per_unit))
    connection.commit()

    new_product_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Product Added Sucessfully",
        "product_id": new_product_id
        }),201

@app.route("/api/products/<int:product_id>",methods=["PUT"])
def update_product(product_id):
    data = request.get_json()

    name = data.get('name')
    uom_id = data.get('uom_id')
    price_per_unit = data.get('price_per_unit')

    if not name or uom_id is None or price_per_unit is None:
        return jsonify({"error": "All fields are required"}),400

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    UPDATE products 
    SET name = %s, uom_id = %s, price_per_unit = %s
    WHERE product_id = %s;
    """
    cursor.execute(query,(name,uom_id,price_per_unit,product_id))
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Product Edited Successfully",
        "product_id": product_id
        }),200

@app.route("/api/products/<int:product_id>", methods = ["DELETE"])
def delete_product(product_id):
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT COUNT(*) FROM order_details WHERE product_id = %s",(product_id,))

    result = cursor.fetchone()

    if result[0]>0:
        cursor.close()
        connection.close()
        return jsonify({
            "error" : "Cannot delete this product because it is used in the existing product"
            }), 409

    query = """
    DELETE FROM products 
    WHERE product_id = %s;
    """
    cursor.execute(query,(product_id,))
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Product Deleted Successfully",
        "product_id": product_id
    }),200

@app.route("/api/orders", methods=["POST"])
def add_order():
    data = request.get_json(silent = True)

    if not isinstance(data,dict):
        return jsonify({"error":"Invalid JSON data"}), 400

    customer_name = data.get("customer_name")
    order_details = data.get("order_details")

    if not isinstance(customer_name,str) or not customer_name.strip():
        return jsonify({"error":"Customer is required"}), 400

    if not isinstance(order_details,list) or len(order_details) == 0:
        return jsonify({"error":"At least one product is required"}),400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        grand_total=0
        calculated_items = []
        for item in order_details:
            raw_product_id = item["product_id"]

            if isinstance(raw_product_id, bool):
                raise ValueError

            product_id = int(raw_product_id)

            if str(product_id) != str(raw_product_id).strip():
                raise ValueError

            quantity =  float(item["quantity"])

            if product_id <=0 or not math.isfinite(quantity) or quantity <=0:
                raise ValueError

            price_query = """
            SELECT price_per_unit
            FROM products
            WHERE product_id = %s
            """
            cursor.execute(price_query,(product_id,))

            result = cursor.fetchone()

            if result is None:
                raise ValueError("Product not found")

            price =float(result[0])

            if not math.isfinite(price) or price <= 0:
                raise ValueError

            item_total = price * quantity
            grand_total+=item_total

            calculated_items.append({
                "product_id" : product_id,
                "quantity" : quantity,
                "total_price" : item_total
            })

        order_query = """
        INSERT INTO orders (customer_name, total, datetime)
        VALUES (%s,%s, NOW())
        """
        cursor.execute(order_query,(customer_name.strip(),grand_total))

        order_id = cursor.lastrowid

        
        order_details_query ="""
        INSERT INTO order_details 
        (order_id, product_id, quantity, total_price)
        VALUES (%s,%s,%s,%s)
        """
        for item in calculated_items:
            cursor.execute(order_details_query,(
                order_id,
                item["product_id"],
                item["quantity"],
                item["total_price"]
            ))

        connection.commit()

        return jsonify({
            "message" : "Order saved successfully",
            "order_id": order_id
        }),201

    except (ValueError,TypeError,KeyError):
        if connection is not None:
            connection.rollback()

        return jsonify({"error":"Invalid order details"}), 400

    except Exception as e:
        if connection is not None:
            connection.rollback()

        print("Error saving order", e)
        return jsonify({"error" : "Failed to save order"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()

@app.route("/api/orders", methods = ["GET"])
def get_order():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT 
        orders_id,
        customer_name,
        total,
        DATE_FORMAT(datetime, '%d-%m-%Y %h:%i %p') AS order_date
    FROM orders
    ORDER BY datetime DESC
    """
    cursor.execute(query)
    orders = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(orders)

if __name__ == "__main__":
    app.run(debug=True)