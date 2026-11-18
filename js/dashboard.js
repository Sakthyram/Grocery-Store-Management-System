const orderTableBody = document.getElementById('ordersTableBody');

async function loadOrders() {
    try{
        const response = await fetch('http://127.0.0.1:5000/api/orders');

        if (!response.ok){
            throw new Error('Failed to fetch orders');
        }

        const orders = await response.json()

        orderTableBody.innerHTML = "";

        if (orders.length === 0){
            const row = document.createElement('tr');

            const cell = document.createElement('td');

            cell.colSpan = 4;
            cell.textContent = 'No order found';

            row.appendChild(cell);
            orderTableBody.appendChild(row);
            return;
        }

        orders.forEach(order =>{
            const row = document.createElement('tr');

            const dateCell = document.createElement('td');
            dateCell.textContent = order.order_date;

            const orderIdCell = document.createElement('td');
            orderIdCell.textContent = order.orders_id;

            const customerCell = document.createElement('td');
            customerCell.textContent = order.customer_name;

            const totalCell = document.createElement('td');
            totalCell.textContent = Number(order.total).toFixed(2);

            row.append(dateCell, orderIdCell, customerCell, totalCell);
            orderTableBody.appendChild(row);
        });
    }catch(error){
        console.error('Error loading orders:', error);
    }
}

loadOrders();