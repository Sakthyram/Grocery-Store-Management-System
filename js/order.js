const addMoreButton = document.getElementById('addMoreButton');

const productRowTemplate = document.getElementById('productRowTemplate');

const itemsInOrder = document.getElementById('itemsInOrder');

addMoreButton.addEventListener('click', function () {
    const row = productRowTemplate.content.cloneNode(true);

    itemsInOrder.appendChild(row)
})

let products = []

async function loadproducts() {

    try {
        const response = await fetch('http://127.0.0.1:5000/api/products');

        if (!response.ok) {
            throw new Error('Failed to load products');
        }

        products = await response.json();

        const template = document.querySelector('#productRowTemplate');

        const templateDropdown = template.content.querySelector('.cart-product');

        populateProductDropdown(templateDropdown);

        console.log(products)
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Could not load products');
    }
}

loadproducts()

function populateProductDropdown(selectElement) {

    products.forEach(function (product) {
        const option = document.createElement('option');

        option.value = product.product_id;
        option.textContent = product.name;

        selectElement.appendChild(option);
    });
}

itemsInOrder.addEventListener('click', function (event) {
    if (event.target.classList.contains('remove-row')) {
        const row = event.target.closest('.product-row');

        row.remove()
        calculateGrandTotal();
    }
});

itemsInOrder.addEventListener('change', function (event) {
    if (event.target.classList.contains('cart-product')) {
        const selectedProductId = Number(event.target.value);

        const selectedProduct = products.find(function (product) {
            return Number(product.product_id) === selectedProductId;
        });

        const row = event.target.closest('.product-row');

        const priceInput = row.querySelector('.product-price');

        if (selectedProduct) {
            priceInput.value = selectedProduct.price_per_unit;
        } else {
            priceInput.value = 0.00;
        }

        calculateItemTotal(row);
    }
});

function calculateItemTotal(row) {
    const price = Number(row.querySelector('.product-price').value);

    const quantity = Number(row.querySelector('.product-qty').value);

    const itemTotal = price * quantity;

    row.querySelector('.product-total').value = itemTotal.toFixed(2);

    calculateGrandTotal();
}

itemsInOrder.addEventListener('input', function (event) {
    if (event.target.classList.contains('product-qty')) {
        const row = event.target.closest('.product-row');

        calculateItemTotal(row);
    }
});

function calculateGrandTotal() {
    const row = itemsInOrder.querySelectorAll('.product-row');

    let grandTotal = 0;

    row.forEach(function (row) {
        const itemTotal = Number(row.querySelector('.product-total').value);

        grandTotal += itemTotal;
    });
    document.querySelector('#grandTotal').value = grandTotal.toFixed(2);
}



const saveOrderButton = document.querySelector('#saveOrder');
const customerNameInput = document.querySelector('#customerName');
const grandTotalInput = document.querySelector('#grandTotal');

saveOrderButton.addEventListener('click',async function (event) {
    const customerName = customerNameInput.value.trim()

    const rows = document.querySelectorAll('.product-row');

    if (customerName === '') {
        alert('Please Enter Customer name');
        return;
    }

    if (rows.length === 0) {
        alert('Please add at least one product');
        return;
    }

    const orderDetails = [];

    rows.forEach(function (row) {
        const productId = row.querySelector('.cart-product').value;
        const quantity = Number(row.querySelector('.product-qty').value);
        const itemTotal = Number(row.querySelector('.product-total').value);

        orderDetails.push({
            product_id: Number(productId),
            quantity: quantity,
        });
    });
    const requestPayload = {
        customer_name: customerName,
        grand_total: Number(grandTotalInput.value),
        order_details: orderDetails
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        })

        const data = await response.json()

        if (!response.ok) {
            alert(data.error || 'Could not add order');
            return;
        }

        alert('Order added Successfully! Order ID:' + data.order_id);
        resetOrderForm();

    } catch (error) {
        console.error('Error adding order:', error);
        alert('Could not connect to backend, Check whether the Flask is running');
    }
});

function resetOrderForm() {

    // Clear customer name
    customerNameInput.value = '';

    // Remove all product rows
    itemsInOrder.innerHTML = '';

    // Reset grand total
    grandTotalInput.value = '0.00';

    // Add one fresh product row
    addMoreButton.click();
}