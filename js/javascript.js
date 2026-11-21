const modal = document.getElementById('productModal')
const openButton = document.getElementById('openModal')
const closeButton = document.getElementById('closeModal')
const saveButton = document.getElementById('saveProduct')

openButton.addEventListener('click', function () {
    modal.style.display = 'flex';
    document.getElementById('productForm').reset();
});

closeButton.addEventListener('click', function () {
    modal.style.display = 'none';
});

let products = []
let editIndex = null;


saveButton.addEventListener('click', async function () {
    var productName = document.getElementById('productName').value.trim();
    var unit = Number(document.getElementById('productUnit').value);
    var price = Number(document.getElementById('productPrice').value);
    

    if (productName === '') {
        alert('Product name is required');
        return;
    } if (document.getElementById('productPrice').value.trim() === '' || !Number.isFinite(price) || price<=0) {
        alert('Enter a valid price greater than zero');
        return;
    }

    const product = {
        name : productName,
        uom_id : unit,
        price_per_unit : price
    };

    try{
        const isEditing = editIndex !== null;

        const url = isEditing ? 'http://127.0.0.1:5000/api/products/'+ editIndex : 'http://127.0.0.1:5000/api/products';


        const response = await fetch(url,{
            method : isEditing ? 'PUT' : 'POST',  // ternary operator: condition ? value_if_true : value_if_false
            headers : {
                'Content-type': 'application/json'
            }, 
            body : JSON.stringify(product)
        })

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Could not add product');
            return;
        }

        alert(isEditing ? 'Product Updated Successfully' : 'Product Added Successfully');

        editIndex = null;
        document.getElementById('productForm').reset()
        modal.style.display = 'none'

        await loadProducts();

    } catch(error){
        console.error('Error adding product:', error);
        alert('Could Not connect to the backend. Check whether the Flask running');
    }
});

function displayProducts(products) {
    const tableBody = document.querySelector('tbody');

    tableBody.innerHTML = '';

    products.forEach(function(product){
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = product.name;

        const unitCell = document.createElement('td');
        unitCell.textContent = product.uom_name;

        const priceCell = document.createElement('td');
        priceCell.textContent = product.price_per_unit;

        const actionCell = document.createElement('td');
        actionCell.classList.add('action-buttons');

        const editButton = document.createElement('button');
        editButton.classList.add('edit-button');
        editButton.dataset.id = product.product_id;
        editButton.textContent = 'Edit';

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.dataset.id = product.product_id;
        deleteButton.textContent = 'Delete';

        actionCell.append(editButton, deleteButton);
        row.append(nameCell, unitCell, priceCell, actionCell);
        tableBody.appendChild(row);
    });
}

document.querySelector('tbody').addEventListener('click',async function(event){
    if(event.target.classList.contains('edit-button')){
        const productId = Number(event.target.dataset.id);
        editProduct(productId);
    }

    if(event.target.classList.contains('delete-button')){
        const productId = Number(event.target.dataset.id);

        const confirmed = confirm('Are you sure you want to delete this product?');
        if(!confirmed){
            return;
        }
        try{
            const response = await fetch(
                'http://127.0.0.1:5000/api/products/' + productId,
                {method: 'DELETE'}
            );

            const data = await response.json();

            if (!response.ok){
                alert(data.error || 'Could not delete product');
                return;
            }

            alert('Product Deleted successfully');
            await loadProducts();
        }catch(error){
            console.error('Error deleting product:', error);
            alert('Could not connect to backend');
        }
    }
    
});


function editProduct(productId) {
    const product = products.find(function (item) {
        return item.product_id === productId;
    });

    if (!product) {
        alert('Product not found');
        return;
    }

    editIndex = productId;

    document.getElementById('productName').value = product.name;
    document.getElementById('productUnit').value = product.uom_id;
    document.getElementById('productPrice').value = product.price_per_unit;

    modal.style.display = 'flex';
}



async function loadProducts(){
    const response = await fetch('http://127.0.0.1:5000/api/products');
    products = await response.json();

    displayProducts(products);
}

loadProducts();
