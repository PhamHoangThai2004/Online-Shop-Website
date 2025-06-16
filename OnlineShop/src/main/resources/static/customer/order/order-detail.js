const urlParams = new URLSearchParams(window.location.search);
let userId;

document.addEventListener('DOMContentLoaded', () => {
    const reviewDialog = document.getElementById('review-dialog');
    const reviewComment = document.getElementById('review-comment');
    getUserInfo();
    getOrderDetail();
});

async function getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
        alert('Vui lòng đăng nhập để xem chi tiết đơn hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/auth/user/info', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userInfo = await response.json();
            userId = userInfo.id
            if (userInfo && userInfo.fullName) {
                document.getElementById('userInfo').textContent = `Xin chào, ${userInfo.fullName}`;
            } else {
                document.getElementById('userInfo').textContent = 'Xin chào';
            }
        } else {
            const errorText = await response.text();
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = '/auth/login.html';
            } else {
                alert(`Lỗi khi lấy thông tin người dùng: ${errorText}`);
            }
        }
    } catch (error) {
        alert('Lỗi kết nối đến server khi lấy thông tin người dùng. Vui lòng kiểm tra server!');
    }
}

async function getOrderDetail() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để xem chi tiết đơn hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    const orderId = urlParams.get('orderId');
    if (!orderId) {
        alert('Không tìm thấy mã đơn hàng!');
        window.location.href = '/customer/order/order-list.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const order = await response.json();
            displayOrderDetail(order);
        } else {
            const errorText = await response.text();
            alert(`Lỗi khi lấy chi tiết đơn hàng: ${errorText}`);
            window.location.href = '/customer/order/order-list.html';
        }
    } catch (error) {
        alert('Lỗi kết nối đến server khi lấy chi tiết đơn hàng. Vui lòng kiểm tra server!');
        window.location.href = '/customer/order/order-list.html';
    }
}

let currentProductId = null;
let selectedRating = 0;

function displayOrderDetail(order) {
    const reviewHeader = document.getElementById('review-header');
    const orderItems = document.getElementById('order-items');
    const actionButtons = document.getElementById('action-buttons');

    document.getElementById('order-id').textContent = order.id;
    document.getElementById('order-date').textContent = new Date(order.createdAt).toLocaleDateString('vi-VN');
    document.getElementById('total-price').textContent = order.totalPrice.toLocaleString('vi-VN') + ' VNĐ';
    document.getElementById('order-status').textContent = order.status;

    if (orderItems) {
        orderItems.innerHTML = '';

        if (order.items && order.items.length === 0) {
            orderItems.innerHTML = `<tr><td colspan="5" style="text-align: center;">Không có sản phẩm nào trong đơn hàng.</td></tr>`;
            return;
        }

        if (order.items) {
            order.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.productName || 'Không có tên'}</td>
                    <td>${item.price ? item.price.toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${item.price && item.quantity ? (item.price * item.quantity).toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}</td>
                    <td><span class="review-link" onclick="openReviewDialog(${item.productId || 0}, '${order.status}')">Đánh giá</span></td>
                `;
                orderItems.appendChild(row);
            });
        }
    }

    if (actionButtons) {
        actionButtons.innerHTML = '';
        if (order.status === 'PENDING') {
            const cancelBtn = document.createElement('button');
            cancelBtn.classList.add('cancel-btn');
            cancelBtn.textContent = 'Hủy Đơn Hàng';
            cancelBtn.onclick = () => cancelOrder(order.id);
            actionButtons.appendChild(cancelBtn);
        } else if (order.status === 'CANCELLED' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
            const reorderBtn = document.createElement('button');
            reorderBtn.classList.add('reorder-btn');
            reorderBtn.textContent = 'Mua Lại';
            reorderBtn.onclick = () => reorder(order.items);
            actionButtons.appendChild(reorderBtn);
        }
        const backBtn = document.createElement('button');
        backBtn.classList.add('back-btn');
        backBtn.textContent = 'Quay Lại';
        backBtn.onclick = goBack;
        actionButtons.appendChild(backBtn);
    }
}

function openReviewDialog(productId, orderStatus) {
    currentProductId = productId;
    selectedRating = 0;


    if (orderStatus !== 'DELIVERED') {
        alert('Yêu cầu nhận được hàng mới có thể đánh giá!');
        return;
    }

    const reviewComment = document.getElementById('review-comment');
    const reviewDialog = document.getElementById('review-dialog');

    if (!reviewDialog) {
        alert('Lỗi: Không tìm thấy dialog review!');
        return;
    }

    if (reviewComment) {
        reviewComment.value = '';
    } else {
        console.error('Review comment textarea not found');
    }

    const stars = document.querySelectorAll('.star');
    if (stars.length === 0) {
        console.error('No stars found for rating');
    }
    stars.forEach(star => {
        star.removeEventListener('click', handleStarClick);
        star.classList.remove('selected');
        star.addEventListener('click', handleStarClick);
    });

    reviewDialog.classList.add('show');
    reviewDialog.style.display = 'flex !important';
}

function handleStarClick(event) {
    const star = event.currentTarget;
    selectedRating = parseInt(star.getAttribute('data-value'));
    const stars = document.querySelectorAll('.star');
    stars.forEach(s => s.classList.remove('selected'));
    for (let i = 0; i < selectedRating; i++) {
        stars[i].classList.add('selected');
    }
}

function closeReviewDialog() {
    const reviewDialog = document.getElementById('review-dialog');
    if (reviewDialog) {
        reviewDialog.classList.remove('show'); // Xóa class .show khi đóng
        reviewDialog.style.display = 'none';
        currentProductId = null;
        selectedRating = 0;
        location.reload()
    }
}

async function submitReview() {
    if (!currentProductId) {
        alert('Lỗi: Không xác định được sản phẩm để review!');
        return;
    }

    if (selectedRating === 0) {
        alert('Vui lòng chọn số sao để đánh giá!');
        return;
    }

    const comment = document.getElementById('review-comment')?.value.trim();
    if (!comment) {
        alert('Vui lòng nhập bình luận!');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để gửi review!');
        window.location.href = '/auth/login.html';
        return;
    }

    const reviewData = {
        userId: userId,
        rating: selectedRating,
        comment: comment
    };

    try {
        const response = await fetch(`http://localhost:8080/api/products/${currentProductId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reviewData)
        });

        if (response.ok) {
            alert('Gửi đánh giá thành công!');
            closeReviewDialog();
        } else {
            const errorText = await response.text();
            console.error('API Error (submitReview) - Status:', response.status, 'Message:', errorText);
            alert(`Lỗi khi gửi đánh giá: ${errorText}`);
        }
    } catch (error) {
        alert('Lỗi kết nối đến server khi gửi review. Vui lòng kiểm tra server!');
    }
}

async function cancelOrder(orderId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để hủy đơn hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Hủy đơn hàng thành công!');
            getOrderDetail();
        } else {
            const errorText = await response.text();
            alert(`Lỗi khi hủy đơn hàng: ${errorText}`);
        }
    } catch (error) {
        alert('Lỗi kết nối đến server khi hủy đơn hàng. Vui lòng kiểm tra server!');
    }
}

async function reorder(items) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để mua lại đơn hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    try {
        for (const item of items) {
            if (typeof item.productId === 'undefined' || typeof item.quantity === 'undefined') {
                alert(`Sản phẩm ${item.productName || 'không xác định'} thiếu thông tin để thêm vào giỏ hàng.`);
                continue;
            }
            const response = await fetch(`http://localhost:8080/api/cart/add?productId=${item.productId}&quantity=${item.quantity}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert(`Lỗi khi thêm sản phẩm ${item.productName || 'không xác định'} vào giỏ hàng: ${errorText}`);
                return;
            }
        }

        alert('Đã thêm tất cả sản phẩm vào giỏ hàng!');
        window.location.href = '/customer/cart/cart.html';
    } catch (error) {
        alert('Lỗi kết nối đến server khi mua lại đơn hàng. Vui lòng kiểm tra server!');
    }
}

function goBack() {
    window.location.href = '/customer/order/order-list.html';
}

function log_out() {
    localStorage.removeItem('token');
    window.location.href = '/auth/login.html';
}